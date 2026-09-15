/* TheCareers — desktop job-card meta layout + optional salary display.
   Presentation-only: does not filter, reorder, paginate, save, or open jobs. */
(() => {
  'use strict';
  if (window.__TC_JOB_CARD_DESKTOP_LAYOUT__) return;
  window.__TC_JOB_CARD_DESKTOP_LAYOUT__ = true;

  const STYLE_ID = 'tc-job-card-desktop-layout-style';
  const salaryById = new Map();
  let enhanceQueued = false;

  function clean(value = '') {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
  }

  function hasValue(value) {
    return value !== null && value !== undefined && clean(value) !== '';
  }

  function numberText(value) {
    if (!hasValue(value)) return '';
    const raw = clean(value);
    const numeric = Number(raw.replace(/,/g, ''));
    if (!Number.isFinite(numeric)) return raw;
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: Number.isInteger(numeric) ? 0 : 2
    }).format(numeric);
  }

  function currencySuffix(value) {
    const currency = clean(value);
    return currency ? ` ${currency}` : '';
  }

  function salaryText(job = {}) {
    const min = job.salary_min ?? job.salaryMin;
    const max = job.salary_max ?? job.salaryMax;
    const currency = job.currency ?? job.salary_currency ?? job.salaryCurrency;
    const suffix = currencySuffix(currency);

    if (hasValue(min) || hasValue(max)) {
      const minText = numberText(min);
      const maxText = numberText(max);
      if (minText && maxText) {
        return minText === maxText
          ? `Salary: ${minText}${suffix}`
          : `Salary: ${minText}–${maxText}${suffix}`;
      }
      if (minText) return `Salary: From ${minText}${suffix}`;
      if (maxText) return `Salary: Up to ${maxText}${suffix}`;
    }

    const direct = [job.salary, job.pay_range, job.payRange, job.compensation]
      .map(clean)
      .find(Boolean);
    if (!direct) return '';
    return /^salary\s*:/i.test(direct) ? direct : `Salary: ${direct}`;
  }

  function stripMetaIcon(text, type) {
    let value = clean(text);
    value = value.replace(/^(?:COUNTRY|LOCATION|EMPLOYMENT\s*TYPE|CATEGORY|SALARY\s*RANGE|DATE\s*POSTED)\s*/i, '');
    if (type === 'location') value = value.replace(/^[\s📍]+/u, '');
    else if (type === 'employment') value = value.replace(/^[\s🕐⏱⌚]+/u, '');
    else if (type === 'category') value = value.replace(/^[\s▤▦▣]+/u, '');
    return clean(value);
  }

  function normalizeCountry(value) {
    const raw = stripMetaIcon(value, 'country');
    if (!raw || /^(?:n\/?a|none|null|undefined|not specified|international)$/i.test(raw)) return raw || 'Not specified';
    const key = raw.toLowerCase().replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim();
    const map = {
      'uae':'United Arab Emirates',
      'u a e':'United Arab Emirates',
      'united arab emirates':'United Arab Emirates',
      'ksa':'Saudi Arabia',
      'k s a':'Saudi Arabia',
      'saudi':'Saudi Arabia',
      'saudi arabia':'Saudi Arabia',
      'kingdom of saudi arabia':'Saudi Arabia',
      'kuwait':'Kuwait',
      'state of kuwait':'Kuwait',
      'qatar':'Qatar',
      'oman':'Oman',
      'sultanate of oman':'Oman',
      'bahrain':'Bahrain',
      'kingdom of bahrain':'Bahrain'
    };
    return map[key] || raw;
  }

  function normalizeEmployment(value) {
    const raw = stripMetaIcon(value, 'employment');
    if (!raw || /^(?:n\/?a|none|null|undefined|not specified|unspecified)$/i.test(raw)) return 'Not specified';
    const key = raw.toLowerCase().replace(/[_/]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (/^full\s*time$/.test(key)) return 'Full-time';
    if (/^part\s*time$/.test(key)) return 'Part-time';
    if (/^(?:contract|contractor|fixed term|fixed-term)$/.test(key)) return 'Contract';
    if (/^(?:temporary|temp)$/.test(key)) return 'Temporary';
    if (/^(?:internship|intern|trainee)$/.test(key)) return 'Internship';
    if (/^(?:freelance|freelancer)$/.test(key)) return 'Freelance';
    if (/^(?:remote|work from home)$/.test(key)) return 'Remote';
    return raw;
  }

  function normalizeCategory(value) {
    const raw = stripMetaIcon(value, 'category');
    return raw && !/^(?:n\/?a|none|null|undefined|not specified)$/i.test(raw) ? raw : 'Not specified';
  }

  function normalizeLocation(value, country) {
    const raw = stripMetaIcon(value, 'location');
    if (!raw || /^(?:n\/?a|none|null|undefined|not specified)$/i.test(raw)) return 'Not specified';
    const normalizedCountry = normalizeCountry(country);
    const normalizedRaw = normalizeCountry(raw);
    if (normalizedCountry !== 'Not specified' && normalizedRaw.toLowerCase() === normalizedCountry.toLowerCase()) {
      return normalizedCountry;
    }
    return raw;
  }

  function dateValue(row) {
    const source = row.querySelector('.tc-job-date') || row.querySelector('.job-time');
    let value = clean(source?.textContent || 'Recently');
    value = value.replace(/^Date\s+Posted\s*[·:|-]?\s*/i, '');
    return value || 'Recently';
  }

  function tagMeta(span, label, type) {
    if (!span) return;
    span.classList.add(`tc-meta-${type}`);
    span.dataset.tcLabel = label;
    span.dataset.tcValue = stripMetaIcon(span.textContent, type);
  }

  function jobDataForRow(row) {
    const id = clean(row.dataset.jobId);
    const fromDb = id ? (salaryById.get(id) || {}) : {};
    return {
      salary: row.dataset.salary,
      salary_min: row.dataset.salaryMin,
      salary_max: row.dataset.salaryMax,
      compensation: row.dataset.compensation,
      pay_range: row.dataset.payRange,
      currency: row.dataset.currency,
      ...fromDb
    };
  }

  function directMetaValue(span) {
    if (!span) return '';
    const strong = span.querySelector('strong');
    if (strong) return clean(strong.textContent);
    const clone = span.cloneNode(true);
    clone.querySelectorAll('small').forEach(node => node.remove());
    return clean(clone.textContent);
  }

  function setModernMeta(span, label, value, type) {
    if (!span) return;
    span.classList.remove('tc-meta-location','tc-meta-employment','tc-meta-category','tc-meta-country','tc-meta-salary','tc-meta-date');
    span.classList.add(`tc-meta-${type}`);
    span.dataset.tcLabel = label;
    span.dataset.tcValue = clean(value);
    const small = span.querySelector('small');
    if (small) small.textContent = label.toUpperCase();
    const strong = span.querySelector('strong');
    if (strong) strong.textContent = clean(value);
  }

  function enhanceModernMeta(row, meta) {
    const items = Array.from(meta.querySelectorAll(':scope > .tc-meta-item[data-meta]'));
    if (!items.length) return false;

    const byKey = new Map(items.map(item => [clean(item.dataset.meta).toLowerCase(), item]));
    const countrySpan = byKey.get('country');
    const locationSpan = byKey.get('location');
    const typeSpan = byKey.get('type') || byKey.get('employment') || byKey.get('employment_type');
    const categorySpan = byKey.get('category');
    const salarySpan = byKey.get('salary');
    const dateSpan = byKey.get('date') || byKey.get('posted') || byKey.get('date_posted');

    const country = normalizeCountry(directMetaValue(countrySpan));
    const location = normalizeLocation(directMetaValue(locationSpan), country);
    const employment = normalizeEmployment(directMetaValue(typeSpan));
    const category = normalizeCategory(directMetaValue(categorySpan));

    setModernMeta(countrySpan, 'Country', country, 'country');
    setModernMeta(locationSpan, 'Location', location, 'location');
    setModernMeta(typeSpan, 'Employment Type', employment, 'employment');
    setModernMeta(categorySpan, 'Category', category, 'category');

    if (salarySpan) {
      const currentSalary = stripMetaIcon(directMetaValue(salarySpan), 'salary');
      const optionalSalary = salaryText(jobDataForRow(row)).replace(/^Salary\s*:\s*/i, '');
      const salary = currentSalary && !/^(?:not disclosed|n\/?a|none|null|undefined)$/i.test(currentSalary)
        ? currentSalary
        : (optionalSalary || 'Not disclosed');
      setModernMeta(salarySpan, 'Salary Range', salary, 'salary');
    }

    if (dateSpan) {
      const posted = stripMetaIcon(directMetaValue(dateSpan), 'date') || dateValue(row);
      setModernMeta(dateSpan, 'Date Posted', posted || 'Recently', 'date');
    }

    /* Remove only legacy synthetic duplicates. The six canonical data-meta fields stay intact. */
    meta.querySelectorAll(':scope > .tc-meta-date:not(.tc-meta-item), :scope > .tc-job-salary:not(.tc-meta-item)').forEach(el => el.remove());
    return true;
  }

  function enhanceCard(row) {
    if (!(row instanceof HTMLElement) || !row.classList.contains('backend-job')) return;
    const main = row.querySelector('.job-main');
    const meta = row.querySelector('.job-meta');
    if (!main || !meta) return;

    if (!enhanceModernMeta(row, meta)) {
      const baseSpans = Array.from(meta.children).filter(el =>
        el instanceof HTMLElement &&
        !el.classList.contains('tc-meta-date') &&
        !el.classList.contains('tc-job-salary')
      );
      tagMeta(baseSpans[0], 'Location', 'location');
      tagMeta(baseSpans[1], 'Employment Type', 'employment');
      tagMeta(baseSpans[2], 'Category', 'category');

      let date = meta.querySelector(':scope > .tc-meta-date');
      if (!date) {
        date = document.createElement('span');
        date.className = 'tc-meta-date';
        date.dataset.tcLabel = 'Date Posted';
        meta.appendChild(date);
      }
      const posted = dateValue(row);
      date.dataset.tcValue = posted;
      const dateText = `Date Posted · ${posted}`;
      if (date.textContent !== dateText) date.textContent = dateText;

      const formattedSalary = salaryText(jobDataForRow(row));
      let salary = meta.querySelector(':scope > .tc-job-salary');
      if (formattedSalary) {
        if (!salary) {
          salary = document.createElement('span');
          salary.className = 'tc-job-salary';
          salary.dataset.tcLabel = 'Salary Range';
          meta.appendChild(salary);
        }
        const salaryValue = formattedSalary.replace(/^Salary\s*:\s*/i, '');
        salary.dataset.tcValue = salaryValue;
        if (salary.textContent !== formattedSalary) salary.textContent = formattedSalary;
        salary.setAttribute('aria-label', formattedSalary);
      } else if (salary) {
        salary.remove();
      }
    }

    row.classList.add('tc-job-card-refined');
  }

  function enhanceAll() {
    enhanceQueued = false;
    document.querySelectorAll('#jobList > .backend-job').forEach(enhanceCard);
  }

  function queueEnhance() {
    if (enhanceQueued) return;
    enhanceQueued = true;
    requestAnimationFrame(() => setTimeout(enhanceAll, 0));
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* Salary is allowed on all breakpoints; desktop gets the new two-sided hierarchy. */
      #jobList .job-row.backend-job .job-meta .tc-job-salary,
      #jobList .job-row.backend-job .job-meta .tc-meta-item[data-meta="salary"]{
        font-weight:700!important;color:#555d68!important;
      }

      @media (min-width: 901px) {
        html body .row-opps #jobList .job-row.backend-job.tc-job-card-refined{
          grid-template-columns:54px minmax(190px,1.16fr) minmax(245px,.94fr) minmax(190px,220px)!important;
          grid-template-rows:auto auto!important;
          grid-template-areas:
            "logo title meta actions"
            "logo company meta score"!important;
          align-items:center!important;
          column-gap:16px!important;
          row-gap:4px!important;
          min-height:112px!important;
          padding:15px 17px!important;
          overflow:hidden!important;
        }

        html body .row-opps #jobList .job-row.backend-job.tc-job-card-refined .job-main{
          display:contents!important;
        }
        html body .row-opps #jobList .job-row.backend-job.tc-job-card-refined .job-main .title{
          grid-area:title!important;
          align-self:end!important;
          margin:0 0 5px!important;
          font-size:18px!important;
          line-height:1.22!important;
          font-weight:800!important;
          letter-spacing:-.014em!important;
          color:#0b0c0e!important;
        }
        html body .row-opps #jobList .job-row.backend-job.tc-job-card-refined .job-main .company{
          grid-area:company!important;
          align-self:start!important;
          margin:0!important;
          font-size:12.2px!important;
          line-height:1.35!important;
          font-weight:650!important;
          color:#626974!important;
        }

        html body .row-opps #jobList .job-row.backend-job.tc-job-card-refined .job-meta{
          grid-area:meta!important;
          min-width:0!important;
          width:100%!important;
          margin:0!important;
          padding:8px 0 8px 16px!important;
          border-left:1px solid #eceff3!important;
          display:grid!important;
          grid-template-columns:repeat(2,minmax(0,1fr))!important;
          grid-auto-flow:row!important;
          align-content:center!important;
          align-items:start!important;
          gap:8px 16px!important;
          font-size:10.5px!important;
          line-height:1.3!important;
          color:#69717c!important;
          overflow:visible!important;
        }
        html body .row-opps #jobList .job-row.backend-job.tc-job-card-refined .job-meta > span{
          min-width:0!important;
          max-width:100%!important;
          display:block!important;
          margin:0!important;
          padding:0!important;
          white-space:normal!important;
          overflow-wrap:anywhere!important;
          color:transparent!important;
          font-size:0!important;
          line-height:1.28!important;
          font-weight:650!important;
        }
        html body .row-opps #jobList .job-row.backend-job.tc-job-card-refined .job-meta > span::before{
          content:attr(data-tc-label);
          display:block;
          margin:0 0 2px;
          color:#9aa1aa;
          font-size:8.2px;
          line-height:1.1;
          font-weight:750;
          letter-spacing:.055em;
          text-transform:uppercase;
        }
        html body .row-opps #jobList .job-row.backend-job.tc-job-card-refined .job-meta > span::after{
          content:attr(data-tc-value);
          display:block;
          color:#59616c;
          font-size:10.5px;
          line-height:1.28;
          font-weight:650;
          letter-spacing:0;
          text-transform:none;
          white-space:normal;
          overflow-wrap:anywhere;
        }
        html body .row-opps #jobList .job-row.backend-job.tc-job-card-refined .job-meta .tc-job-salary::after,
        html body .row-opps #jobList .job-row.backend-job.tc-job-card-refined .job-meta .tc-meta-item[data-meta="salary"]::after{
          color:#303740;
          font-weight:800;
        }
        html body .row-opps #jobList .job-row.backend-job.tc-job-card-refined .tc-job-date{
          display:none!important;
        }

        html body .row-opps #jobList .job-row.backend-job.tc-job-card-refined .job-actions{
          grid-area:actions!important;
          align-self:end!important;
          justify-self:stretch!important;
          width:100%!important;
          min-width:0!important;
          margin:0!important;
          padding:0!important;
          display:grid!important;
          grid-template-columns:minmax(104px,1.18fr) minmax(80px,.82fr)!important;
          gap:8px!important;
          overflow:visible!important;
        }
        html body .row-opps #jobList .job-row.backend-job.tc-job-card-refined .job-score{
          grid-area:score!important;
          align-self:start!important;
          justify-self:end!important;
          width:auto!important;
          min-width:0!important;
          margin:0!important;
          padding:4px 2px 0!important;
          display:flex!important;
          align-items:baseline!important;
          justify-content:flex-end!important;
          gap:7px!important;
          text-align:right!important;
        }
        html body .row-opps #jobList .job-row.backend-job.tc-job-card-refined .job-score .pct{
          font-size:15px!important;
        }
        html body .row-opps #jobList .job-row.backend-job.tc-job-card-refined .job-score .lbl{
          margin:0!important;
          font-size:8.5px!important;
        }
      }

      @media (min-width: 901px) and (max-width: 1120px) {
        html body .row-opps #jobList .job-row.backend-job.tc-job-card-refined{
          grid-template-columns:48px minmax(170px,1.08fr) minmax(220px,.92fr) minmax(172px,194px)!important;
          column-gap:12px!important;
          padding:14px!important;
        }
        html body .row-opps #jobList .job-row.backend-job.tc-job-card-refined .job-main .title{
          font-size:16.5px!important;
        }
        html body .row-opps #jobList .job-row.backend-job.tc-job-card-refined .job-meta{
          gap:7px 10px!important;
          padding-left:12px!important;
        }
        html body .row-opps #jobList .job-row.backend-job.tc-job-card-refined .job-actions{
          grid-template-columns:minmax(96px,1.1fr) minmax(72px,.9fr)!important;
          gap:6px!important;
        }
      }

      @media (max-width: 900px) {
        #jobList .job-row.backend-job .job-meta .tc-meta-date:not(.tc-meta-item){display:none!important;}
        #jobList .job-row.backend-job .job-meta .tc-job-salary{
          display:inline!important;
          font-size:10px!important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  async function refreshSalaryMap() {
    const cfg = window.THECAREERS_CONFIG || {};
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) return;
    try {
      const base = String(cfg.SUPABASE_URL).replace(/\/$/, '');
      const url = `${base}/rest/v1/jobs?select=id,salary_min,salary_max,currency,found_at,published_at,score&status=eq.active&limit=1200`;
      const res = await fetch(url, {
        headers: {
          apikey: cfg.SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${cfg.SUPABASE_PUBLISHABLE_KEY}`
        }
      });
      if (!res.ok) throw new Error(`salary lookup ${res.status}`);
      const rows = await res.json();
      salaryById.clear();
      for (const job of rows || []) {
        if (!job?.id) continue;
        salaryById.set(String(job.id), job);
      }
      queueEnhance();
    } catch (error) {
      console.warn('[TheCareers] Optional salary display unavailable', error);
    }
  }

  function boot() {
    installStyle();
    const list = document.getElementById('jobList');
    if (!list) return setTimeout(boot, 120);

    queueEnhance();
    const observer = new MutationObserver(queueEnhance);
    observer.observe(list, { childList: true, subtree: true, characterData: true });

    window.addEventListener('resize', queueEnhance, { passive: true });
    refreshSalaryMap();
    setInterval(refreshSalaryMap, 60000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
