// The interface around the figures: the rating in a right-to-left
// sentence, tables on a phone, the issue list as one tab stop, the
// browser's Back on a phone, the diagnostics table and searching for OFZ
// in Russian.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { ISSUES, ready } from "./helpers";

/** Every table region in `scope` that is wider than its box. */
async function overflowing(scope: Locator): Promise<string[]> {
  return scope.locator(".stoa-table-region").evaluateAll((regions) =>
    regions.filter((r) => r.scrollWidth > r.clientWidth + 1).map((r) => `${r.getAttribute("aria-label") ?? r.textContent?.slice(0, 40)}: ${r.scrollWidth} > ${r.clientWidth}`),
  );
}

test("in Arabic the rating tag keeps its minus after the letters", async ({ page }) => {
  await page.goto(`/?lang=ar&issue=${ISSUES.offer}`);
  await ready(page);
  const tag = page.locator(".issue-card .tags .stoa-tag").first();
  await expect(tag).toContainText("BBB-");
  // Where the minus and the first B are drawn, left to right.
  const order = await tag.evaluate((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? "";
      const at = text.indexOf("BBB-");
      if (at < 0) continue;
      const rect = (start: number) => {
        const r = document.createRange();
        r.setStart(node!, start);
        r.setEnd(node!, start + 1);
        return r.getBoundingClientRect().left;
      };
      return { b: rect(at), minus: rect(at + 3) };
    }
    return null;
  });
  expect(order).not.toBeNull();
  expect(order!.minus).toBeGreaterThan(order!.b);
});

for (const lang of ["en", "ru", "ar"] as const) {
  test(`at 375 px every table on an issue fits its box (${lang})`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const id of [ISSUES.offer, ISSUES.floater]) {
      await page.goto(`/?lang=${lang}&issue=${id}`);
      await ready(page);
      await expect(page.getByTestId("result")).toBeVisible();
      expect(await overflowing(page.locator(".detail")), id).toEqual([]);
    }
  });
}
