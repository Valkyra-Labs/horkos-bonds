import { useEffect, useMemo, useRef, useState } from "react";
import {
  AppHeader,
  Button,
  Callout,
  Disclosure,
  EmptyState,
  LanguageSwitch,
  PageShell,
  Panel,
  ScrollArea,
  ShortcutsDialog,
  Skeleton,
  SkeletonBlock,
  SkeletonLines,
  ThemeSwitch,
  groupShortcuts,
  useShortcuts,
  useThemePreference,
} from "@valkyra-labs/stoa-react";
import { BONDS, type Bond } from "./data/issues";
import { KEY_RATE_PCT, MARKET, TAX_RATE_PCT } from "./data/market";
import { activeEngine, useEngineChoice, useEngines } from "./engine/useEngines";
import type { Plan } from "./engine/types";
import { LANGS, LOCALES, THEME_STORE, strings, type Lang } from "./i18n";
import { EMPTY_QUERY, applyQuery, sortItems, type Item, type Query, type SortKey } from "./lib/filters";
import { formats } from "./lib/format";
import { issuerName } from "./lib/names";
import { timed } from "./lib/timing";
import { Calculator, defaultPlan, type PlanInput } from "./ui/Calculator";
import { Diagnostics } from "./ui/Diagnostics";
import { IssueCard } from "./ui/IssueCard";
import { IssueList } from "./ui/IssueList";
import { WIDE, useMediaQuery } from "./ui/useMediaQuery";

const readIssue = (): string | null => {
  const id = new URLSearchParams(location.search).get("issue");
  return id !== null && BONDS.some((b) => b.id === id) ? id : null;
};

/** Keeps the open issue in ?issue=, so a reload or a link opens it. */
function writeIssue(id: string | null) {
  const url = new URL(location.href);
  if (id === null) url.searchParams.delete("issue");
  else url.searchParams.set("issue", id);
  history.replaceState(history.state, "", url);
}

const TERM_KEYS = ["keyRate", "ofz", "accrued", "ytm", "offer", "amortisation", "duration", "ldv", "iis", "rating"] as const;

/** The screen. Rendered inside an I18nProvider set to the language's
 * locale, which Stoa's words and digits follow. */
