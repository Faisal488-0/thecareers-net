# Security exceptions

## GHSA-ch52-4w7c-c8xp — `http-cache-semantics`

**Status:** temporary upstream exception, reviewed 2026-10-07.

GitHub's advisory marks `http-cache-semantics <=4.2.0` as High severity and currently lists **no patched release**. The vulnerable behavior concerns reuse of security-zeroed entries in a **shared HTTP response cache** when an attacker supplies `Cache-Control: max-stale`.

TheCareers does not expose Crawlee as a shared proxy/cache and does not accept client cache directives into a response cache. Crawlee is used only by scheduled/private outbound scraping jobs. Repository code contains no direct use of `http-cache-semantics`, `max-stale`, or a shared response cache.

The CI gate therefore acknowledges only this exact GHSA/package pair while still failing on every other High/Critical advisory. The exception must be removed as soon as a patched upstream dependency is available.

Moderate advisories remain visible in `npm audit`; they are not suppressed by this document. In particular, the current stable Crawlee line still constrains `stream-json` to the vulnerable 1.x API. Do not force-override it to 3.x because that changes module paths and can break Crawlee. Upgrade Crawlee when its stable release adopts a patched `stream-json`.
