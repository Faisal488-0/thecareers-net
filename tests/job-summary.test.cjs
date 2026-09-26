const { test } = require('node:test');
const assert = require('node:assert/strict');
const { completeShortSummary: summary } = require('../assets/job-summary.js');

test('retains a complete short sentence without truncation', () => {
  const text = 'Organized admin assistant wanted for an established business in Salmiya. The candidate will coordinate several projects and tasks.';
  assert.equal(summary(text), 'Organized admin assistant wanted for an established business in Salmiya.');
});
test('does not show truncated third-party snippets', () => {
  const actual = summary('The candidate will manage onboarding and employee', { title:'HR Coordinator',company:'Acme' });
  assert.match(actual, /^Vacancy: HR Coordinator at Acme\./);
  assert.doesNotMatch(actual, /employee$/);
});
test('avoids slicing long sentences in the middle of a thought', () => {
  const source = 'We need a professional who will support all departments across every regional office as well as liaising with external stakeholders on a wide range of administrative matters while closely coordinating all related programmes.';
  assert.equal(summary(source, {title:'Officer',company:'Example'}), 'Vacancy: Officer at Example. See the original posting for duties.');
});
test('extracts complete sentence from HTML and handles Arabic', () => {
  assert.equal(summary('<p>إدارة سجلات الموظفين والتنسيق مع فريق التوظيف لضمان دقة البيانات.</p>'), 'إدارة سجلات الموظفين والتنسيق مع فريق التوظيف لضمان دقة البيانات.');
});
test('provides honest bilingual fallback when description is missing', () => {
  assert.equal(summary('',{lang:'ar'}),'تفاصيل المهام الوظيفية في الإعلان الأصلي.');
  assert.equal(summary('',{lang:'en'}),'Read the original posting for complete responsibilities.');
});
test('never shows an ellipsis as a substitute for a summary', () => {
  assert.doesNotMatch(summary('Strong willed admin ...',{title:'Assistant',company:'Example'}), /…|\.\.\./);
});
