# Horkos Bonds

A bond-investing screen for the Russian bond market, in the browser: a
list of sixty fictional issues to search and filter, a card for each
issue with its figures and payment schedule, and a calculator for holding
it.

The bond mathematics is [horkos-yield](https://github.com/Valkyra-Labs/horkos-yield):
Rust compiled to WebAssembly, with a separately written TypeScript twin.
The interface is React and TypeScript on the
[Stoa](https://github.com/Valkyra-Labs/stoa-system) design system.
Everything runs in the browser; there is no server.

Status: early. Performance record, with stamps:
[docs/MEASUREMENTS.md](docs/MEASUREMENTS.md).

## What it does

- **The list**: sixty generated issues (ten federal loan bonds, OFZ, and
  fifty corporate issues; fixed coupons, floaters on the key rate,
  amortising issues and issues with an offer). Search by issuer or
  ticker; filter chips in groups (issuer, coupon, maturity, features),
  each with the count it would leave; sort by yield, maturity or rating.
  A search with no match says so and offers to clear the filters.
- **The issue**: clean and dirty price, accrued interest, yields to
  maturity and to the offer, simple yield, Macaulay and modified
  duration; the payment schedule as an event strip (coupons,
  amortisation, offer, maturity) and as a table per bond; for a fixed
  coupon, the dirty price against the yield.
- **The calculator**: amount, holding horizon (with presets for one year,
  the offer and maturity), coupon reinvestment, tax regime (standard 13
  percent, the long-term holding relief, an individual investment
  account of type B) and a key-rate change. The result is the total at
  the horizon as a signed breakdown (income positive, tax and commission
  negative), the profit and the effective annual return; the sale before
  maturity under the key-rate change; for a floater, the key rate down
  2, unchanged and up 2 points, with the coupons under each; for an issue
  with an offer, selling back at the offer against holding on at a low
  coupon. Every input recalculates at once. An error the engine returns
  (an amount of zero, one that does not buy a bond, one over the limit)
  is a sentence with a way back to valid inputs.
- **Terms**: local terms keep their names (OFZ, key rate, LDV, IIS type
  B, offer); the inputs that use them say what they mean, and a Terms
  section explains each in a line.

The prices are as of a fixed valuation date, 4 September 2026, with the
key rate at 16 percent, so the figures are the same on every visit.

## Engines

The WebAssembly build is the default. If it cannot load, the TypeScript
twin computes the same figures and the page says so, with a retry. The
engine diagnostics (a button at the foot of the page, opening a sheet)
switch between the two, show the WebAssembly load time and the last
call's time, and time both engines on the issue and plan on screen. An
end-to-end test checks that both engines render identical figures for
the same inputs on four issues, and a unit test checks them against each
other, through the app's own adapters, on every issue with several
plans.

## Languages and themes

English, Russian and Arabic, with the same keys in each (checked by a
unit test); Arabic is right to left, with Arabic-Indic digits. Numbers,
money (roubles, with the sign) and dates are written through Intl in the
language's locale. The theme is System, Light or Dark, System by
default. Both are kept in the URL (`?lang=en|ru|ar`, `?theme=system|light|dark`)
and in localStorage. `?issue=TICKER` opens an issue, `?engine=twin`
starts on the TypeScript engine.

## Accessibility

What the tests cover, and nothing wider:

- axe (`@axe-core/playwright`) finds no serious or critical violation in
  English, Russian and Arabic, each in the light and the dark theme, on:
  the list, an issue with an offer (with the Terms open), a floater, the
  empty list, a calculation error, the diagnostics sheet with timings,
  the loading state and the WebAssembly fallback, at 1440 px; and the
  list and an issue at 375 px.
- Keyboard paths: `/` to the search, Tab to an issue and Enter to open
  it, the horizon and key-rate sliders by arrow and page keys, the
  reinvestment switch by Space, `?` for the shortcuts dialog, Escape to
  close it; on a phone, Back returns focus to the issue's row. The
  scroll keys scroll the page with nothing focused.
- No sideways page scroll at 1280 px and at 375 px, in each language.
- The header stays in place while the page scrolls under it, and the
  scrollbars are Stoa's.

No screen reader was tried by hand.

## Development

Stoa and the engine are linked from sibling checkouts: clone
[stoa-system](https://github.com/Valkyra-Labs/stoa-system) and build it
(`pnpm build`), and clone horkos-yield next to this repository, build its
WebAssembly package into `pkg/` with wasm-pack and its twin with
`pnpm build` in `twin/` (see its README).

```bash
pnpm install
pnpm dev          # http://localhost:5176
pnpm test         # unit tests (vitest)
pnpm e2e          # builds, serves on port 4176 and runs Playwright
node scripts/measure.mjs   # after pnpm build: the measurement tables
```

## Measurements

At build `b2c8984`, in headless Chromium 153 on an Apple M4 Pro, from a
local server ([details and what they leave out](docs/MEASUREMENTS.md)):

- WebAssembly load and instantiate: 5.1 ms median over 10 cold loads;
  the list with all sixty issues derived is committed 102 ms after
  navigation start (median).
- Per call, median of 200 samples of 10-call means: derive_bond 0.09 ms
  in WebAssembly and 0.03 ms in TypeScript on a quarterly fixed issue;
  0.61 ms and 0.18 ms on the heaviest issue (a monthly floater with 99
  payments). calculate is within a few hundredths of a millisecond of
  derive_bond on each.
- A horizon step to the calculator's result committed: 7.9 ms median.
- Sizes: WebAssembly 64,861 bytes (24,975 gzipped); JavaScript 591,692
  bytes (180,677 gzipped).

## License

MIT OR Apache-2.0, at your option. Fonts: SIL Open Font License 1.1.
