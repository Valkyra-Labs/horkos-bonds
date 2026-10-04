// The market every figure is computed in: a fixed valuation date, so the
// data, the tests and the screenshots stay the same from day to day, and
// the key rate on that date. All issues are fictional.
import type { Market } from "horkos-yield-twin";

export const VALUATION_DATE = "2026-09-04";
export const KEY_RATE_PCT = 16;
/** Personal income tax on coupons and on a gain, percent. */
export const TAX_RATE_PCT = 13;

export const MARKET: Market = { valuationDate: VALUATION_DATE, keyRatePct: KEY_RATE_PCT };

const DAY_MS = 86_400_000;
const [y, m, d] = VALUATION_DATE.split("-").map(Number) as [number, number, number];
/** Midnight UTC of the valuation date, in milliseconds since the epoch. */
export const VALUATION_MS = Date.UTC(y, m - 1, d);

/** A day offset from the valuation date as milliseconds since the epoch
 * (midnight UTC), for Intl and Stoa's charts. */
export function dayToMs(day: number): number {
  return VALUATION_MS + day * DAY_MS;
}

/** A day offset from the valuation date as YYYY-MM-DD. */
export function dayToIso(day: number): string {
  return new Date(dayToMs(day)).toISOString().slice(0, 10);
}
