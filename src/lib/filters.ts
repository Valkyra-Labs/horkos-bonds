// The list's filters, search and sort, free of React so the rules are
// unit-tested. Filters come in groups: within a group any chip may match
// (fixed or floater), except the features group, where every chip that is
// on must match (amortising and with an offer). Across groups all must
// match. A chip's count is the size of the list the chip would give: the
// other groups and the search as they are, its own group with it on.
import { ratingIndex, type Bond } from "../data/issues";
import type { Derived } from "../engine/types";

export type Item = { bond: Bond; derived: Derived };

export type ChipId = "ofz" | "corporate" | "fixed" | "floater" | "short" | "medium" | "long" | "amortising" | "offer";

export type GroupId = "sector" | "coupon" | "term" | "features";

export const GROUPS: readonly { id: GroupId; mode: "any" | "all"; chips: readonly ChipId[] }[] = [
  { id: "sector", mode: "any", chips: ["ofz", "corporate"] },
  { id: "coupon", mode: "any", chips: ["fixed", "floater"] },
  { id: "term", mode: "any", chips: ["short", "medium", "long"] },
  { id: "features", mode: "all", chips: ["amortising", "offer"] },
];

const YEAR = 365;

const MATCH: Record<ChipId, (item: Item) => boolean> = {
  ofz: ({ bond }) => bond.issuer.kind === "ofz",
  corporate: ({ bond }) => bond.issuer.kind === "corporate",
  fixed: ({ bond }) => bond.issue.couponType === "fixed",
  floater: ({ bond }) => bond.issue.couponType === "floater",
  short: ({ derived }) => derived.maturityDay <= YEAR,
  medium: ({ derived }) => derived.maturityDay > YEAR && derived.maturityDay <= 3 * YEAR,
  long: ({ derived }) => derived.maturityDay > 3 * YEAR,
  amortising: ({ bond }) => bond.issue.amortization.length > 0,
  offer: ({ derived }) => derived.offerDay !== null,
};

export type Query = {
  /** The chips that are on. */
  chips: readonly ChipId[];
  /** Text to look for in the issuer's name (in the interface's language)
   * and the ticker. */
  search: string;
};

export const EMPTY_QUERY: Query = { chips: [], search: "" };

/** Lower case without diacritics, and ё read as е, so a search is
 * forgiving about case and accents. */
function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase().replace(/ё/g, "е");
}

function matchesGroups(item: Item, chips: readonly ChipId[]): boolean {
  return GROUPS.every((group) => {
    const on = group.chips.filter((c) => chips.includes(c));
    if (on.length === 0) return true;
    return group.mode === "any" ? on.some((c) => MATCH[c](item)) : on.every((c) => MATCH[c](item));
  });
}

export function applyQuery(items: readonly Item[], query: Query, nameOf: (bond: Bond) => string): Item[] {
  const needle = fold(query.search.trim());
  return items.filter(
    (item) => matchesGroups(item, query.chips) && (needle === "" || fold(nameOf(item.bond)).includes(needle) || fold(item.bond.id).includes(needle)),
  );
}

/** How many items each chip would leave in the list. */
export function chipCounts(items: readonly Item[], query: Query, nameOf: (bond: Bond) => string): Record<ChipId, number> {
  const counts = {} as Record<ChipId, number>;
  for (const group of GROUPS) {
    for (const chip of group.chips) {
      const others = query.chips.filter((c) => !group.chips.includes(c));
      const own = group.mode === "any" ? [chip] : [...new Set([...query.chips.filter((c) => group.chips.includes(c)), chip])];
      counts[chip] = applyQuery(items, { chips: [...others, ...own], search: query.search }, nameOf).length;
    }
  }
  return counts;
}

export type SortKey = "yield" | "maturity" | "rating";

export function sortItems(items: readonly Item[], key: SortKey): Item[] {
  const tie = (a: Item, b: Item) => (a.bond.id < b.bond.id ? -1 : a.bond.id > b.bond.id ? 1 : 0);
  const copy = [...items];
  switch (key) {
    case "yield":
      return copy.sort((a, b) => b.derived.yieldEvent - a.derived.yieldEvent || tie(a, b));
    case "maturity":
      return copy.sort((a, b) => a.derived.maturityDay - b.derived.maturityDay || tie(a, b));
    case "rating":
      return copy.sort((a, b) => ratingIndex(a.bond.rating) - ratingIndex(b.bond.rating) || b.derived.yieldEvent - a.derived.yieldEvent || tie(a, b));
  }
}
