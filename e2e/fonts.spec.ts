// Arabic from the first paint: the page's language and direction are set
// by the HTML itself, before any script module runs, and the Arabic face
// is preloaded only when the page is in Arabic.
import { expect, test } from "@playwright/test";
import { ready } from "./helpers";

test("lang and dir come from the link or the last visit before the app's script runs", async ({ page }) => {
  // No module script at all: what is left is the HTML and its inline script.
  await page.route(/\/assets\/.*\.js$/, (route) => route.abort());
  await page.route(/\/src\/.*$/, (route) => route.abort());
  await page.goto("/?lang=ar&theme=dark");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("lang", "ar");
  await expect(html).toHaveAttribute("dir", "rtl");
  await expect(html).toHaveAttribute("data-theme", "dark");

  await page.evaluate(() => localStorage.setItem("horkos-bonds.lang", "ru"));
  await page.goto("/");
  await expect(html).toHaveAttribute("lang", "ru");
  await expect(html).toHaveAttribute("dir", "ltr");
  await page.goto("/?lang=xx");
  await expect(html).toHaveAttribute("lang", "ru");
});

test("the Arabic face is preloaded in Arabic only, and used", async ({ page }) => {
  const preloads = () => page.locator('link[rel="preload"][as="font"]').evaluateAll((links) => links.map((l) => (l as HTMLLinkElement).href));
  await page.goto("/?lang=ar");
  await ready(page);
  const ar = await preloads();
  expect(ar).toHaveLength(1);
  expect(ar[0]).toMatch(/ibm-plex-sans-arabic-arabic-400-normal.*\.woff2$/);
  // The preloaded file is the one the page's font face uses, so it is not
  // fetched twice.
  const fetched = await page.evaluate(() => performance.getEntriesByType("resource").filter((e) => /ibm-plex-sans-arabic-arabic-400-normal/.test(e.name)).length);
  expect(fetched).toBe(1);
  await page.goto("/?lang=en");
  await ready(page);
  expect(await preloads()).toEqual([]);
});
