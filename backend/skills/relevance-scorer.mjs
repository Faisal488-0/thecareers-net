const DEFAULT_TERMS = [
  'hr','human resources','operations','administration','administrative',
  'information systems','business development','recruitment','oil','gas',
  'education','school','teacher','mathematics','coordinator','specialist'
];

export function scoreJob(job, terms = DEFAULT_TERMS) {
  const text = [job.title, job.company, job.location, job.category, job.description]
    .filter(Boolean).join(' ').toLowerCase();
  let score = 35;
  for (const term of terms) {
    if (text.includes(term.toLowerCase())) score += term.includes(' ') ? 8 : 5;
  }
  if (/kuwait|ahmadi|hawally|farwaniya|mubarak|jahra/i.test(text)) score += 12;
  if (job.verified) score += 5;
  return Math.max(0, Math.min(99, score));
}