export function App({ lang, onLang }: { lang: Lang; onLang: (lang: Lang) => void }) {
  const t = strings[lang];
  const f = formats(LOCALES[lang]);
  const theme = useThemePreference(THEME_STORE);
  const { engines, retry } = useEngines();
  const [choice, setChoice] = useEngineChoice();
  const engine = activeEngine(engines, choice);
  const wide = useMediaQuery(WIDE);

  const [query, setQuery] = useState<Query>(EMPTY_QUERY);
  const [sort, setSort] = useState<SortKey>("yield");
  const [selectedId, setSelectedId] = useState<string | null>(readIssue);
  const [plans, setPlans] = useState<Record<string, PlanInput>>({});
  const [diagOpen, setDiagOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [wasmNoticeDismissed, setWasmNoticeDismissed] = useState(false);
  const search = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLDivElement>(null);
  const returnTo = useRef<string | null>(null);

  useEffect(() => {
    document.title = t.title;
  }, [t]);

  const nameOf = (bond: Bond) => issuerName(bond, t);

  // Every issue derived by the active engine; derived again when the
  // engine changes.
  const items = useMemo<Item[] | null>(() => {
    if (!engine) return null;
    return BONDS.flatMap((bond) => {
      const r = engine.derive_bond(bond.issue, MARKET);
      return "ok" in r ? [{ bond, derived: r.ok }] : [];
    });
  }, [engine]);

  useEffect(() => {
    if (items && performance.getEntriesByName("horkos:list-ready").length === 0) performance.mark("horkos:list-ready");
  }, [items]);

  const visible = useMemo(() => (items ? sortItems(applyQuery(items, query, nameOf), sort) : []), [items, query, sort, t]);
  const selected = items?.find((i) => i.bond.id === selectedId) ?? null;
  const plan = selected ? (plans[selected.bond.id] ?? defaultPlan(selected.derived)) : null;
  const enginePlan: Plan | null = plan ? { ...plan, taxRatePct: TAX_RATE_PCT } : null;

  // The figures on screen, with the time each call took on the active
  // engine, for the diagnostics.
  const lastDerive = useMemo(() => (engine && selected ? timed(() => engine.derive_bond(selected.bond.issue, MARKET))[1] : null), [engine, selected]);
  const calc = useMemo(
    () => (engine && selected && enginePlan ? timed(() => engine.calculate(selected.bond.issue, MARKET, enginePlan)) : null),
    // The plan object is rebuilt on every render; its fields are what matter.
    [engine, selected, plan?.amount, plan?.horizonDay, plan?.reinvest, plan?.taxRegime, plan?.rateShiftPct],
  );

  const open = (id: string) => {
    returnTo.current = id;
    setSelectedId(id);
    writeIssue(id);
  };
  const close = () => {
    setSelectedId(null);
    writeIssue(null);
  };

  // On a narrow screen the issue replaces the list: focus goes to the
  // Back button when it opens, and back to the issue's row when it closes.
  useEffect(() => {
    if (wide) return;
    if (selectedId !== null) back.current?.querySelector("button")?.focus();
    else if (returnTo.current) document.querySelector<HTMLElement>(`[data-issue="${returnTo.current}"]`)?.focus();
  }, [selectedId, wide]);

  const help = useShortcuts([
    {
      key: "/",
      description: t.scSearch,
      group: t.scGeneral,
      onTrigger: () => {
        if (!wide && selectedId !== null) close();
        setTimeout(() => search.current?.querySelector("input")?.focus(), 0);
      },
    },
    { key: "?", description: t.scHelp, group: t.scGeneral, onTrigger: () => setHelpOpen(true) },
  ]);

  const loading = engines.status === "loading";
  const wasmFailed = engines.status === "ready" && engines.wasm === null;

  const list = items && (
    <IssueList
      t={t}
      f={f}
      all={items}
      visible={visible}
      query={query}
      onQuery={setQuery}
      sort={sort}
      onSort={setSort}
      selectedId={selectedId}
      onOpen={open}
      nameOf={nameOf}
      searchRef={search}
    />
  );

  const detail =
    selected && engine && plan && calc ? (
      <div className="detail" data-issue-open={selected.bond.id}>
        <IssueCard key={selected.bond.id} t={t} f={f} bond={selected.bond} derived={selected.derived} engine={engine} name={nameOf(selected.bond)} />
        <Calculator
          t={t}
          f={f}
          derived={selected.derived}
          plan={plan}
          onPlan={(p) => setPlans((all) => ({ ...all, [selected.bond.id]: p }))}
          result={calc[0]}
        />
      </div>
    ) : null;

  return (
    <PageShell
      header={
        <AppHeader
          title={t.title}
          subtitle={t.subtitle}
          actions={
            <>
              <ThemeSwitch value={theme.choice} onChange={theme.setChoice} />
              <LanguageSwitch languages={LANGS} value={lang} onChange={(next) => onLang(next as Lang)} />
            </>
          }
        />
      }
      footer={
        <div className="foot">
          <p>{t.footer(f.date(0), f.percent(KEY_RATE_PCT / 100, 0))}</p>
          <div className="foot__actions">
            <Button variant="ghost" onPress={() => setDiagOpen(true)}>
              {t.openDiagnostics}
            </Button>
            <Button variant="ghost" onPress={() => setHelpOpen(true)}>
              {t.openShortcuts}
            </Button>
          </div>
        </div>
      }
    >
      <div className="app" data-engine={engine?.kind ?? ""} data-state={loading ? "loading" : "ready"}>
        {wasmFailed && !wasmNoticeDismissed && (
          <Callout
            tone="warning"
            title={t.wasmFailedTitle}
            onDismiss={() => setWasmNoticeDismissed(true)}
            action={<Button onPress={retry}>{t.wasmRetry}</Button>}
          >
            {t.wasmFailedBody}
          </Callout>
        )}
        {loading ? (
          <div className="workspace" aria-busy="true">
            <Panel title={t.issues} className="pane-list">
              <Skeleton label={t.loadingEngine}>
                <SkeletonLines count={8} />
              </Skeleton>
            </Panel>
            {wide && (
              <div className="detail" aria-hidden="true">
                <SkeletonBlock blockSize="calc(var(--stoa-space-12) * 6)" />
              </div>
            )}
          </div>
        ) : wide ? (
          <div className="workspace">
            <Panel title={t.issues} className="pane-list">
              <ScrollArea className="pane-list__scroll">{list}</ScrollArea>
            </Panel>
            {detail ?? (
              <div className="detail detail--empty">
                <EmptyState title={t.chooseTitle} description={t.chooseBody} />
              </div>
            )}
          </div>
        ) : detail ? (
          <div className="narrow">
            <div ref={back}>
              <Button variant="ghost" onPress={close}>
                {t.back}
              </Button>
            </div>
            {detail}
          </div>
        ) : (
          <Panel title={t.issues} className="pane-list">
            {list}
          </Panel>
        )}

        <Disclosure summary={t.glossary} className="glossary">
          <dl className="glossary__list">
            {TERM_KEYS.map((k) => (
              <div key={k} className="glossary__item">
                <dt>{t.terms[k][0]}</dt>
                <dd>{t.terms[k][1]}</dd>
              </div>
            ))}
          </dl>
        </Disclosure>
      </div>

      <Diagnostics
        t={t}
        f={f}
        isOpen={diagOpen}
        onOpenChange={setDiagOpen}
        engines={engines}
        choice={choice}
        onChoice={setChoice}
        activeKind={engine?.kind ?? null}
        lastDeriveMs={lastDerive}
        lastCalculateMs={calc ? calc[1] : null}
        subject={selected && enginePlan ? { issue: selected.bond.issue, market: MARKET, plan: enginePlan } : null}
      />
      <ShortcutsDialog title={t.shortcutsTitle} isOpen={helpOpen} onOpenChange={setHelpOpen} groups={groupShortcuts(help, t.scGeneral)} />
    </PageShell>
  );
}
