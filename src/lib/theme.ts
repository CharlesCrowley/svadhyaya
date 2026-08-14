export type Theme = "light" | "dark";

const THEME_KEY = "svadhyaya.theme.v1";

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Storage can be unavailable in restricted webviews; use the system preference.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    theme === "dark" ? "#171110" : "#f7f1e7"
  );
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // The visual theme still applies for the current session.
  }
}

export function initialiseTheme(): Theme {
  const theme = readTheme();
  applyTheme(theme);
  return theme;
}
