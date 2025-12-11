(() => {
  const colorInput = document.getElementById("color-values");
  const pickerInput = document.getElementById("color-picker-input");
  const pickerButton = document.getElementById("color-picker-button");
  const submitButton = document.getElementById("make");

  if (!colorInput || !pickerInput || !pickerButton || typeof Coloris === "undefined" || !window.palettes) return;

  const defaultColor = "#3b82f6";
  let pendingHex = "";
  let activeContext = { mode: "add", index: null };
  let hasCommittedThisSession = false;
  let shouldCommit = false;
  let lastTrigger = pickerButton;
  let activePickerCell = null;
  const ACTIVATION_KEYS = new Set(["enter", "return", "numpadenter", " ", "space", "spacebar"]);
  const ACTIVATION_KEY_CODES = new Set([13, 32]);
  const isActivationKey = (value) => {
    if (typeof value === "string") {
      return ACTIVATION_KEYS.has(value.toLowerCase());
    }
    if (typeof value === "number") {
      return ACTIVATION_KEY_CODES.has(value);
    }
    if (value && typeof value === "object") {
      if (isActivationKey(value.key)) return true;
      if (isActivationKey(value.code)) return true;
      const keyCode = typeof value.keyCode === "number" ? value.keyCode : value.which;
      if (typeof keyCode === "number") {
        return isActivationKey(keyCode);
      }
    }
    return false;
  };

  const clearActivePickerCell = () => {
    if (activePickerCell && activePickerCell.classList) {
      activePickerCell.classList.remove("is-picker-open");
    }
    activePickerCell = null;
  };

  const activatePickerCell = (target) => {
    clearActivePickerCell();
    if (target && target.classList && target.classList.contains("hex-color-picker")) {
      activePickerCell = target;
      activePickerCell.classList.add("is-picker-open");
    }
  };

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
    if (clean.length !== 6) return "";
    return clean;
  };

  const getThemeMode = () => (document.documentElement.classList.contains("darkmode-active") ? "dark" : "light");

  let activePickerAnchor = null;

  const updatePickerInputPosition = () => {
    if (!pickerInput || !activePickerAnchor) return;
    const rect = activePickerAnchor.getBoundingClientRect();
    pickerInput.style.position = "fixed";
    pickerInput.style.left = `${rect.left}px`;
    pickerInput.style.top = `${rect.top}px`;
    pickerInput.style.width = `${rect.width}px`;
    pickerInput.style.height = `${rect.height}px`;
    pickerInput.style.pointerEvents = "none";
    pickerInput.style.opacity = "0";
  };

  const positionPickerInput = (target) => {
    if (!pickerInput || !target) return;
    activePickerAnchor = target;
    updatePickerInputPosition();
  };

  const refreshPickerPosition = () => {
    if (!activePickerAnchor) return;
    updatePickerInputPosition();
  };

  window.addEventListener("resize", refreshPickerPosition);
  window.addEventListener("scroll", refreshPickerPosition, { passive: true });

  pickerInput.setAttribute("tabindex", "-1");
  pickerInput.setAttribute("aria-hidden", "true");
  pickerInput.inert = true;

  const setPickerBaseColor = (overrideHex) => {
    const parsedValues = window.palettes && window.palettes.parseColorValues
      ? window.palettes.parseColorValues(colorInput.value)
      : [];
    const lastHex = parsedValues && parsedValues.length ? parsedValues[parsedValues.length - 1] : null;
    const hexToUse = normalizeHex(overrideHex || (lastHex ? `#${lastHex}` : defaultColor));
    const formatted = `#${hexToUse || normalizeHex(defaultColor)}`;
    pickerInput.value = formatted;
  };

  const getActiveHex = () => {
    const colorValueInput = document.getElementById("clr-color-value");
    const fromColorValue = colorValueInput ? normalizeHex(colorValueInput.value) : "";
    const fromPickerInput = normalizeHex(pickerInput.value);
    return pendingHex || fromColorValue || fromPickerInput || "";
  };

  const triggerPaletteRebuild = (options = {}) => {
    const form = document.getElementById("color-entry-form");
    if (form) {
      form.dispatchEvent(new CustomEvent("submit", { bubbles: true, cancelable: true, detail: options }));
    }
  };

  const normalizePickerInputValue = () => {
    const colorValueInput = document.getElementById("clr-color-value");
    if (!colorValueInput) return "";
    const normalized = normalizeHex(colorValueInput.value);
    if (!normalized) return "";
    const formatted = `#${normalized}`;
    if (colorValueInput.value !== formatted) {
      colorValueInput.value = formatted;
      colorValueInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    return formatted;
  };

  const applyCommittedHex = (hexValue) => {
    if (!hexValue || hasCommittedThisSession) return;
    const parsed = window.palettes && window.palettes.parseColorValues
      ? window.palettes.parseColorValues(colorInput.value) || []
      : [];

    if (activeContext.mode === "edit" && Number.isInteger(activeContext.index)) {
      if (!parsed.length) return;
      parsed[activeContext.index] = hexValue;
      colorInput.value = parsed.join(" ");
    } else {
      const currentValue = colorInput.value.trim();
      colorInput.value = currentValue ? `${currentValue} ${hexValue}` : hexValue;
    }

    pendingHex = "";
    colorInput.dispatchEvent(new Event("input", { bubbles: true }));
    if (activeContext.mode === "edit") {
      const focusPickerContext = Number.isInteger(activeContext.index)
        ? {
          colorIndex: activeContext.index,
          rowType: activeContext.rowType || null
        }
        : null;
      triggerPaletteRebuild({ skipScroll: true, skipFocus: true, focusPickerContext });
    }
    hasCommittedThisSession = true;
    Coloris.close();
    focusEl(lastTrigger || pickerButton);
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

  const wireCloseButton = () => {
    const closeButton = document.getElementById("clr-close");
    if (!closeButton || closeButton.dataset.hexCloseAttached) return;
    closeButton.dataset.hexCloseAttached = "true";
    closeButton.addEventListener("click", (event) => {
      event.preventDefault();
      shouldCommit = true;
      applyCommittedHex(getActiveHex());
    });
    wireHexInputEnterHandler();
  };

  const wireHexInputEnterHandler = () => {
    const colorValueInput = document.getElementById("clr-color-value");
    if (!colorValueInput) return;
    colorValueInput.setAttribute("spellcheck", "false");
    colorValueInput.setAttribute("autocomplete", "off");
    colorValueInput.setAttribute("autocapitalize", "off");
    colorValueInput.setAttribute("autocorrect", "off");
    if (colorValueInput.dataset.hexEnterAttached) return;
    colorValueInput.dataset.hexEnterAttached = "true";
    colorValueInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== "NumpadEnter") return;
      event.preventDefault();
      event.stopPropagation();
      normalizePickerInputValue();
      const closeButton = document.getElementById("clr-close");
      focusEl(closeButton || pickerButton);
    });
  };

  const openPicker = ({ target, baseHex, mode, index, rowType = null }) => {
    activeContext = {
      mode,
      index: Number.isInteger(index) ? index : null,
      rowType: rowType || null
    };
    hasCommittedThisSession = false;
    shouldCommit = false;
    lastTrigger = target || pickerButton;
    activatePickerCell(target);
    positionPickerInput(target || pickerButton);
    Coloris.setInstance("#color-picker-input", { themeMode: getThemeMode(), parent: "body" });
    setPickerBaseColor(baseHex);
    pendingHex = "";
    setTimeout(wireCloseButton, 0);
    setTimeout(focusPickerStartControl, 0);
    pickerInput.dispatchEvent(new Event("click", { bubbles: true }));
  };

  Coloris({
    el: "#color-picker-input",
    theme: "polaroid",
    themeMode: getThemeMode(),
    parent: "body",
    alpha: false,
    format: "hex",
    focusInput: false,
    selectInput: false,
    closeButton: false,
    wrap: false,
    margin: 6,
    defaultColor,
    onChange: (color) => {
      pendingHex = normalizeHex(color);
    }
  });

  pickerInput.addEventListener("close", () => {
    if (shouldCommit && !hasCommittedThisSession) {
      applyCommittedHex(pendingHex || getActiveHex());
    }
    pendingHex = "";
    shouldCommit = false;
    activePickerAnchor = null;
    clearActivePickerCell();
    focusEl(lastTrigger || pickerButton);
  });

  pickerButton.addEventListener("click", () => {
    openPicker({ target: pickerButton, baseHex: null, mode: "add", index: null });
  });

  pickerButton.addEventListener("keydown", (event) => {
    if (isActivationKey(event)) {
      event.preventDefault();
      openPicker({ target: pickerButton, baseHex: null, mode: "add", index: null });
      return;
    }
    if (event.key === "Tab" && !event.shiftKey && submitButton) {
      event.preventDefault();
      focusEl(submitButton);
    } else if (event.key === "Tab" && event.shiftKey && colorInput) {
      event.preventDefault();
      focusEl(colorInput);
    }
  });

  document.addEventListener("click", (event) => {
    const pickerCell = event.target.closest(".hex-color-picker");
    if (!pickerCell) return;
    event.preventDefault();
    const colorIndex = parseInt(pickerCell.getAttribute("data-color-index"), 10);
    const colorHex = normalizeHex(pickerCell.getAttribute("data-color-hex"));
    const rowType = pickerCell.getAttribute("data-row-type") || null;
    openPicker({
      target: pickerCell,
      baseHex: colorHex ? `#${colorHex}` : null,
      mode: "edit",
      index: colorIndex,
      rowType
    });
  });

  const paletteContainer = document.getElementById("tints-and-shades");
  if (paletteContainer) {
    paletteContainer.addEventListener("keydown", (event) => {
      if (!isActivationKey(event)) return;
      const pickerCell = event.target.closest(".hex-color-picker");
      if (!pickerCell) return;
      event.preventDefault();
      event.stopPropagation();
      const colorIndex = parseInt(pickerCell.getAttribute("data-color-index"), 10);
      const colorHex = normalizeHex(pickerCell.getAttribute("data-color-hex"));
      const rowType = pickerCell.getAttribute("data-row-type") || null;
      openPicker({
        target: pickerCell,
        baseHex: colorHex ? `#${colorHex}` : null,
        mode: "edit",
        index: colorIndex,
        rowType
      });
    }, true);
  }

  if (submitButton) {
    submitButton.addEventListener("keydown", (event) => {
      if (event.key === "Tab" && event.shiftKey) {
        event.preventDefault();
        focusEl(pickerButton);
      }
    });
  }
})();
