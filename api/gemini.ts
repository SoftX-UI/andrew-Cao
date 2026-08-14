import { GoogleGenAI } from "@google/genai";
import { checkRateLimit, validatePayloadSize } from "./_rateLimiter";

// Allowed actions to reject unexpected payloads
const ALLOWED_ACTIONS = [
  'chat', 
  'generate_mission_draft', 
  'generate_mission_description', 
  'analyze_profile', 
  'analyze_reports', 
  'location_intel', 
  'environmental_data', 
  'generate_chronicle'
] as const;

type ActionType = typeof ALLOWED_ACTIONS[number];

let genAI: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export default async function handler(req: any, res: any) {
  // Only accept POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // 1. Enforce Per-IP Rate Limiting (30 requests / minute)
  const rateLimit = checkRateLimit(req, 30, 60000);
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Please try again in ${rateLimit.resetInSec} seconds.`
    });
  }

  // 2. Validate Request Size (Cap at 64KB)
  if (!validatePayloadSize(req, 65536)) {
    return res.status(413).json({
      error: 'Payload Too Large',
      message: 'Request payload exceeds maximum allowed limit (64KB).'
    });
  }

  const { action, payload } = req.body || {};

  // 3. Strict Action & Payload Validation
  if (!action || !ALLOWED_ACTIONS.includes(action as ActionType)) {
    return res.status(400).json({
      error: 'Invalid or missing action',
      allowedActions: ALLOWED_ACTIONS
    });
  }

  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({
      error: 'Payload must be a valid JSON object'
    });
  }

  // 4. Verify Server-Side Secret Key
  const ai = getGenAI();
  if (!ai) {
    return res.status(503).json({
      error: 'AI service unavailable',
      message: 'GEMINI_API_KEY is not configured on the server.'
    });
  }

  try {
    switch (action as ActionType) {
      case 'chat': {
        const { message, userProfile, systemInstruction } = payload;
        if (!message || typeof message !== 'string') {
          return res.status(400).json({ error: 'Missing string "message" in payload' });
        }
        // Cap message length to 2000 chars
        const safeMessage = message.slice(0, 2000);
        let userContext = '';
        if (userProfile && typeof userProfile === 'object') {
          userContext = `\n[User Context: ${String(userProfile.name || '').slice(0, 50)}, Level ${Number(userProfile.level) || 1}${userProfile.rank ? `, Rank: ${String(userProfile.rank).slice(0, 30)}` : ''}]`;
        }

        const defaultInstruction = `You are 'Lira', the Receptionist of Nexus Nova Core (formerly Adventure Guild). 
        Your tone is professional, welcoming, and slightly archaic/fantasy-themed (calling users 'Adventurer', referring to tasks as 'Quests').
        You help users find missions, explain features (Status types: Urgent, Open, Verifying, etc.), and manage their profiles.
        Keep answers concise (under 100 words) unless asked for details.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `${safeMessage}${userContext}`,
          config: {
            systemInstruction: typeof systemInstruction === 'string' ? systemInstruction.slice(0, 1000) : defaultInstruction
          }
        });

        return res.status(200).json({
          text: response.text || null
        });
      }

      case 'generate_mission_draft': {
        const { keywords } = payload;
        if (!keywords || typeof keywords !== 'string') {
          return res.status(400).json({ error: 'Missing string "keywords" in payload' });
        }
        const safeKeywords = keywords.slice(0, 500);

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Generate a creative fantasy adventure mission title and description based on these keywords: "${safeKeywords}".
          The context is an 'Adventure Guild' app where users (Adventurers) take on tasks.
          Return ONLY a JSON object with keys "title" and "description".
          Keep the description concise (under 50 words).`,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const text = response.text;
        if (!text) return res.status(500).json({ error: 'No output received from AI model' });
        return res.status(200).json(JSON.parse(text));
      }

      case 'generate_mission_description': {
        const { title } = payload;
        if (!title || typeof title !== 'string') {
          return res.status(400).json({ error: 'Missing string "title" in payload' });
        }
        const safeTitle = title.slice(0, 300);

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Generate a creative, immersive fantasy adventure mission description for a quest titled: "${safeTitle}".
          The description should be concise (around 30-50 words), intriguing, and sound like a formal request on a guild board.
          Return ONLY the description text.`
        });

        return res.status(200).json({
          text: response.text || null
        });
      }

      case 'analyze_profile': {
        const { user } = payload;
        if (!user || typeof user !== 'object') {
          return res.status(400).json({ error: 'Missing user object in payload' });
        }

        const nextLevel = (Number(user.level) || 1) + 1;
        const xpThreshold = Math.floor(100 * Math.pow(nextLevel, 1.5));
        const xpNeeded = Math.max(0, xpThreshold - (Number(user.exp) || 0));

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
          - Name: ${String(user.name || '').slice(0, 50)}
          - Current Role: ${String(user.role || '').slice(0, 50)}
          - Level: ${Number(user.level) || 1}
          - Current XP: ${Number(user.exp) || 0} (Need ${xpNeeded} more for Level ${nextLevel})
          - Skills/Tags: ${Array.isArray(user.tags) ? user.tags.slice(0, 10).map(String).join(', ') : 'None'}
          - Credits: ${Number(user.credits) || 0}

          OUTPUT JSON:
          1. "assessment": A witty, direct, and slightly sci-fi/fantasy evaluation. Reference their progress on the exponential curve or their consistency.
          2. "careerPath": A creative, evolved class title tailored to their current skills (e.g., "Void Walker", "Quantum Merchant", "Grand Archivist", "Cyber-Paladin", "Apex Vanguard").
          3. "recommendations": An array of 3 highly specific, actionable steps.
          4. "suggestedTags": An array of 3 sophisticated skills or badges they should aim to earn next.
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const text = response.text;
        if (!text) return res.status(500).json({ error: 'No output from model' });
        return res.status(200).json(JSON.parse(text));
      }

      case 'analyze_reports': {
        const { userName, reportCount, historyContext } = payload;
        const prompt = `
          Act as an automated Guild Moderator AI. Analyze the following user report summary.
          User: ${String(userName || '').slice(0, 50)}
          Total Reports: ${Number(reportCount) || 0}
          Context/Offenses: ${String(historyContext || '').slice(0, 1000)}

          Based on this, determine the severity of the situation and a recommended administrative action.
          Return ONLY a JSON object with:
          1. "severity": One of ["Low", "Medium", "High", "Critical"].
          2. "reasoning": A concise explanation (max 2 sentences) of why this severity was chosen.
          3. "recommendedAction": One of ["None", "Warning", "TempBan", "PermaBan"].
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const text = response.text;
        if (!text) return res.status(500).json({ error: 'No output from model' });
        return res.status(200).json(JSON.parse(text));
      }

      case 'location_intel': {
        const { location } = payload;
        if (!location || typeof location !== 'string') {
          return res.status(400).json({ error: 'Missing string "location" in payload' });
        }
        const safeLocation = location.slice(0, 200);

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Provide a tactical summary of this location: ${safeLocation}. 
          Include key landmarks, terrain type, and potential hazards for an adventurer.
          If the location is fictional or generic (like "Frostpeaks" or "Virtual"), create a believable, immersive description fitting a fantasy guild setting.
          If it is real (like "New York"), use real geographical data.`
        });

        return res.status(200).json({
          text: response.text || `Tactical scan complete for ${safeLocation}. Area parameters stabilized.`,
          links: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
        });
      }

      case 'environmental_data': {
        const { location } = payload;
        if (!location || typeof location !== 'string') {
          return res.status(400).json({ error: 'Missing string "location" in payload' });
        }
        const safeLocation = location.slice(0, 200);

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Generate fictional but realistic current environmental conditions for this location: "${safeLocation}".
          Return ONLY a JSON object with keys: "temperature" (e.g. "22°C"), "weather" (e.g. "Clear"), "visibility" (e.g. "High"), "terrain" (e.g. "Urban").`,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const text = response.text;
        if (!text) return res.status(500).json({ error: 'No output from model' });
        return res.status(200).json(JSON.parse(text));
      }

      case 'generate_chronicle': {
        const { promptText, userContext } = payload;
        if (!promptText || typeof promptText !== 'string') {
          return res.status(400).json({ error: 'Missing string "promptText" in payload' });
        }

        const prompt = `
          Act as "The Guild Historian & Archivist AI" for Nexus Nova Core.
          Your task is to craft a compelling, atmospheric fantasy/sci-fi chronicle entry based on the user's prompt or mission context.

          USER PROMPT / CONTEXT: "${promptText.slice(0, 1000)}"
          ${userContext ? `AGENT CONTEXT: ${String(userContext).slice(0, 500)}` : ''}

          OUTPUT SPECIFICATION:
          Return ONLY a JSON object with:
          1. "title": An epic, evocative title.
          2. "category": One of ["Personal Log", "Guild Saga", "Mission Debrief", "World Lore"].
          3. "content": A richly detailed narrative or debrief (around 80-150 words) written with atmosphere and flair.
          4. "tags": An array of 3-4 relevant topic tags.
          5. "significance": One of ["Minor", "Notable", "Historic", "Legendary"].
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const text = response.text;
        if (!text) return res.status(500).json({ error: 'No output from model' });
        return res.status(200).json(JSON.parse(text));
      }

      default:
        return res.status(400).json({ error: 'Unhandled action' });
    }
  } catch (err: any) {
    console.error(`[/api/gemini error] Action: ${action}:`, err);
    return res.status(500).json({
      error: 'Internal AI generation error',
      message: err.message || 'Unknown server error'
    });
  }
}
