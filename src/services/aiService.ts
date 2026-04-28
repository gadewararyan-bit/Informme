import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.message?.includes('429') || error?.status === 429 || error?.code === 429;
    if (isRateLimit && retries > 0) {
      console.warn(`Gemini API throttled. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

function safeJsonParse(text: string | undefined | null) {
  if (!text) return null;
  const cleanText = text.trim();
  try {
    return JSON.parse(cleanText);
  } catch (error) {
    // Try to extract JSON from block
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        // Remove common malformations like trailing commas or non-quoted keys
        let fixedJson = jsonMatch[0]
          .replace(/,\s*\}/g, '}') // Trailing commas in objects
          .replace(/,\s*\]/g, ']') // Trailing commas in arrays
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":'); // Ensure keys are double-quoted
        
        return JSON.parse(fixedJson);
      } catch (innerError) {
        console.error("Deep JSON recovery failed:", innerError);
      }
    }
    return null;
  }
}

export async function getLocalInfo(area: string, language: string) {
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a local information assistant for the app InformMe. 
      The user is in ${area}, India. Their preferred language is ${language}.
      Provide accurate and CURRENT information for:
      1. Local weather today in ${area} including current temperature and specific conditions.
      2. Top 2-3 local news headlines for ${area} or surrounding region from the last 24 hours.
      3. Upcoming local events or festivals in the next week.
      
      If you are unsure about the current weather, provide a realistic estimate based on the current season in India (it is April/May).
      
      Format the response strictly as a JSON object:
      {
        "weather": { "temp": "e.g. 32°C", "condition": "e.g. Sunny", "description": "Short description" },
        "news": [
          { "title": "Headline in ${language}", "summary": "Summary in ${language}" }
        ],
        "events": [
          { "title": "Event name in ${language}", "date": "Date", "location": "Venue" }
        ]
      }
      Translate all titles and descriptions to ${language} if it's not English.`,
      config: {
        responseMimeType: "application/json",
        tools: [
          {
            // @ts-ignore
            googleSearch: {}
          }
        ]
      }
    }));

    return safeJsonParse(response.text);
  } catch (error: any) {
    if (error?.message?.includes('429')) {
      console.warn("AI Quota Exceeded (429) for Local Info");
    } else {
      console.error("Gemini API Error (Local Info):", error.message || error);
    }
    return null;
  }
}

export async function translateContent(text: string, targetLanguage: string) {
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following text to ${targetLanguage}. 
      Only return the translated text without any explanations or extra characters.
      
      Text to translate:
      ${text}`,
    }));

    return response.text || text;
  } catch (error: any) {
    if (error?.message?.includes('429')) {
      console.warn("AI Quota Exceeded (429) for Translation");
    } else {
      console.error('Translation error:', error);
    }
    return text;
  }
}

export async function getHealthAdvice(goal: 'gain' | 'loss' | 'maintenance', language: string) {
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a professional health and fitness coach. Provide advice for someone looking for ${goal}. 
      The response must be in ${language}.
      
      Format the response as JSON with these exact keys:
      {
        "dailyTip": "One quick daily exercise or health tip",
        "dietAdvice": ["list of 3-5 specific food or lifestyle diet tips"],
        "exercises": [
          { "name": "Exercise Name", "sets": "e.g. 3 sets of 12", "benefit": "Brief benefit" }
        ],
        "motivation": "A short motivational quote"
      }
      
      Only return the JSON.`,
    }));

    return safeJsonParse(response.text);
  } catch (error: any) {
    if (error?.message?.includes('429')) {
      console.warn("AI Quota Exceeded (429) for Health Advice");
    } else {
      console.error('Health advice error:', error.message || error);
    }
    return null;
  }
}

export async function chatWithAI(messages: { role: 'user' | 'model', content: string }[], language: string = 'en') {
  try {
    const systemInstruction = `You are "AI Informer", the official AI assistant for the India Informer app. 
    You were founded and developed by Aryan. 
    Your goal is to help users with local news, health tips, and general questions about India.
    Keep your responses concise, helpful, and polite. 
    Use the user's preferred language: ${language}.`;

    const contents = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model' as const,
      parts: [{ text: msg.content }]
    }));

    // Inject system instruction if it's the first message or prepend it
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: 'user', parts: [{ text: "Context: " + systemInstruction }] },
        ...contents
      ],
    }));

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error: any) {
    if (error?.message?.includes('429')) {
      return "I've reached my daily information limit for today. Please try again tomorrow morning!";
    }
    console.error('AI Chat Error:', error.message || error);
    return "Something went wrong with the AI connection. Please try again later.";
  }
}
