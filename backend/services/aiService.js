const { GoogleGenerativeAI } = require('@google/generative-ai');

// Built-in corporate jargon replacement dictionary for instant, deterministic fallback simplification
const JARGON_REPLACEMENTS = [
  [/pursuant to/gi, 'under'],
  [/in accordance with/gi, 'following'],
  [/mandated to immediately cease utilization of/gi, 'must stop using'],
  [/strictly required to don/gi, 'must wear'],
  [/prior to initiating/gi, 'before starting'],
  [/prior to handling/gi, 'before touching'],
  [/in the event of/gi, 'if there is'],
  [/refrain from/gi, 'do not do'],
  [/commences/gi, 'starts'],
  [/terminates/gi, 'ends'],
  [/remuneration/gi, 'pay'],
  [/disbursed concurrently with/gi, 'paid together with'],
  [/personnel/gi, 'workers'],
  [/utilize/gi, 'use'],
  [/adhere to/gi, 'follow'],
  [/egress/gi, 'exit'],
  [/conduit/gi, 'path'],
  [/de-energization/gi, 'turning off power'],
  [/statutory/gi, 'official'],
  [/infraction/gi, 'rule violation'],
  [/subsequent to/gi, 'after'],
  [/prohibited from/gi, 'not allowed to']
];

function simplifyCorporateTextFallback(title, originalContent) {
  let clean = originalContent || '';
  for (const [pattern, replacement] of JARGON_REPLACEMENTS) {
    clean = clean.replace(pattern, replacement);
  }

  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const bullet1 = sentences[0]
    ? `• What Happened: ${sentences[0]}`
    : `• What Happened: Important update regarding ${title}.`;

  const bullet2 = sentences[1]
    ? `• What You Must Do: ${sentences[1]}`
    : `• What You Must Do: Please follow the safety and workplace instructions listed in this notice.`;

  const bullet3 = sentences.slice(2).join(' ')
    ? `• Important Details & Contact: ${sentences.slice(2).join(' ')}`
    : `• Who to Contact: Ask your shift supervisor or HR Helpdesk (Room 102) if you have any questions.`;

  const simplifiedContent = `${bullet1}\n${bullet2}\n${bullet3}`;
  const keyActionRequired = sentences[1] || sentences[0] || `Review and follow ${title}.`;

  return { simplifiedContent, keyActionRequired };
}

// Uses free Google Translate gtx endpoint for genuine live translation when Gemini API key is not set
async function translateTextFree(text, targetLang) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(
      text
    )}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Translation fetch failed');
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      return data[0].map((part) => part[0]).join('');
    }
    return text;
  } catch (err) {
    return text;
  }
}

async function generateAccessibleFormats({ title, originalContent, category }) {
  const apiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim();

  // 1. If Gemini API Key is configured, use Gemini 1.5 Flash
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are an enterprise workplace accessibility assistant for InclusiveConnect.
Take the following complex workplace announcement and convert it for frontline, multilingual, and neurodivergent employees.

Announcement Title: "${title}"
Category: "${category || 'General'}"
Original Text: "${originalContent}"

Return ONLY a valid JSON object (no markdown fences) with this exact structure:
{
  "simplifiedContent": "• What Happened: [1 simple sentence at 6th-grade reading level]\\n• What You Must Do: [1 clear actionable instruction]\\n• Who to Contact / Deadlines: [1 simple sentence]",
  "keyActionRequired": "[1 short sentence under 18 words stating the exact action required]",
  "translations": {
    "hi": {
      "title": "[Hindi translation of simplified title]",
      "simplifiedContent": "[Hindi translation of the 3 bullet points above]"
    },
    "te": {
      "title": "[Telugu translation of simplified title]",
      "simplifiedContent": "[Telugu translation of the 3 bullet points above]"
    },
    "ta": {
      "title": "[Tamil translation of simplified title]",
      "simplifiedContent": "[Tamil translation of the 3 bullet points above]"
    }
  }
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...parsed,
          engine: 'Google Gemini AI'
        };
      }
    } catch (err) {
      console.warn('Gemini API fallback triggered:', err.message);
    }
  }

  // 2. Smart Built-in Simplifier + Real-Time Translation Fallback
  const { simplifiedContent, keyActionRequired } = simplifyCorporateTextFallback(
    title,
    originalContent
  );

  const [hiTitle, hiBody, teTitle, teBody, taTitle, taBody] = await Promise.all([
    translateTextFree(title, 'hi'),
    translateTextFree(simplifiedContent, 'hi'),
    translateTextFree(title, 'te'),
    translateTextFree(simplifiedContent, 'te'),
    translateTextFree(title, 'ta'),
    translateTextFree(simplifiedContent, 'ta')
  ]);

  return {
    simplifiedContent,
    keyActionRequired,
    translations: {
      hi: { title: hiTitle, simplifiedContent: hiBody },
      te: { title: teTitle, simplifiedContent: teBody },
      ta: { title: taTitle, simplifiedContent: taBody }
    },
    engine: 'InclusiveConnect AI Simplifier + Multilingual Engine'
  };
}

module.exports = {
  generateAccessibleFormats
};
