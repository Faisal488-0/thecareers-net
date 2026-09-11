import asyncio
import os
from pathlib import Path

from browser_use import Agent, Browser, ChatBrowserUse

TARGET_URL = os.getenv("THECAREERS_QA_URL", "https://thecareers.net/")
REPORT_PATH = Path(os.getenv("THECAREERS_QA_REPORT", "qa/browser-use-report.md"))

TASK = f"""
Act as a strict senior QA engineer. Audit the public website {TARGET_URL} as a real user.
Do not submit job applications, create accounts, or make destructive changes.

Check all of the following:
1. Page loads successfully without obvious broken layout, blank major sections, or overlapping cards.
2. Desktop dashboard: AI Search Core/globe is visible and usable; the right analytics rail does not overlap the globe/category cards.
3. The visible top KPI cards render cleanly.
4. Country filters are visible between the KPI cards and Top Opportunities. Test All Countries, Kuwait, UAE, Saudi Arabia, Qatar, Oman, Bahrain, and GCC when present. Confirm the visible jobs change appropriately and that selecting a country does not leave unrelated country jobs visible.
5. Top Opportunities spans the available content width, controls are readable, and job rows are aligned.
6. Pagination shows at most 10 job rows per page and page controls work.
7. Check that obvious non-job junk such as Privacy, Terms of use, Newsletter, Language, Skip to main content, generic Welcome pages, or product/service pages are not displayed as jobs.
8. Open one visible official job link in a new tab if safe, verify it resolves to a plausible job/career page, then return without applying.
9. Exercise Sort by Newest and the main opportunity tabs without changing saved/application state.
10. Resize or inspect a mobile-width view if the browser supports it and note any clipping, horizontal overflow, inaccessible buttons, or overlapping content.
11. Record console-visible or user-visible errors you encounter.

Return a concise Markdown report with:
- Overall score out of 10
- PASS/FAIL for each numbered check
- Exact visual/function defects with reproduction steps
- Severity: blocker/high/medium/low
- A short recommended fix list, highest priority first
- Final verdict: READY / NEEDS FIXES
"""


async def main() -> None:
    if not os.getenv("BROWSER_USE_API_KEY"):
        raise SystemExit("BROWSER_USE_API_KEY is required. Add it as a GitHub Actions secret; never commit it.")

    browser = Browser(use_cloud=True, cloud_timeout=20)
    agent = Agent(
        task=TASK,
        llm=ChatBrowserUse(model="bu-2-0-mini-preview"),
        browser=browser,
    )

    try:
        history = await agent.run()
        result = history.final_result() if hasattr(history, "final_result") else str(history)
        REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
        REPORT_PATH.write_text(str(result or "No final result returned."), encoding="utf-8")
        print(REPORT_PATH.read_text(encoding="utf-8"))
    finally:
        try:
            await browser.close()
        except Exception:
            pass


if __name__ == "__main__":
    asyncio.run(main())
