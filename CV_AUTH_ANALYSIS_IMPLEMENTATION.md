# TheCareers — Auth + CV Analysis + Personalized Search

Implemented 9 Sep 2026.

## Live flow

1. User clicks the profile area or CV Center.
2. CV Center requires sign-in. New users can create a simple email/password account.
3. Auth is handled by Supabase Auth with the public publishable key only. No service-role or secret key is present in browser code.
4. Signed-in users can upload PDF, DOCX or TXT CVs up to 10 MB.
5. CV files are stored in the private Supabase Storage bucket `cvs` under `{auth.uid()}/...`.
6. RLS restricts `profiles`, `user_cvs`, `cv_analysis`, `search_preferences`, `job_matches`, and CV Storage objects to the owning user.
7. PDF text is extracted in-browser with PDF.js. DOCX text is extracted in-browser with Mammoth. TXT is read directly.
8. The first production analyzer is a free deterministic local rules engine. It extracts target roles, skills, sectors, education lines, languages, estimated years of experience and ATS-readiness signals.
9. The analysis is stored in `cv_analysis`; derived search criteria are stored in `search_preferences`.
10. Job cards show CV-personalized match scores when a CV profile is active.
11. Search Now queues an authenticated personalized `search_requests` record containing only that user's CV-derived search profile. RLS restricts users to their own requests.

## Database objects

- `profiles`
- `user_cvs`
- `cv_analysis`
- `search_preferences`
- `job_matches`
- `search_requests.user_id`
- private Storage bucket: `cvs`

## Phone verification preparation

`profiles.phone` and `profiles.phone_verified_at` are included now so SMS/OTP can be added later without redesigning the user profile. SMS/OTP is intentionally not enabled yet because it requires choosing/configuring a phone provider and may introduce per-message cost.

## CV parser tool bank

Saved/useful components:

- PDF.js / pdfplumber / PyPDF2: PDF text extraction
- Mammoth / python-docx: DOCX extraction
- spaCy: NLP/NER and skill/title extraction
- scikit-learn: similarity/ranking
- MarkItDown: document-to-text conversion option for a server worker

GitHub candidate reviewed for a future advanced analyzer:

- `dhanushk-offl/resume-parser` (`resume-parser-ats`) — MIT, local/privacy-first, PDF parsing, structured resume fields, ATS scoring, suggestions, npm library/CLI/MCP. It makes no external API calls according to its repository documentation.

This third-party package is **not** inserted into the live browser pipeline yet. The current production path stays deterministic and dependency-light until the package is tested against TheCareers CV samples and deployment runtime.

## Security notes

- CV bucket is private.
- 10 MB file limit.
- Allowed MIME types: PDF, DOCX, TXT.
- Legacy `.doc` is rejected for the current browser parser.
- RLS ownership checks use `auth.uid()`.
- SECURITY DEFINER trigger execute permission was revoked from public/anon/authenticated roles after security-advisor review.
- One existing Supabase advisory remains unrelated to this feature: `pg_net` is installed in the public schema and can be moved later as a separate migration after checking dependencies.
