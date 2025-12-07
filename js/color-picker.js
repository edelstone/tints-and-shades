// color-picker.js - use Coloris preview as the commit action for adding hex values
(() => {
  const colorInput = document.getElementById("color-values");
  const pickerInput = document.getElementById("color-picker-input");
  const pickerButton = document.getElementById("color-picker-button");
  const pickerContainer = pickerInput ? pickerInput.parentElement : null;
  const submitButton = document.getElementById("make");

  if (!colorInput || !pickerInput || !pickerButton || typeof Coloris === "undefined") return;

  const defaultColor = "#0cf";
  let pendingHex = "";

  const focusEl = (el) => {
    if (el && typeof el.focus === "function") {
      el.focus({ preventScroll: true });
    }
  };

  const normalizeHex = (value) => {
    if (!value) return "";
    const raw = value.toString().trim();
    const withoutHash = raw.startsWith("#") ? raw.slice(1) : raw;
    const clean = withoutHash.replace(/[^0-9a-f]/gi, "").slice(0, 6).toLowerCase();
    if (clean.length === 3) {
      return clean.split("").map((char) => char + char).join("");
    }
    return clean;
  };

  const appendHexToInput = (hexValue) => {
    if (!hexValue) return;
    const currentValue = colorInput.value.trim();
    const newValue = currentValue ? `${currentValue} ${hexValue}` : hexValue;
    colorInput.value = newValue;
    colorInput.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const getThemeMode = () => (document.documentElement.classList.contains("darkmode-active") ? "dark" : "light");

  // Keep the hidden input out of the tab order to avoid stray focus stops
  pickerInput.setAttribute("tabindex", "-1");
  pickerInput.setAttribute("aria-hidden", "true");

  const setPickerBaseColor = () => {
    const parsedValues = window.palettes && window.palettes.parseColorValues
      ? window.palettes.parseColorValues(colorInput.value)
      : [];
    const lastHex = parsedValues && parsedValues.length ? parsedValues[parsedValues.length - 1] : null;
    const hexToUse = normalizeHex(lastHex ? `#${lastHex}` : defaultColor);
    const formatted = `#${hexToUse || normalizeHex(defaultColor)}`;
    pickerInput.value = formatted;
  };

  const getActiveHex = () => {
    const colorValueInput = document.getElementById("clr-color-value");
    const fromColorValue = colorValueInput ? normalizeHex(colorValueInput.value) : "";
    const fromPickerInput = normalizeHex(pickerInput.value);
    return pendingHex || fromColorValue || fromPickerInput;
  };

  const focusPickerStartControl = () => {
    const colorValueInput = document.getElementById("clr-color-value");
    const closeButton = document.getElementById("clr-close");

    if (colorValueInput) {
      colorValueInput.blur();
      if (typeof colorValueInput.setSelectionRange === "function") {
        colorValueInput.setSelectionRange(0, 0);
      }
    }

    focusEl(closeButton || pickerButton);
  };

  const commitColorFromPreview = () => {
    const hexValue = getActiveHex();
    if (!hexValue) return;
    appendHexToInput(hexValue);
    pendingHex = "";
    Coloris.close();
    focusEl(pickerButton);
  };

  const wirePreviewClick = () => {
    const preview = document.getElementById("clr-color-preview");
    if (!preview || preview.dataset.hexCommitAttached) return;
    preview.dataset.hexCommitAttached = "true";
    preview.addEventListener("click", (event) => {
      event.preventDefault();
      commitColorFromPreview();
    });
  };

  Coloris({
    el: "#color-picker-input",
    theme: "polaroid",
    themeMode: getThemeMode(),
    parent: pickerContainer || "body",
    alpha: false,
    format: "hex",
    focusInput: false,
    selectInput: false,
    closeButton: false,
    wrap: false,
    defaultColor,
    onChange: (color) => {
      pendingHex = normalizeHex(color);
    }
  });

  // Keep the hidden input out of the tab order to avoid stray focus stops
  pickerInput.setAttribute("tabindex", "-1");
  pickerInput.setAttribute("aria-hidden", "true");
  pickerInput.inert = true;

  pickerInput.addEventListener("close", () => {
    pendingHex = "";
    focusEl(pickerButton);
  });

  pickerButton.addEventListener("click", () => {
    Coloris.setInstance("#color-picker-input", { themeMode: getThemeMode(), parent: pickerContainer || "body" });
    setPickerBaseColor();
    pendingHex = "";
    setTimeout(wirePreviewClick, 0);
    setTimeout(focusPickerStartControl, 0);
    pickerInput.dispatchEvent(new Event("click", { bubbles: true }));
  });

  const handlePickerTab = (event) => {
    if (event.key !== "Tab") return;
    if (!event.shiftKey && submitButton) {
      event.preventDefault();
      focusEl(submitButton);
    } else if (event.shiftKey && colorInput) {
      event.preventDefault();
      focusEl(colorInput);
    }
  };

  pickerButton.addEventListener("keydown", handlePickerTab);

  if (submitButton) {
    submitButton.addEventListener("keydown", (event) => {
      if (event.key === "Tab" && event.shiftKey) {
        event.preventDefault();
        focusEl(pickerButton);
      }
    });
  }
})();
