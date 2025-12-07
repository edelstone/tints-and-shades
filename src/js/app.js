// app.js - bootstrap settings, wire export UI, and kick off palette rendering
// Whether the user wants copying to include a hashtag
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

// Load the state from localStorage
const loadSettings = () => {
  const savedSettings = localStorage.getItem("settings");
  if (savedSettings) Object.assign(settings, JSON.parse(savedSettings));
};

// Save the state to localStorage
const saveSettings = () => {
  localStorage.setItem("settings", JSON.stringify(settings));
};

const updateHashtagToggle = (button, isOn) => {
  if (!button) return;
  button.setAttribute("aria-pressed", isOn ? "true" : "false");
  button.classList.toggle("is-active", isOn);
  button.setAttribute("aria-label", isOn ? "Hide hashtag when copying" : "Show hashtag when copying");
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
  const hashtagToggle = document.getElementById("copy-with-hashtag-toggle");
  const tintShadeButtons = Array.from(document.querySelectorAll(".count-selector__option"));

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
        const parsedColors = palettes.parseColorValues(colorValuesElement.value);
        if (parsedColors && parsedColors.length) {
          palettes.updateHashState(parsedColors, settings);
        }
      }
    });
  }

  if (tintShadeButtons.length) {
    const savedValue = tintShadeOptions.includes(settings.tintShadeCount)
      ? settings.tintShadeCount
      : 10;
    settings.tintShadeCount = savedValue;
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
      palettes.createTintsAndShades(settings);
    });
  } else {
    console.error("Element with id 'color-entry-form' not found.");
  }

  const copyWithHashtagToggle = document.getElementById("copy-with-hashtag-toggle");
  if (!copyWithHashtagToggle) {
    console.error("Element with id 'copy-with-hashtag-toggle' not found.");
  }
});

document.addEventListener("click", (event) => {
  if (event.target.id === "make") {
    if (!document.getElementById("carbonads")) return;
    if (typeof _carbonads !== "undefined") _carbonads.refresh();
  }
});
