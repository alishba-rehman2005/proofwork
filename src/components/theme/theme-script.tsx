export const THEME_STORAGE_KEY = "proofwork-theme";

/**
 * Applies the stored theme before first paint.
 *
 * This has to run synchronously in <head>: if the class were applied after
 * hydration, a dark-mode user would see a white flash on every navigation.
 * Falls back to the OS preference when the user has made no explicit choice.
 */
const script = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = stored === "dark" || (stored !== "light" && prefersDark);

    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  } catch (error) {
    // Storage can throw in private browsing modes; the light default is fine.
  }
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
