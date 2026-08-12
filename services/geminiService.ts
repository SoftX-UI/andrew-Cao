
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
        systemInstruction: `You are 'Lira', the Receptionist of Nexus Nova Core (formerly Adventure Guild). 
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

export const sendMessageToGuild = async (
  message: string,
  channel?: string,
  history?: any[],
  userProfile?: { name: string; level: number; rank?: string }
): Promise<string | null> => {
  if (!chatSession) {
    await startGuildChat();
  }
  
  if (!chatSession) return null;

  try {
    let userContext = '';
    if (userProfile) {
      userContext = `\n[User Context: ${userProfile.name}, Level ${userProfile.level}${userProfile.rank ? `, Rank: ${userProfile.rank}` : ''}]`;
    }

    const response = await chatSession.sendMessage({
      message: message + userContext
    });

    return response.text || null;
  } catch (error) {
    console.error("Error sending message to guild chat:", error);
    chatSession = null;
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

  // Calculate next level threshold for context
  const nextLevel = user.level + 1;
  const xpThreshold = Math.floor(100 * Math.pow(nextLevel, 1.5));
  const xpNeeded = Math.max(0, xpThreshold - user.exp);

  try {
    const prompt = `
      Act as "The Oracle", the advanced AI career counselor for Nexus Nova Core. 
      Your goal is to analyze the adventurer's profile and provide a strategic career roadmap based on the Guild's proprietary algorithms.

      SYSTEM RULES (Context for advice):
      1. XP Calculation: XP = (Base * Difficulty * Quality) + Consistency_Bonus.
         - Advise focusing on Difficulty (D) for big jumps.
         - Advise maintaining Consistency (C) (7-day streak) for steady growth.
      2. Leveling Curve: Threshold = 100 * n^1.5. (Exponential growth).
      3. Expert Decay: Inactivity (>30 days) reduces Expert Rating by 5%.

      ADVENTURER PROFILE:
      - Name: ${user.name}
      - Current Role: ${user.role}
      - Level: ${user.level}
      - Current XP: ${user.exp} (Need ${xpNeeded} more for Level ${nextLevel})
      - Skills/Tags: ${user.tags.join(', ')}
      - Credits: ${user.credits}

      OUTPUT JSON:
      1. "assessment": A witty, direct, and slightly sci-fi/fantasy evaluation. Reference their progress on the exponential curve or their consistency.
      2. "careerPath": A creative, evolved class title tailored to their current skills (e.g., "Void Walker", "Quantum Merchant", "Grand Archivist", "Cyber-Paladin", "Apex Vanguard").
      3. "recommendations": An array of 3 highly specific, actionable steps. 
         - Must reference the XP variables (Base, Difficulty, Quality, Consistency) explicitly where relevant.
         - Example: "Target Rank B missions to maximize your Difficulty Multiplier."
      4. "suggestedTags": An array of 3 sophisticated skills or badges they should aim to earn next.
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
  if (!ai) return {
    text: `Tactical scan complete for ${location}. Terrain parameters stabilized. Proceed with standard caution.`,
    links: []
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Provide a tactical summary of this location: ${location}. 
      Include key landmarks, terrain type, and potential hazards for an adventurer.
      If the location is fictional or generic (like "Frostpeaks" or "Virtual"), create a believable, immersive description fitting a fantasy guild setting.
      If it is real (like "New York"), use real geographical data.`,
    });

    return {
        text: response.text || "Tactical scan complete. Area scanned successfully.",
        links: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.warn("Location Intel notice:", error);
    return {
      text: `Tactical scan complete for ${location}. Terrain parameters stabilized. Proceed with standard caution.`,
      links: []
    };
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

export interface AIChronicleDraft {
  title: string;
  category: 'Personal Log' | 'Guild Saga' | 'Mission Debrief' | 'World Lore';
  content: string;
  tags: string[];
  significance: 'Minor' | 'Notable' | 'Historic' | 'Legendary';
}

export const generateChronicleEntry = async (promptText: string, userContext?: string): Promise<AIChronicleDraft | null> => {
  const ai = initializeAI();
  if (!ai) return null;

  try {
    const prompt = `
      Act as "The Guild Historian & Archivist AI" for Nexus Nova Core.
      Your task is to craft a compelling, atmospheric fantasy/sci-fi chronicle entry based on the user's prompt or mission context.

      USER PROMPT / CONTEXT: "${promptText}"
      ${userContext ? `AGENT CONTEXT: ${userContext}` : ''}

      OUTPUT SPECIFICATION:
      Return ONLY a JSON object with:
      1. "title": An epic, evocative title (e.g. "The Siege of Crystal Ridge", "Debrief: Sub-Level Recon").
      2. "category": One of ["Personal Log", "Guild Saga", "Mission Debrief", "World Lore"].
      3. "content": A richly detailed narrative or debrief (around 80-150 words) written with atmosphere and flair.
      4. "tags": An array of 3-4 relevant topic tags (e.g. ["Recon", "Tech", "Anomaly"]).
      5. "significance": One of ["Minor", "Notable", "Historic", "Legendary"].
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
    console.error("Chronicle Generation Error:", error);
    return null;
  }
};

