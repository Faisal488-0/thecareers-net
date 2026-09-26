/* Display policy: each vacancy card gets ONE complete, concise statement.
   Never slice source text or rely on CSS ellipsis to abbreviate a sentence.
   Keep original descriptions untouched for source details and future enrichment. */
(function (root) {
  'use strict';
  const MAX_LENGTH = 138;
  const terminal = /[.!?؟؛。]$/u;
  const dangling = /(?:\b(?:and|or|for|to|with|of|the|in|at|as|a|an|will|must|including|such as)\b|(?:و|في|من|إلى|على|مع|مثل|بما في ذلك))$/iu;

  function plainText(value) {
    return String(value || '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&(?:nbsp|#160);/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;|&#34;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function completeShortSummary(value, context = {}) {
    const text = plainText(value);
    // A published feed may contain snippets cut off by an upstream provider.
    // Ignore such unfinished input instead of passing it through to the card.
    const candidates = text.match(/[^.!?؟؛。]+(?:[.!?؟؛。](?=\s|$)|$)/gu) || [];
    for (const raw of candidates.slice(0, 3)) {
      const sentence = raw.trim().replace(/^[-•*\s]+/, '');
      if (sentence.length < 28 || sentence.length > MAX_LENGTH) continue;
      if (/\.{2,}$|…$/u.test(sentence)) continue;
      if (terminal.test(sentence)) return sentence;
      // Accept a short standalone statement even if the source omitted its period.
      if (candidates.length === 1 && !dangling.test(sentence) && !/[:,،؛;\-–]$/u.test(sentence)) {
        return sentence + '.';
      }
    }
    // No sufficiently brief complete source sentence exists. Do NOT display a
    // partial sentence, fabricate duties or append an ellipsis. Explain where
    // the complete original description can be read.
    const title = plainText(context.title);
    const company = plainText(context.company);
    const isArabic = context.lang === 'ar';
    const fallback = isArabic
      ? (title && company ? `وظيفة ${title} لدى ${company}. التفاصيل في الإعلان الأصلي.` : 'تفاصيل المهام الوظيفية في الإعلان الأصلي.')
      : (title && company ? `Vacancy: ${title} at ${company}. See the original posting for duties.` : 'Read the original posting for complete responsibilities.');
    return fallback.length <= MAX_LENGTH ? fallback
      : isArabic ? 'تفاصيل المهام الوظيفية في الإعلان الأصلي.' : 'Read the original posting for complete responsibilities.';
  }

  root.TheCareersJobSummary = completeShortSummary;
  if (typeof module === 'object' && module.exports) module.exports = { completeShortSummary, plainText };
})(typeof window !== 'undefined' ? window : globalThis);
