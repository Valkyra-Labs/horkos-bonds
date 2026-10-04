// React Aria's NumberField (under Stoa's) accepts only the locale's own
// digits: in ar-u-nu-arab, typing or pasting 500 in Latin digits is
// rejected and the field keeps its old value. Many Arabic readers type
// Latin digits, so text arriving in a field inside `root` has its Latin
// digits rewritten in the locale's before the field sees it. Chromium
// and WebKit run the rewritten insertText through the same input events.
import { useEffect, type RefObject } from "react";

export function useLocalDigits(root: RefObject<HTMLElement | null>, locale: string) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const format = new Intl.NumberFormat(locale, { useGrouping: false });
    const map = new Map(Array.from({ length: 10 }, (_, d) => [String(d), format.format(d)]));
    if ([...map].every(([latin, local]) => latin === local)) return;
    const onBeforeInput = (event: InputEvent) => {
      const data = event.data;
      if (!data || !/[0-9]/.test(data) || !(event.target instanceof HTMLInputElement)) return;
      event.preventDefault();
      document.execCommand("insertText", false, data.replace(/[0-9]/g, (d) => map.get(d) ?? d));
    };
    el.addEventListener("beforeinput", onBeforeInput, true);
    return () => el.removeEventListener("beforeinput", onBeforeInput, true);
  }, [root, locale]);
}
