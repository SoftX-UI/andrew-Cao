import { GoogleGenAI } from "@google/genai";
import { checkRateLimit, validatePayloadSize } from "./_rateLimiter";

const LANGUAGE_NAME_MAP: Record<string, string> = {
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

const LANGUAGE_CODE_MAP: Record<string, string> = {
  english: 'en',
  spanish: 'es',
  french: 'fr',
  german: 'de',
  japanese: 'ja',
  chinese: 'zh',
  portuguese: 'pt',
  korean: 'ko',
  russian: 'ru',
  arabic: 'ar',
  italian: 'it'
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // 1. Rate Limit (60 translation requests / min per IP)
  const rateLimit = checkRateLimit(req, 60, 60000);
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Please retry in ${rateLimit.resetInSec}s.`
    });
  }

  // 2. Validate payload size (Cap at 32KB)
  if (!validatePayloadSize(req, 32768)) {
    return res.status(413).json({
      error: 'Payload Too Large',
      message: 'Request payload exceeds maximum allowed limit (32KB).'
    });
  }

  const { text, targetLanguage } = req.body || {};

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "text" field' });
  }

  // Cap input text length to 4000 characters
  const cleanText = text.slice(0, 4000).trim();
  if (!cleanText) {
    return res.status(200).json({ translatedText: '' });
  }

  const rawTarget = String(targetLanguage || 'Spanish').trim();
  const cleanLang = rawTarget.toLowerCase().split('-')[0];
  const targetLanguageName = LANGUAGE_NAME_MAP[cleanLang] || rawTarget;
  const targetCode = LANGUAGE_CODE_MAP[cleanLang] || cleanLang;

  // 3. Try server-side secret API keys first
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.GOOGLE_TRANSLATE_API_KEY;

  if (apiKey) {
    // 3a. Direct Gemini 2.5 Flash translation
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate the following text into ${targetLanguageName}. Return ONLY the translation, nothing else:\n\n"${cleanText}"`
            }]
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (translated) {
          return res.status(200).json({
            translatedText: translated.replace(/^["']|["']$/g, '').trim(),
            serviceUsed: 'gemini-api'
          });
        }
      }
    } catch (err) {
      console.warn("[/api/translate] Gemini direct fetch error, trying GenAI SDK:", err);
    }

    // 3b. GenAI SDK fallback
    try {
      const ai = new GoogleGenAI({ apiKey });
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Translate the following text into ${targetLanguageName}. Return ONLY the translation, nothing else:\n\n"${cleanText}"`
      });

      if (aiResponse && aiResponse.text) {
        return res.status(200).json({
          translatedText: aiResponse.text.trim().replace(/^["']|["']$/g, '').trim(),
          serviceUsed: 'genai-sdk'
        });
      }
    } catch (err) {
      console.warn("[/api/translate] GenAI SDK error:", err);
    }
  }

  // 4. Server-side Google Translate Web Endpoint fallback (high accuracy, no key required)
  try {
    const googleWebUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetCode)}&dt=t&q=${encodeURIComponent(cleanText)}`;
    const webResponse = await fetch(googleWebUrl);
    if (webResponse.ok) {
      const data = await webResponse.json();
      if (data && Array.isArray(data[0])) {
        const segments = data[0].map((seg: any) => seg[0]).filter(Boolean).join('');
        if (segments && segments.trim()) {
          return res.status(200).json({
            translatedText: segments.trim(),
            serviceUsed: 'google-web'
          });
        }
      }
    }
  } catch (err) {
    console.warn("[/api/translate] Web translation fallback error:", err);
  }

  // 5. Default safe return
  return res.status(200).json({
    translatedText: cleanText,
    serviceUsed: 'passthrough'
  });
}
