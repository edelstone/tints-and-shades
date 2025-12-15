const SETTINGS_STORAGE_KEY = "settings";
const settings = { copyWithHashtag: false, tintShadeCount: 10 };
const tintShadeOptions = [5, 10, 20];

const setActiveCountButtons = (buttons, count) => {
  buttons.forEach((btn) => {
    const btnValue = parseInt(btn.getAttribute("data-count"), 10);
    const isActive = btnValue === count;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    btn.setAttribute("tabindex", isActive ? "0" : "-1");
  });
};

const loadSettings = () => {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!savedSettings) return;
    const parsed = JSON.parse(savedSettings);
    if (parsed && typeof parsed === "object") {
      Object.assign(settings, parsed);
    }
  } catch (e) {
    // ignore bad or unavailable storage
  }
};

const saveSettings = () => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    // ignore
  }
};

const updateHashtagToggle = (button, isOn) => {
  if (!button) return;
  button.setAttribute("aria-pressed", isOn ? "true" : "false");
  button.classList.toggle("is-active", isOn);
  button.setAttribute("aria-label", isOn ? "Include hashtag when copying" : "Hide hashtag when copying");
};

// Initialize the settings and UI state
const initializeSettings = (initialUrlState = {}) => {
  loadSettings();
  if (typeof initialUrlState.copyWithHashtag === "boolean") {
    settings.copyWithHashtag = initialUrlState.copyWithHashtag;
  }
  if (typeof initialUrlState.tintShadeCount === "number") {
    settings.tintShadeCount = palettes.normalizeTintShadeCount(initialUrlState.tintShadeCount);
  }

  const colorValuesElement = document.getElementById("color-values");
  const hashtagToggle = document.getElementById("show-hide-hashtags");
  const stepSelector = document.querySelector(".inline-actions .step-selector");
  const tintShadeButtons = stepSelector ? Array.from(stepSelector.querySelectorAll(".step-selector-option")) : [];

  if (hashtagToggle) {
    updateHashtagToggle(hashtagToggle, settings.copyWithHashtag);
    hashtagToggle.addEventListener("click", () => {
      settings.copyWithHashtag = !settings.copyWithHashtag;
      updateHashtagToggle(hashtagToggle, settings.copyWithHashtag);
      saveSettings();
      exportUI.updateClipboardData(settings.copyWithHashtag);
      exportUI.updateExportOutput(exportUI.state, exportUI.elements);
      if (palettes.updateHexValueDisplay) {
        palettes.updateHexValueDisplay(settings.copyWithHashtag);
      }
      if (palettes.updateHashState && palettes.parseColorValues && colorValuesElement) {
        const parsedColors = palettes.parseColorValues(colorValuesElement.value) || [];
        if (!parsedColors.length) return;
        palettes.updateHashState(parsedColors, settings);
      }
    });
  }

    if (tintShadeButtons.length) {
    if (!tintShadeOptions.includes(settings.tintShadeCount)) {
      settings.tintShadeCount = 10;
    }
    setActiveCountButtons(tintShadeButtons, settings.tintShadeCount);

    const activateIndex = (nextIndex) => {
      const target = tintShadeButtons[nextIndex];
      if (!target) return;
      const nextValue = parseInt(target.getAttribute("data-count"), 10);
      if (!tintShadeOptions.includes(nextValue)) return;
      if (settings.tintShadeCount === nextValue) {
        target.focus();
        return;
      }
      settings.tintShadeCount = nextValue;
      setActiveCountButtons(tintShadeButtons, settings.tintShadeCount);
      saveSettings();
      palettes.createTintsAndShades(settings, false, { skipScroll: true, skipFocus: true });
      target.focus();
    };

    tintShadeButtons.forEach((button, index) => {
      button.addEventListener("click", () => {
        activateIndex(index);
      });

      button.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          const nextIndex = (index + 1) % tintShadeButtons.length;
          activateIndex(nextIndex);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          const prevIndex = (index - 1 + tintShadeButtons.length) % tintShadeButtons.length;
          activateIndex(prevIndex);
        } else if (event.key === "Home") {
          event.preventDefault();
          activateIndex(0);
        } else if (event.key === "End") {
          event.preventDefault();
          activateIndex(tintShadeButtons.length - 1);
        } else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activateIndex(index);
        }
      });
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const urlState = palettes.readHashState ? palettes.readHashState() : {};
  initializeSettings(urlState);
  exportUI.wireExportControls();

  const colorValuesElement = document.getElementById("color-values");
  if (colorValuesElement) {
    colorValuesElement.value = urlState.colors || "";
  } else {
    console.error("Element with id 'color-values' not found.");
  }

  palettes.createTintsAndShades(settings, true);

  const colorEntryForm = document.getElementById("color-entry-form");
  if (colorEntryForm) {
    colorEntryForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const {
        skipScroll = false,
        skipFocus = false,
        focusPickerContext = null
      } = e.detail || {};
      palettes.createTintsAndShades(settings, false, { skipScroll, skipFocus, focusPickerContext });
    });
  } else {
    console.error("Element with id 'color-entry-form' not found.");
  }

  const copyWithHashtagToggle = document.getElementById("show-hide-hashtags");
  if (!copyWithHashtagToggle) {
    console.error("Element with id 'show-hide-hashtags' not found.");
  }
});

document.addEventListener("click", (event) => {
  if (event.target.id === "make") {
    if (!document.getElementById("carbonads")) return;
    if (typeof _carbonads !== "undefined") _carbonads.refresh();
  }
});
