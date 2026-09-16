# 20-point website compliance baseline — 2026-09-16

Scope: `thecareers.net` public beta. Keep visual/functional changes minimal and do not present demo/placeholders as verified live facts.

| # | Control | Status / implementation |
|---|---|---|
| 1 | Privacy policy | Existing bilingual `privacy.html` updated to v1.2. |
| 2 | Terms of service | Existing bilingual `terms.html` updated to v1.1. |
| 3 | Refund policy | Current public beta has no paid checkout. Terms require clear price/cancellation/refund disclosure before any future purchase. |
| 4 | Cookie policy | Added to Privacy §11 (cookies/local storage/telemetry). |
| 5 | Cookie consent/banner | Added a low-impact first-visit essential-storage notice. No optional advertising cookie is enabled by this change. |
| 6 | Form consents | No public marketing subscription is assumed. Account/CV processing is disclosed in privacy; new forms collecting new purposes must add explicit purpose/consent where required. |
| 7 | No unnecessary data | CV/account policy limits processing to account, job-search, security and service functions; optional phone remains optional. |
| 8 | Third-party SDK audit | Existing `.gitleaks.toml`/security tooling retained; review new SDKs/scripts before adding. |
| 9 | No dark patterns | Do not use prechecked marketing opt-ins, false urgency, obstructive deletion/cancellation or deceptive controls. |
| 10 | No hidden fees | No current checkout; future paid features must disclose total/recurring fees before purchase. |
| 11 | Remove fake reviews | Terms explicitly prohibit fabricated testimonials/reviews. |
| 12 | Unsupported claims | Terms require metrics/verification/source claims to be data-backed; fixed demo source-count/platform claims on the main UI were neutralized without changing layout. |
| 13 | Accessibility alt text | New meaningful images require text alternatives; controls/links use accessible labels. |
| 14 | Color contrast | Preserve current identity while keeping readable text/control contrast. |
| 15 | Keyboard navigation | Existing job rows/buttons use keyboard semantics; new controls require visible focus and keyboard support. |
| 16 | Business details | Operator status, Kuwait basis and support email remain published in legal pages. |
| 17 | Age consent for kids' data | Service is not child-directed; Privacy §12 instructs users not to submit child personal data. |
| 18 | Unsubscribe in emails | Privacy §14 requires working unsubscribe for future promotional/bulk email; essential account/security messages remain separate. |
| 19 | License fonts/images | Terms require applicable licence/permission and attribution for third-party assets. |
| 20 | Data deletion request | Privacy §9 provides access/correction/deletion request route via `support@thecareers.net`, with identity verification where appropriate. |

## Regression checks before merge

1. Validate HTML/JS syntax for changed static assets.
2. Confirm dashboard, Jobs, Search, Companies, CV Center and Settings navigation still responds.
3. Confirm job cards still load from the current backend and official external links remain unchanged.
4. Confirm globe/network interactions and mobile touch navigation still work.
5. Confirm `privacy.html`, `terms.html`, `disclaimer.html` and first-visit privacy notice render on desktop/mobile widths.
6. Confirm no new third-party tracker/SDK was introduced.
