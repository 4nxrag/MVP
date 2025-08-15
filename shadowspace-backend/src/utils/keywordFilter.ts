const BANNED_KEYWORDS = [
  'guns', 'gun', 'weapon', 'weapons', 'violence', 'violent', 'kill', 'murder',
  'hate', 'racist', 'terrorism', 'terrorist', 'bomb', 'explosive', 'drugs',
  'cocaine', 'heroin', 'meth', 'suicide', 'self-harm', 'nazi', 'hitler'
];

export const containsBannedContent = (text: string): boolean => {
  const lowercaseText = text.toLowerCase();
  
  return BANNED_KEYWORDS.some(keyword => {
    // Check for exact word matches (not just substrings)
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(lowercaseText);
  });
};

export const getBannedWords = (text: string): string[] => {
  const lowercaseText = text.toLowerCase();
  const foundWords: string[] = [];
  
  BANNED_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(lowercaseText)) {
      foundWords.push(keyword);
    }
  });
  
  return foundWords;
};
