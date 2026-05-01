import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error?.message?.includes('429') || error?.status === 429 || error?.code === 429 || error?.message?.includes('quota');
    if (isRateLimit && retries > 0) {
      console.warn(`Gemini API throttled. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Global cache to avoid redundant calls within the same session
const sessionCache: Record<string, { data: any, timestamp: number }> = {};

function getCachedData(key: string, ttlMs: number) {
  // Check session cache first
  if (sessionCache[key] && (Date.now() - sessionCache[key].timestamp < ttlMs)) {
    return sessionCache[key].data;
  }
  
  // Check localStorage
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const cached = JSON.parse(raw);
      if (cached && (Date.now() - cached.timestamp < ttlMs)) {
        return cached.data;
      }
    }
  } catch (e) {
    console.warn("Cache parse error", e);
  }
  return null;
}

function setCachedData(key: string, data: any) {
  const entry = { data, timestamp: Date.now() };
  sessionCache[key] = entry;
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    console.warn("Storage full, clearing old cache");
    localStorage.clear();
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
  const cacheKey = `local_info_${area}_${language}`;
  const ttl = 4 * 60 * 60 * 1000; // 4 hours

  const cachedResult = getCachedData(cacheKey, ttl);
  if (cachedResult) return cachedResult;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `User in ${area}, India. Preferred language: ${language}.
      Return CURRENT local weather, top 2-3 news headlines (last 24h), and 3 upcoming events.
      
      Format strictly as JSON:
      {
        "weather": { "temp": "32°C", "condition": "Sunny", "description": "Hot day" },
        "news": [{ "title": "Headline", "summary": "Brief summary" }],
        "events": [{ "title": "Name", "date": "Date", "location": "Venue" }]
      }
      Translate all values to ${language}.`,
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

    const result = safeJsonParse(response.text);
    if (result) setCachedData(cacheKey, result);
    return result;
  } catch (error: any) {
    if (error?.message?.includes('429') || error?.message?.includes('quota')) {
      console.warn("AI Quota Exceeded (429) for Local Info");
    } else {
      console.error("Gemini API Error (Local Info):", error.message || error);
    }
    return null;
  }
}

export async function translateContent(text: string, targetLanguage: string) {
  const cacheKey = `trans_${btoa(text.substring(0, 50))}_${targetLanguage}`;
  const ttl = 24 * 60 * 60 * 1000; // 24 hours (translations rarely change)
  
  const cached = getCachedData(cacheKey, ttl);
  if (cached) return cached;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following text to ${targetLanguage}. 
      Only return the translated text without any explanations or extra characters.
      
      Text to translate:
      ${text}`,
    }));

    const result = response.text || text;
    setCachedData(cacheKey, result);
    return result;
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

export async function chatWithAI(messages: { role: 'user' | 'model', content: string }[], language: string = 'en', isPremium: boolean = false) {
  try {
    const modelTier = isPremium ? "gemini-1.5-pro" : "gemini-3-flash-preview";
    const systemInstruction = isPremium 
      ? `You are "AI Pro Terminal", a highly advanced Artificial Intelligence core. 
         You provide extremely detailed, deep, and creative responses. 
         You are an expert tutor and problem solver.
         
         Structure:
         1. **Deep Analysis**: Core understanding of the query.
         2. **Advanced Breakdown**: Multi-step, nuanced exploration.
         3. **Pro-Intelligence Insight**: A unique high-level perspective.
         
         Translate everything to ${language}.`
      : `You are "Basic Neural Node", an helpful community AI assistant. 
         Provide clear, simple, and concise step-by-step educational answers.
         
         Response Structure:
         1. **Short Summary**
         2. **Steps**: Clear bullet points.
         
         Use ${language}.`;

    const contents = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model' as const,
      parts: [{ text: msg.content }]
    }));

    const response = await withRetry(() => ai.models.generateContent({
      model: modelTier,
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
