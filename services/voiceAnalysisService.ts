export interface VoiceAnalysisResult {
  sentiment: 'Positive' | 'Neutral' | 'Urgent / Caution' | 'Negative' | 'Triumphant';
  sentimentScore: number; // 0 to 100
  sentimentColor: string;
  sentimentBadgeClass: string;
  keywords: string[];
  summary: string;
  keyTakeaways: string[];
  timestamp: string;
  author?: string;
  reportType?: 'completion' | 'feedback';
}

export function analyzeVoiceTranscript(
  text: string, 
  reportType: 'completion' | 'feedback' = 'completion',
  author: string = 'Operative'
): VoiceAnalysisResult {
  const cleanText = text.trim();
  if (!cleanText) {
    return {
      sentiment: 'Neutral',
      sentimentScore: 50,
      sentimentColor: 'text-slate-400',
      sentimentBadgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
      keywords: ['#debrief'],
      summary: 'No transcript text provided for analysis.',
      keyTakeaways: ['No text input recorded.'],
      timestamp: new Date().toISOString(),
      author,
      reportType
    };
  }

  const lower = cleanText.toLowerCase();

  // Sentiment Lexicon
  const triumphantWords = [
    'triumph', 'victory', 'succeeded', 'successful', 'complete', 'completed', 
    'secured', 'accomplished', 'perfect', 'excellent', 'outstanding', 'flawless', 
    'resolved', 'verified', 'bonus', 'cleared', 'unharmed', 'target neutralized', 'goal met'
  ];

  const positiveWords = [
    'good', 'smooth', 'safe', 'delivered', 'checked', 'progress', 'ready', 
    'handled', 'helped', 'assisted', 'support', 'done', 'solid', 'stable', 'ok', 'okay', 'great'
  ];

  const urgentWords = [
    'urgent', 'caution', 'warning', 'breach', 'threat', 'hazard', 'anomaly', 
    'delay', 'compromised', 'alert', 'danger', 'hostile', 'ambush', 'trap', 'enemy',
    'interrupted', 'damage', 'damaged', 'injury', 'critical', 'issue', 'problem'
  ];

  const negativeWords = [
    'failed', 'failure', 'aborted', 'destroyed', 'lost', 'unable', 'broken', 
    'error', 'rejected', 'catastrophe', 'defeat', 'unresolved', 'missing'
  ];

  let score = 50;
  let triumphantHits = 0;
  let positiveHits = 0;
  let urgentHits = 0;
  let negativeHits = 0;

  triumphantWords.forEach(w => { if (lower.includes(w)) { score += 12; triumphantHits++; } });
  positiveWords.forEach(w => { if (lower.includes(w)) { score += 7; positiveHits++; } });
  urgentWords.forEach(w => { if (lower.includes(w)) { score -= 10; urgentHits++; } });
  negativeWords.forEach(w => { if (lower.includes(w)) { score -= 15; negativeHits++; } });

  score = Math.max(5, Math.min(98, score));

  let sentiment: 'Positive' | 'Neutral' | 'Urgent / Caution' | 'Negative' | 'Triumphant' = 'Neutral';
  let sentimentColor = 'text-cyan-400';
  let sentimentBadgeClass = 'bg-cyan-950/80 text-cyan-300 border-cyan-800';

  if (triumphantHits > 0 || score >= 80) {
    sentiment = 'Triumphant';
    sentimentColor = 'text-emerald-400';
    sentimentBadgeClass = 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
  } else if (negativeHits > 0 && score < 35) {
    sentiment = 'Negative';
    sentimentColor = 'text-red-400';
    sentimentBadgeClass = 'bg-red-950/80 text-red-300 border-red-800';
  } else if (urgentHits > 0 || (score < 48 && score >= 35)) {
    sentiment = 'Urgent / Caution';
    sentimentColor = 'text-amber-400';
    sentimentBadgeClass = 'bg-amber-950/80 text-amber-300 border-amber-800';
  } else if (positiveHits > 0 || score > 55) {
    sentiment = 'Positive';
    sentimentColor = 'text-teal-400';
    sentimentBadgeClass = 'bg-teal-950/80 text-teal-300 border-teal-800';
  }

  // Stop words list
  const stopWords = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at', 
    'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'did', 'do', 
    'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 
    'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 
    'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 
    'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'so', 'some', 'such', 
    'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 
    'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 
    'which', 'while', 'who', 'whom', 'why', 'with', 'you', 'your', 'yours', 'yourself', 'yourselves', 'voice', 
    'transcript', 'report', 'speech'
  ]);

  const rawWords = cleanText
    .replace(/[^\w\s-]/gi, '')
    .split(/\s+/)
    .map(w => w.toLowerCase())
    .filter(w => w.length > 2 && !stopWords.has(w));

  const freqMap: Record<string, number> = {};
  rawWords.forEach(w => {
    freqMap[w] = (freqMap[w] || 0) + 1;
  });

  const domainBoosters = [
    'perimeter', 'cargo', 'waypoint', 'debrief', 'verification', 'security', 'objective', 
    'logistics', 'payload', 'sector', 'tactical', 'route', 'target', 'client', 'reward', 
    'status', 'proof', 'hazard', 'equipment', 'checkpoint', 'area', 'zone', 'team'
  ];

  domainBoosters.forEach(w => {
    if (freqMap[w]) freqMap[w] += 2;
  });

  const sortedKeywords = Object.keys(freqMap)
    .sort((a, b) => freqMap[b] - freqMap[a])
    .slice(0, 5)
    .map(w => `#${w.replace(/\s+/g, '-')}`);

  const sentences = cleanText.split(/(?<=[.!?])\s+/).filter(Boolean);
  let summary = '';
  if (sentences.length === 1) {
    summary = sentences[0];
  } else if (sentences.length > 1) {
    summary = `${sentences[0]} ${sentences[sentences.length - 1]}`;
  } else {
    summary = cleanText;
  }

  const keyTakeaways: string[] = [];
  keyTakeaways.push(`Tone: ${sentiment} (${score}% Positivity Index)`);
  if (sortedKeywords.length > 0) {
    keyTakeaways.push(`Keywords: ${sortedKeywords.join(', ')}`);
  }
  if (urgentHits > 0) {
    keyTakeaways.push(`⚠️ Detected ${urgentHits} risk/caution indicators in debrief.`);
  } else if (triumphantHits > 0) {
    keyTakeaways.push(`🎯 Debrief confirms full mission objective fulfillment.`);
  }

  return {
    sentiment,
    sentimentScore: score,
    sentimentColor,
    sentimentBadgeClass,
    keywords: sortedKeywords.length > 0 ? sortedKeywords : ['#debrief', '#voice-report'],
    summary: summary.length > 220 ? summary.substring(0, 217) + '...' : summary,
    keyTakeaways,
    timestamp: new Date().toISOString(),
    author,
    reportType
  };
}
