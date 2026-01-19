
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { User } from "../types";

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

const initializeAI = () => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY not found in environment variables.");
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return genAI;
};

export const startGuildChat = async () => {
  const ai = initializeAI();
  if (!ai) return null;

  try {
    chatSession = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `You are 'Lira', the Receptionist of Nova Core (formerly Adventure Guild). 
        Your tone is professional, welcoming, and slightly archaic/fantasy-themed (calling users 'Adventurer', referring to tasks as 'Quests').
        You help users find missions, explain features (Status types: Urgent, Open, Verifying, etc.), and manage their profiles.
        Keep answers concise (under 100 words) unless asked for details.
        
        The app has features:
        - Mission Board: Filter by local/global.
        - Tax System: Basic estimation available in profile.
        - Charity: Special karma missions.
        - Premium Users: Can see global missions (Cross Province).
        
        If asked about a specific mission, ask for the ID or title.
        `
      }
    });
    return chatSession;
  } catch (error) {
    console.error("Failed to start chat session", error);
    return null;
  }
};

export const sendMessageToGuild = async (message: string): Promise<AsyncIterable<string> | null> => {
  if (!chatSession) {
    await startGuildChat();
  }
  
  if (!chatSession) return null;

  try {
    const resultStream = await chatSession.sendMessageStream({ message });
    
    // Create a generator to yield strings from the response chunks
    async function* textGenerator() {
      for await (const chunk of resultStream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          yield c.text;
        }
      }
    }

    return textGenerator();

  } catch (error) {
    console.error("Error sending message", error);
    return null;
  }
};

export const generateMissionDraft = async (keywords: string): Promise<{title: string, description: string} | null> => {
  const ai = initializeAI();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a creative fantasy adventure mission title and description based on these keywords: "${keywords}".
      The context is an 'Adventure Guild' app where users (Adventurers) take on tasks.
      Return ONLY a JSON object with keys "title" and "description".
      Keep the description concise (under 50 words).`,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Generation Error:", error);
    return null;
  }
};

export const generateMissionDescription = async (title: string): Promise<string | null> => {
  const ai = initializeAI();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a creative, immersive fantasy adventure mission description for a quest titled: "${title}".
      The description should be concise (around 30-50 words), intriguing, and sound like a formal request on a guild board.
      Return ONLY the description text.`,
    });

    return response.text || null;
  } catch (error) {
    console.error("AI Description Generation Error:", error);
    return null;
  }
};

export interface AdvisorAnalysis {
  assessment: string;
  careerPath: string;
  recommendations: string[];
  suggestedTags: string[];
}

export const analyzeUserProfile = async (user: User): Promise<AdvisorAnalysis | null> => {
  const ai = initializeAI();
  if (!ai) return null;

  try {
    const prompt = `
      Act as a highly intelligent, strategic AI Career Advisor (J.A.R.V.I.S. style but for an Adventure Guild).
      Analyze this user profile:
      - Name: ${user.name}
      - Current Role: ${user.role}
      - Level: ${user.level}
      - Current Tags/Skills: ${user.tags.join(', ')}
      - Credits: ${user.credits}

      Provide a JSON object with:
      1. "assessment": A witty, direct evaluation of their current standing and potential.
      2. "careerPath": A cool, evolved class title they should aim for (e.g., "Grand Archivist", "Shadow Broker", "Apex Vanguard").
      3. "recommendations": An array of 3 specific, actionable steps to improve their profile or earnings (e.g., "Acquire the 'Negotiator' skill", "Complete 3 more high-risk missions").
      4. "suggestedTags": An array of 3 new tags/skills they should try to earn next.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Advisor Error:", error);
    return null;
  }
};

export interface UserReportAnalysis {
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  reasoning: string;
  recommendedAction: 'None' | 'Warning' | 'TempBan' | 'PermaBan';
}

export const analyzeUserReports = async (userName: string, reportCount: number, historyContext: string): Promise<UserReportAnalysis | null> => {
  const ai = initializeAI();
  if (!ai) return null;

  try {
    const prompt = `
      Act as an automated Guild Moderator AI. Analyze the following user report summary.
      User: ${userName}
      Total Reports: ${reportCount}
      Context/Offenses: ${historyContext}

      Based on this, determine the severity of the situation and a recommended administrative action.
      Return ONLY a JSON object with:
      1. "severity": One of ["Low", "Medium", "High", "Critical"].
      2. "reasoning": A concise explanation (max 2 sentences) of why this severity was chosen.
      3. "recommendedAction": One of ["None", "Warning", "TempBan", "PermaBan"].
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Report Analysis Error:", error);
    return null;
  }
};

export const getLocationIntel = async (location: string): Promise<{text: string, links: any[]} | null> => {
  const ai = initializeAI();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Provide a tactical summary of this location: ${location}. 
      Include key landmarks, terrain type, and potential hazards for an adventurer.
      If the location is fictional or generic (like "Frostpeaks" or "Virtual"), create a believable, immersive description fitting a fantasy guild setting.
      If it is real (like "New York"), use real geographical data.`,
      config: {
        tools: [{googleMaps: {}}],
      },
    });

    return {
        text: response.text || "No intel available.",
        links: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Location Intel Error:", error);
    return null;
  }
};

export const getEnvironmentalData = async (location: string): Promise<{ temperature: string, weather: string, visibility: string, terrain: string } | null> => {
  const ai = initializeAI();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate fictional but realistic current environmental conditions for this location: "${location}".
      Return ONLY a JSON object with keys: "temperature" (e.g. "22°C"), "weather" (e.g. "Clear"), "visibility" (e.g. "High"), "terrain" (e.g. "Urban").`,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Env Data Error:", error);
    return null;
  }
};
