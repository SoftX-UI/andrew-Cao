/**
 * Client-side Gemini Service Proxy
 *
 * All AI requests are securely proxied through the serverless backend endpoint (/api/gemini).
 * No secret keys (GEMINI_API_KEY / API_KEY) exist in this client code.
 */

import { User } from "../types";

export interface AdvisorAnalysis {
  assessment: string;
  careerPath: string;
  recommendations: string[];
  suggestedTags: string[];
}

export interface UserReportAnalysis {
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  reasoning: string;
  recommendedAction: 'None' | 'Warning' | 'TempBan' | 'PermaBan';
}

export interface AIChronicleDraft {
  title: string;
  category: 'Personal Log' | 'Guild Saga' | 'Mission Debrief' | 'World Lore';
  content: string;
  tags: string[];
  significance: 'Minor' | 'Notable' | 'Historic' | 'Legendary';
}

async function callGeminiApi(action: string, payload: Record<string, any>): Promise<any> {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action, payload })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.warn(`[/api/gemini ${action} error ${response.status}]:`, errData);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Network error calling /api/gemini for action "${action}":`, error);
    return null;
  }
}

export const startGuildChat = async () => {
  return true;
};

export const sendMessageToGuild = async (
  message: string,
  _channel?: string,
  _history?: any[],
  userProfile?: { name: string; level: number; rank?: string }
): Promise<string | null> => {
  const data = await callGeminiApi('chat', {
    message,
    userProfile
  });

  return data?.text || "The Guild receptionist is currently attending to another operative. Please try again shortly.";
};

export const generateMissionDraft = async (
  keywords: string
): Promise<{ title: string; description: string } | null> => {
  const data = await callGeminiApi('generate_mission_draft', { keywords });
  if (data && data.title && data.description) {
    return {
      title: data.title,
      description: data.description
    };
  }
  return {
    title: `Quest: ${keywords.split(',')[0] || 'Expedition'}`,
    description: `A tactical operative request has been dispatched regarding ${keywords}. Proceed with caution.`
  };
};

export const generateMissionDescription = async (title: string): Promise<string | null> => {
  const data = await callGeminiApi('generate_mission_description', { title });
  return data?.text || `High-priority guild assignment logged under: "${title}". Coordinates and briefing materials uploaded to your tactical HUD.`;
};

export const analyzeUserProfile = async (user: User): Promise<AdvisorAnalysis | null> => {
  const data = await callGeminiApi('analyze_profile', { user });
  if (data && data.assessment && data.careerPath) {
    return data;
  }

  return {
    assessment: `Operative ${user.name} demonstrates solid mission throughput. Strategic progression on the curve remains steady.`,
    careerPath: user.tags.includes('Combat') ? 'Apex Vanguard' : 'Master Strategist',
    recommendations: [
      'Target higher difficulty missions to maximize base multipliers.',
      'Maintain continuous 7-day operation streaks.',
      'Specialize into advanced sector certifications.'
    ],
    suggestedTags: ['Tactical-Command', 'High-Threat-Specialist', 'Elite-Operative']
  };
};

export const analyzeUserReports = async (
  userName: string,
  reportCount: number,
  historyContext: string
): Promise<UserReportAnalysis | null> => {
  const data = await callGeminiApi('analyze_reports', {
    userName,
    reportCount,
    historyContext
  });

  if (data && data.severity) {
    return data;
  }

  return {
    severity: reportCount > 3 ? 'High' : reportCount > 1 ? 'Medium' : 'Low',
    reasoning: `Recorded ${reportCount} community flags for ${userName}. Automated triage recommended standard review.`,
    recommendedAction: reportCount > 3 ? 'TempBan' : reportCount > 1 ? 'Warning' : 'None'
  };
};

export const getLocationIntel = async (
  location: string
): Promise<{ text: string; links: any[] } | null> => {
  const data = await callGeminiApi('location_intel', { location });
  if (data && data.text) {
    return data;
  }

  return {
    text: `Tactical scan complete for ${location}. Terrain parameters stabilized. Proceed with standard caution.`,
    links: []
  };
};

export const getEnvironmentalData = async (
  location: string
): Promise<{ temperature: string; weather: string; visibility: string; terrain: string } | null> => {
  const data = await callGeminiApi('environmental_data', { location });
  if (data && data.temperature) {
    return data;
  }

  return {
    temperature: '21°C',
    weather: 'Clear',
    visibility: 'Optimal',
    terrain: 'Mixed Sector'
  };
};

export const generateChronicleEntry = async (
  promptText: string,
  userContext?: string
): Promise<AIChronicleDraft | null> => {
  const data = await callGeminiApi('generate_chronicle', {
    promptText,
    userContext
  });

  if (data && data.title && data.content) {
    return data;
  }

  return {
    title: `Chronicle: ${promptText.slice(0, 30)}...`,
    category: 'Mission Debrief',
    content: `Operatives deployed to record the following tactical event: "${promptText}". Mission log secured in the Guild Vault.`,
    tags: ['Debrief', 'Chronicle', 'Vault'],
    significance: 'Notable'
  };
};

export { translateText } from './translationService';
