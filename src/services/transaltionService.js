// src/services/translationService.js
const API_KEY = 'AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw';
const BASE_URL = 'https://translation.googleapis.com/language/translate/v2';

export async function translateText(text, targetLang, sourceLang = 'auto') {
  try {
    const res = await fetch(`${BASE_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text'
      }),
    });

    const result = await res.json();
    return result.data?.translations?.[0]?.translatedText || text;
  } catch (err) {
    console.error('🌐 Translation API Error:', err);
    return text;
  }
}
