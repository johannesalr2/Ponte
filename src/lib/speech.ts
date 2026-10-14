/**
 * Pronúncia com a Web Speech API. Se o navegador não tiver suporte, as funções
 * simplesmente não fazem nada (fallback silencioso) e os botões ficam ocultos.
 */

export function speechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  );
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const base = lang.split('-')[0] ?? lang;
  return voices.find((v) => v.lang === lang) ?? voices.find((v) => v.lang.startsWith(base));
}

export function speak(text: string, lang = 'de-DE', rate = 0.9): void {
  if (!speechSupported()) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    const voice = pickVoice(lang);
    if (voice) u.voice = voice;
    synth.speak(u);
  } catch {
    // silencioso: pronúncia é um extra
  }
}
