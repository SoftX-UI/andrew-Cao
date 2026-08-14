/**
 * Client-side Translation Service Proxy
 *
 * All translations are routed securely through the /api/translate serverless endpoint.
 * No API keys are held or accessed in the browser bundle.
 */

export const LANGUAGE_NAME_MAP: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
  zh: 'Chinese (Simplified)',
  pt: 'Portuguese',
  ko: 'Korean',
  ru: 'Russian',
  ar: 'Arabic',
  it: 'Italian'
};

export const LANGUAGE_CODE_MAP: Record<string, string> = {
  english: 'en',
  en: 'en',
  spanish: 'es',
  español: 'es',
  es: 'es',
  french: 'fr',
  français: 'fr',
  fr: 'fr',
  german: 'de',
  deutsch: 'de',
  de: 'de',
  japanese: 'ja',
  日本語: 'ja',
  ja: 'ja',
  chinese: 'zh',
  'chinese (simplified)': 'zh',
  简体中文: 'zh',
  zh: 'zh',
  portuguese: 'pt',
  português: 'pt',
  pt: 'pt',
  korean: 'ko',
  한국어: 'ko',
  ko: 'ko',
  russian: 'ru',
  русский: 'ru',
  ru: 'ru',
  arabic: 'ar',
  العربية: 'ar',
  ar: 'ar',
  italian: 'it',
  italiano: 'it',
  it: 'it'
};

export function getLanguageName(codeOrName: string): string {
  if (!codeOrName) return 'Spanish';
  const clean = codeOrName.trim().toLowerCase().split('-')[0];
  return LANGUAGE_NAME_MAP[clean] || (clean.charAt(0).toUpperCase() + clean.slice(1));
}

export function getLanguageCode(codeOrName: string): string {
  if (!codeOrName) return 'es';
  const clean = codeOrName.trim().toLowerCase().split('-')[0];
  return LANGUAGE_CODE_MAP[clean] || clean;
}

