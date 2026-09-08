# TheCareers — حزمة النقل إلى GitHub + Supabase

هذه الحزمة تحافظ على `index.html` الحالي وتضيف طبقة Backend تدريجيًا بدون إعادة تصميم الواجهة.

## البنية
- `index.html`: الواجهة الحالية.
- `config.js`: عنوان Supabase والمفتاح publishable فقط.
- `assets/backend-bridge.js`: تحميل الوظائف الحقيقية وLive Activity وتشغيل Search Now من Edge Function.
- `supabase/migrations/20260908_001_init.sql`: الجداول + RLS + الفهارس.
- `supabase/functions/search-now`: بحث فوري للمصادر HTML الخفيفة عبر Cheerio.
- `backend/scrape.mjs`: محرك قشط ثقيل عبر Crawlee + Playwright + Cheerio.
- `.github/workflows/scrape.yml`: تشغيل المحرك كل 6 ساعات أو يدويًا.
- `.github/workflows/pages.yml`: نشر الواجهة على GitHub Pages.

## محركات القشط
1. Cheerio: للمواقع HTML السريعة.
2. Playwright: للمواقع التي تحتاج JavaScript/browser.
3. Crawlee: إدارة الطوابير، retries، concurrency، والـcrawler lifecycle.

استخدم القشط فقط على المواقع التي تسمح بذلك، والتزم بشروط المواقع وrobots.txt. للمصادر المقيدة أو التي توفر API/RSS استخدم API/RSS بدل المتصفح.

## بعد إنشاء Supabase
1. طبّق migration.
2. انشر Edge Function `search-now`.
3. ضع `SUPABASE_URL` وpublishable key داخل `config.js`.
4. في GitHub Secrets أضف `SUPABASE_URL` و`SUPABASE_SERVICE_ROLE_KEY`.
5. أضف المصادر إلى جدول `sources` مع selectors داخل عمود `config`.

مثال config لمصدر HTML:
```json
{
  "item_selector": ".job-card",
  "title_selector": ".job-title",
  "company_selector": ".company",
  "location_selector": ".location",
  "link_selector": "a.job-link"
}
```

## ملاحظة أمان
المفتاح `SUPABASE_SERVICE_ROLE_KEY` يبقى فقط في GitHub Secrets / Edge Functions. لا تضعه أبدًا في `index.html` أو `config.js`.
