// An issuer's name in the interface's language.
import type { Bond } from "../data/issues";
import type { Strings } from "../i18n";

export function issuerName(bond: Bond, t: Strings): string {
  return bond.issuer.kind === "ofz" ? t.ofzIssuer : t.companies[bond.issuer.industry](t.places[bond.issuer.place]);
}
