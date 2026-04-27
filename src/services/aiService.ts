import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function getLocalInfo(area: string, language: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a local information assistant for the app InformMe. 
      The user is in ${area}, India. Their preferred language is ${language}.
      Provide a summary of:
      1. Local weather today in ${area}.
      2. Top 2-3 local news headlines for ${area} or surrounding region.
      3. Upcoming local events or festivals in the next week.
      
      Format the response strictly as a JSON object:
      {
        "weather": { "temp": "25°C", "condition": "Sunny", "description": "Hot and humid" },
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
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
}
