(() => {
  const storageKey = "theme";
  const root = document.documentElement;
  const toggle = document.getElementById("darkmode-toggle");
  const toggleText = document.getElementById("darkmode-text-toggle");
  const prismLightThemeLink = document.getElementById("prism-light-theme");
  const prismDarkThemeLink = document.getElementById("prism-dark-theme");

  const updatePrismThemeLinks = (isDark) => {
    if (typeof isDark !== "boolean") return;
    if (prismLightThemeLink) {
      prismLightThemeLink.disabled = isDark;
    }
    if (prismDarkThemeLink) {
      prismDarkThemeLink.disabled = !isDark;
    }
  };

  const getStoredTheme = () => {
    try {
      return localStorage.getItem(storageKey);
    } catch (e) {
      return null;
    }
  };

  const setStoredTheme = (theme) => {
    try {
      localStorage.setItem(storageKey, theme);
    } catch (e) {
      // ignore
    }
  };

  const applyTheme = (theme, persist = false) => {
    const isDark = theme === "dark";
    root.classList.toggle("darkmode-active", isDark);
    updatePrismThemeLinks(isDark);
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(isDark));
      toggle.dataset.themeState = isDark ? "dark" : "light";
      toggle.setAttribute("aria-label", isDark ? "Light mode" : "Dark mode");
    }
    if (toggleText) toggleText.innerText = isDark ? "Light mode" : "Dark mode";
    if (persist) setStoredTheme(theme);
  };

  const preferred = getStoredTheme();
  const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialTheme = preferred || (systemPrefersDark ? "dark" : "light");
  applyTheme(initialTheme);

  const ensureThemeApplied = () => {
    const storedTheme = getStoredTheme();
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = storedTheme || (prefersDark ? "dark" : "light");
    if (nextTheme === "dark" && !root.classList.contains("darkmode-active")) {
      applyTheme("dark");
      return;
    }
    if (nextTheme === "light" && root.classList.contains("darkmode-active")) {
      applyTheme("light");
    }
  };

  const observer = new MutationObserver(() => {
    ensureThemeApplied();
  });
  observer.observe(root, { attributes: true, attributeFilter: ["class"] });

  if (toggle) {
    toggle.addEventListener("click", () => {
      const nextTheme = root.classList.contains("darkmode-active") ? "light" : "dark";
      applyTheme(nextTheme, true);
    });
  }
})();
