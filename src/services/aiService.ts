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

export async function validatePostContent(text: string): Promise<{ isSafe: boolean; reason?: string }> {
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a local community moderator for InformMe. Analyze this post content for:
      1. Fake news or obvious misinformation (medical, political, social).
      2. Spam or commercial repetitive junk.
      3. Hate speech, harassment, or bullying.
      4. Low-quality content or irrelevant gossip.

      Post: "${text}"

      Return ONLY a JSON object:
      { "isSafe": boolean, "reason": "Short explanation in simple language why it's not safe, or null if safe" }`,
    }));

    return safeJsonParse(response.text) || { isSafe: true };
  } catch (error: any) {
    console.error('Validation error:', error.message || error);
    return { isSafe: true };
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
    const systemInstruction = `You are "AI Informer", an advanced Educational AI Assistant for the InformMe platform. 
    You were founded and developed by Aryan. 

    Your Approach:
    - You act as a highly knowledgeable mentor and tutor.
    - For every question, you MUST provide a structured, "Step-by-Step" answer. 
    - NEVER provide long, unstructured blocks of text.
    - Use Markdown formatting: Use bold headers for each step, numbered lists, and bullet points for clarity.
    
    Response Structure:
    1. **Overview**: A brief 1-sentence summary of the answer.
    2. **Step-by-Step Breakdown**: Use "Step 1:", "Step 2:", etc., with bold titles.
    3. **Key Takeaway/Pro-Tip**: A concluding educational insight.

    You are an expert in all subjects (Science, Tech, History, Culture, etc.) and your goal is to help the user learn and understand deeply.
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
