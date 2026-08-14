import translate from '@iamtraction/google-translate';
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
  it: 'Italian',
  nl: 'Dutch',
  hi: 'Hindi',
  id: 'Indonesian',
  tr: 'Turkish',
  vi: 'Vietnamese',
  pl: 'Polish',
  uk: 'Ukrainian'
};

const LANGUAGE_CODE_MAP: Record<string, string> = {
  english: 'en',
  spanish: 'es',
  french: 'fr',
  german: 'de',
  japanese: 'ja',
  chinese: 'zh',
  'chinese (simplified)': 'zh',
  portuguese: 'pt',
  korean: 'ko',
  russian: 'ru',
  arabic: 'ar',
  italian: 'it',
  dutch: 'nl',
  hindi: 'hi',
  indonesian: 'id',
  turkish: 'tr',
  vietnamese: 'vi',
  polish: 'pl',
  ukrainian: 'uk'
};

let genAIClient: GoogleGenAI | null = null;

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) return null;
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
}

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

  const { text, targetLanguage, from = 'auto' } = req.body || {};

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "text" field' });
  }

  // Cap input text length to 4000 characters
  const cleanText = text.slice(0, 4000).trim();
  if (!cleanText) {
    return res.status(200).json({ 
      translatedText: '',
      text: '',
      from: { language: { iso: 'auto' } }
    });
  }

  const rawTarget = String(targetLanguage || 'es').trim();
  const cleanLang = rawTarget.toLowerCase().split('-')[0];
  const targetCode = LANGUAGE_CODE_MAP[cleanLang] || cleanLang || 'es';
  const targetLanguageName = LANGUAGE_NAME_MAP[cleanLang] || rawTarget;

  // 3. Primary Engine: Google Translate API (matheuss/google-translate-api protocol)
  try {
    const result = await translate(cleanText, {
      from: from || 'auto',
      to: targetCode
    });

    if (result && result.text && result.text.trim()) {
      return res.status(200).json({
        translatedText: result.text.trim(),
        text: result.text.trim(),
        from: result.from || { language: { iso: 'auto' } },
        serviceUsed: 'google-translate-api'
      });
    }
  } catch (translateErr) {
    console.warn("[/api/translate] Google Translate API error, attempting direct Google Translate endpoint:", translateErr);
  }

  // 4. Secondary Engine: Direct Google Translate endpoint (gtx)
  try {
    const googleWebUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(from)}&tl=${encodeURIComponent(targetCode)}&dt=t&q=${encodeURIComponent(cleanText)}`;
    const webResponse = await fetch(googleWebUrl);
    if (webResponse.ok) {
      const data = await webResponse.json();
      if (data && Array.isArray(data[0])) {
        const segments = data[0].map((seg: any) => seg[0]).filter(Boolean).join('');
        const detectedIso = data[2] || from;
        if (segments && segments.trim()) {
          return res.status(200).json({
            translatedText: segments.trim(),
            text: segments.trim(),
            from: { language: { iso: detectedIso } },
            serviceUsed: 'google-translate-direct'
          });
        }
      }
    }
  } catch (err) {
    console.warn("[/api/translate] Google Translate direct fetch error:", err);
  }

  // 5. Fallback: Gemini AI Translation Engine (if GEMINI_API_KEY is configured)
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (geminiApiKey) {
    try {
      const ai = getGenAIClient() || new GoogleGenAI({ apiKey: geminiApiKey });
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Translate the following text into ${targetLanguageName}. Return ONLY the translation, without quotes or additional commentary:\n\n"${cleanText}"`
      });

      if (aiResponse && aiResponse.text) {
        return res.status(200).json({
          translatedText: aiResponse.text.trim().replace(/^["']|["']$/g, '').trim(),
          text: aiResponse.text.trim().replace(/^["']|["']$/g, '').trim(),
          from: { language: { iso: 'auto' } },
          serviceUsed: 'gemini-fallback'
        });
      }
    } catch (err) {
      console.warn("[/api/translate] GenAI SDK translation fallback error:", err);
    }
  }

  // 6. Passthrough return
  return res.status(200).json({
    translatedText: cleanText,
    text: cleanText,
    from: { language: { iso: 'auto' } },
    serviceUsed: 'passthrough'
  });
}
