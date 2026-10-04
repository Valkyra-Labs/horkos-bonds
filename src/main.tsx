import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nProvider, applyLanguage, applyTheme, readLanguage, readThemeChoice, useLanguagePreference } from "@valkyra-labs/stoa-react";
import "@valkyra-labs/stoa-tokens/tokens.css";
import "./styles.css";
import { App } from "./App";
import { LANGS, LANG_STORE, LOCALES, THEME_STORE, type Lang } from "./i18n";

// The theme and the language before the first paint, so a dark page does
// not flash light and an Arabic one does not flash left to right.
applyTheme(readThemeChoice(THEME_STORE));
applyLanguage(readLanguage(LANGS, LANG_STORE));

/** The language, from ?lang= or the last visit. The provider sets the
 * locale for Stoa, React Aria and the app's own formats together. */
function Root() {
  const language = useLanguagePreference({ languages: LANGS, ...LANG_STORE });
  const lang = language.language as Lang;
  return (
    <I18nProvider locale={LOCALES[lang]}>
      <App lang={lang} onLang={(next) => language.setLanguage(next)} />
    </I18nProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