const LOCAL_FALLBACKS: Record<string, Record<string, string>> = {
  es: {
    "Welcome to Nexus Nova Core": "Bienvenido a Nexus Nova Core",
    "Greetings, Adventurer! I am Lira. How may I assist you with your missions today?": "¡Saludos, Aventurero! Soy Lira. ¿Cómo puedo ayudarte con tus misiones hoy?",
    "Has anyone seen the notice for the rank B monster?": "¿Alguien ha visto el aviso del monstruo de rango B?",
    "I'm looking for a party member for the Frostpeaks raid.": "Busco un miembro de grupo para la incursión en Frostpeaks.",
    "Just cashed in my rewards. Drinks on me!": "¡Acabo de cobrar mis recompensas. ¡Las bebidas van por mi cuenta!",
    "The taxes this month are ridiculous.": "Los impuestos de este mes son ridículos.",
    "Be careful near the West Gate, goblins are active.": "Tengan cuidado cerca de la Puerta Oeste, los duendes están activos.",
    "LFG Healer/Support. Serious inquiries only.": "Buscando Sanador/Soporte. Solo consultas serias.",
    "Can someone verify my proof of completion?": "¿Puede alguien verificar mi prueba de finalización?"
  },
  de: {
    "Welcome to Nexus Nova Core": "Willkommen bei Nexus Nova Core",
    "Greetings, Adventurer! I am Lira. How may I assist you with your missions today?": "Sei gegrüßt, Abenteurer! Ich bin Lira. Wie kann ich dir heute bei deinen Missionen helfen?",
    "Has anyone seen the notice for the rank B monster?": "Hat jemand die Bekanntmachung für das Rang-B-Monster gesehen?",
    "I'm looking for a party member for the Frostpeaks raid.": "Ich suche ein Gruppenmitglied für den Frostpeaks-Raid.",
    "Just cashed in my rewards. Drinks on me!": "Habe gerade meine Belohnungen abgeholt. Getränke gehen auf mich!",
    "The taxes this month are ridiculous.": "Die Steuern diesen Monat sind lächerlich.",
    "Be careful near the West Gate, goblins are active.": "Vorsicht am Westtor, Goblins sind aktiv.",
    "LFG Healer/Support. Serious inquiries only.": "Suche Heiler/Unterstützung. Nur ernsthafte Anfragen.",
    "Can someone verify my proof of completion?": "Kann jemand meinen Abschlussnachweis überprüfen?"
  },
  fr: {
    "Welcome to Nexus Nova Core": "Bienvenue à Nexus Nova Core",
    "Greetings, Adventurer! I am Lira. How may I assist you with your missions today?": "Salutations, Aventurier ! Je suis Lira. Comment puis-je vous aider dans vos missions aujourd'hui ?",
    "Has anyone seen the notice for the rank B monster?": "Quelqu'un a-t-il vu l'avis pour le monstre de rang B ?",
    "I'm looking for a party member for the Frostpeaks raid.": "Je cherche un membre de groupe pour le raid des Pics de Givre.",
    "Just cashed in my rewards. Drinks on me!": "Je viens d'encaisser mes récompenses. Tournée générale !",
    "The taxes this month are ridiculous.": "Les taxes ce mois-ci sont ridicules.",
    "Be careful near the West Gate, goblins are active.": "Faites attention près de la Porte Ouest, les gobelins sont actifs.",
    "LFG Healer/Support. Serious inquiries only.": "Cherche Soigneur/Soutien. Demandes sérieuses uniquement.",
    "Can someone verify my proof of completion?": "Quelqu'un peut-il vérifier ma preuve d'achèvement ?"
  },
  ja: {
    "Welcome to Nexus Nova Core": "ネクサスノバ・コアへようこそ",
    "Greetings, Adventurer! I am Lira. How may I assist you with your missions today?": "冒険者様、ごきげんよう！リラと申します。本日の任務についてどのようなご用件でしょうか？",
    "Has anyone seen the notice for the rank B monster?": "ランクBモンスターの掲示を見た人はいませんか？",
    "I'm looking for a party member for the Frostpeaks raid.": "フロストピークスレイドのパーティメンバーを探しています。",
    "Just cashed in my rewards. Drinks on me!": "報酬を受け取ったところです。おごりますよ！",
    "The taxes this month are ridiculous.": "今月の税金は法外ですね。",
    "Be careful near the West Gate, goblins are active.": "西門の近くは気をつけてください。ゴブリンが出没しています。",
    "LFG Healer/Support. Serious inquiries only.": "ヒーラー/サポート募集中。本気の方のみ。",
    "Can someone verify my proof of completion?": "誰か完了証明を確認してもらえますか？"
  }
};

/**
 * Translates text via the secure serverless backend endpoint (/api/translate).
 *
 * @param textToTranslate The raw text content to translate
 * @param targetLanguage Target language name or code (e.g. 'German', 'Spanish', 'es', 'de')
 */
export async function translateText(
  textToTranslate: string, 
  targetLanguage: string = "Spanish"
): Promise<string> {
  if (!textToTranslate || !textToTranslate.trim()) {
    return '';
  }

  const targetLanguageName = getLanguageName(targetLanguage);
  const targetCode = getLanguageCode(targetLanguage);

  // 1. Call secure /api/translate route
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: textToTranslate,
        targetLanguage: targetLanguageName
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.translatedText && data.translatedText.trim()) {
        return data.translatedText.trim();
      }
    }
  } catch (err) {
    console.warn("Client translate fetch error, checking local dictionary:", err);
  }

  // 2. Local Phrase Dictionary Fallback
  if (LOCAL_FALLBACKS[targetCode] && LOCAL_FALLBACKS[targetCode][textToTranslate]) {
    return LOCAL_FALLBACKS[targetCode][textToTranslate];
  }

  // 3. Passthrough fallback
  return textToTranslate;
}
