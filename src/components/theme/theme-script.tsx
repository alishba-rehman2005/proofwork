export const THEME_STORAGE_KEY = "proofwork-theme";

/**
 * Applies the stored theme before first paint.
 *
 * This has to run synchronously in <head>: if the class were applied after
 * hydration, a dark-mode user would see a white flash on every navigation.
 *
 * Light is the default. ProofWork sits inside the CP Nexum ecosystem, which is
 * a light product, so dark is opt-in via the toggle rather than inherited from
 * the operating system.
 */
const script = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var isDark = stored === "dark";

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
