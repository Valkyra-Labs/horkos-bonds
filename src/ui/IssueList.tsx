// The list of issues: search, filter chips in groups with counts, a sort,
// and a table whose first column opens an issue.
import type { RefObject } from "react";
import { Button, EmptyState, FilterChipGroup, Select, Table, TextField, type TableColumn } from "@valkyra-labs/stoa-react";
import type { Bond } from "../data/issues";
import type { Strings } from "../i18n";
import { GROUPS, chipCounts, type ChipId, type GroupId, type Item, type Query, type SortKey } from "../lib/filters";
import type { Formats } from "../lib/format";

const CHIP_LABEL: Record<ChipId, keyof Strings> = {
  ofz: "chipOfz",
  corporate: "chipCorporate",
  fixed: "chipFixed",
  floater: "chipFloater",
  short: "chipShort",
  medium: "chipMedium",
  long: "chipLong",
  amortising: "chipAmortising",
  offer: "chipOffer",
};
const GROUP_LABEL: Record<GroupId, keyof Strings> = {
  sector: "groupSector",
  coupon: "groupCoupon",
  term: "groupTerm",
  features: "groupFeatures",
};

export type IssueListProps = {
  t: Strings;
  f: Formats;
  all: readonly Item[];
  visible: readonly Item[];
  query: Query;
  onQuery: (q: Query) => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  selectedId: string | null;
  onOpen: (id: string) => void;
  nameOf: (bond: Bond) => string;
  searchRef: RefObject<HTMLDivElement | null>;
};

export function IssueList({ t, f, all, visible, query, onQuery, sort, onSort, selectedId, onOpen, nameOf, searchRef }: IssueListProps) {
  const counts = chipCounts(all, query, nameOf);
  const columns: TableColumn<Item>[] = [
    {
      id: "issue",
      header: t.colIssue,
      cell: ({ bond }) => {
        const selected = bond.id === selectedId;
        return (
          <Button variant="ghost" className="issue-link" data-issue={bond.id} aria-current={selected ? "true" : undefined} onPress={() => onOpen(bond.id)}>
            <span className="issue-link__name">{nameOf(bond)}</span>
            <span className="issue-link__meta">
              <bdi className="ticker">{bond.id}</bdi> · <bdi className="ticker">{bond.rating}</bdi> · {bond.issue.couponType === "floater" ? t.chipFloater : t.chipFixed}
            </span>
          </Button>
        );
      },
    },
    {
      id: "yield",
      header: t.colYield,
      numeric: true,
      cell: ({ derived }) => (
        <span className="cell-stack">
          <span>{f.percent(derived.yieldEvent)}</span>
          <span className="cell-note">{derived.event === "offer" ? t.toOffer : t.toMaturity}</span>
        </span>
      ),
    },
    { id: "maturity", header: t.colMaturity, numeric: true, cell: ({ derived }) => f.date(derived.maturityDay) },
  ];
  const active = query.chips.length > 0 || query.search !== "";

  return (
    <div className="issue-list">
      <div ref={searchRef} className="issue-list__search">
        <TextField label={t.search} value={query.search} onChange={(search) => onQuery({ ...query, search })} />
      </div>
      {GROUPS.map((group) => (
        <div key={group.id} className="chip-row">
          <span className="chip-row__label" aria-hidden="true">
            {t[GROUP_LABEL[group.id]] as string}
          </span>
          <FilterChipGroup<ChipId>
            label={t[GROUP_LABEL[group.id]] as string}
            size="small"
            chips={group.chips.map((id) => ({ id, label: t[CHIP_LABEL[id]] as string, count: counts[id] }))}
            value={query.chips.filter((c) => group.chips.includes(c))}
            onChange={(on) => onQuery({ ...query, chips: [...query.chips.filter((c) => !group.chips.includes(c)), ...on] })}
          />
        </div>
      ))}
      <div className="issue-list__bar">
        <p className="muted" role="status">
          {t.listCount(f.integer(visible.length), f.integer(all.length))}
        </p>
        {active && (
          <Button variant="ghost" onPress={() => onQuery({ chips: [], search: "" })}>
            {t.clearFilters}
          </Button>
        )}
        <Select<SortKey>
          label={t.sortBy}
          size="small"
          value={sort}
          onChange={onSort}
          options={[
            { id: "yield", label: t.sortYield },
            { id: "maturity", label: t.sortMaturity },
            { id: "rating", label: t.sortRating },
          ]}
        />
      </div>
      {visible.length === 0 ? (
        <EmptyState
          title={t.noMatchesTitle}
          description={t.noMatchesBody}
          action={<Button onPress={() => onQuery({ chips: [], search: "" })}>{t.clearFilters}</Button>}
        />
      ) : (
        <Table<Item>
          caption={t.listCaption}
          captionHidden
          columns={columns}
          rows={[...visible]}
          rowKey={(i) => i.bond.id}
          rowHeader="issue"
          emptyText={t.noMatchesTitle}
          stickyHeader
          scrollable={false}
        />
      )}
    </div>
  );
}
