// app.js - bootstrap settings, wire export UI, and kick off palette rendering
// Whether the user wants copying to include a hashtag
const settings = { copyWithHashtag: false };

// Load the state from localStorage
const loadSettings = () => {
  const savedSettings = localStorage.getItem("settings");
  if (savedSettings) Object.assign(settings, JSON.parse(savedSettings));
};

// Save the state to localStorage
const saveSettings = () => {
  localStorage.setItem("settings", JSON.stringify(settings));
};

// Initialize the settings and checkbox state
const initializeSettings = () => {
  loadSettings();
  const checkbox = document.getElementById("copy-with-hashtag");
  if (!checkbox) return;

  const switchLabel = checkbox.closest(".switch");
  if (switchLabel) switchLabel.classList.remove("switch-ready");

  checkbox.checked = settings.copyWithHashtag;

  if (switchLabel) {
    window.requestAnimationFrame(() => switchLabel.classList.add("switch-ready"));
  }

  checkbox.addEventListener("change", () => {
    settings.copyWithHashtag = checkbox.checked;
    saveSettings();
  });
};

document.addEventListener("DOMContentLoaded", () => {
  initializeSettings();
  exportUI.wireExportControls();

  const colorValuesElement = document.getElementById("color-values");
  if (colorValuesElement) {
    colorValuesElement.value = window.location.hash.slice(1).replace(/,/g, " ");
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

  const copyWithHashtagCheckbox = document.getElementById("copy-with-hashtag");
  if (copyWithHashtagCheckbox) {
    copyWithHashtagCheckbox.addEventListener("change", (e) => {
      settings.copyWithHashtag = e.target.checked;
      exportUI.updateClipboardData(settings.copyWithHashtag);
      exportUI.updateExportOutput(exportUI.state, exportUI.elements);
    });
  } else {
    console.error("Element with id 'copy-with-hashtag' not found.");
  }
});

document.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    document.activeElement.click();
  }
});

document.addEventListener("click", (event) => {
  if (event.target.id === "make") {
    if (!document.getElementById("carbonads")) return;
    if (typeof _carbonads !== "undefined") _carbonads.refresh();
  }
});
