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
  let activePickerCell = null;
  let isPickerOpen = false;
  let focusButtonOnEsc = false;
  let pendingFocusTarget = null;
  let focusReturnTarget = null;
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
    if (target && target.classList && target.classList.contains("palette-color-picker-button")) {
      activePickerCell = target;
      activePickerCell.classList.add("is-picker-open");
    }
  };

  const focusEl = (el) => {
    if (el && typeof el.focus === "function") {
      el.focus({ preventScroll: true });
    }
  };

  const handlePickerFocusIn = (event) => {
    if (!isPickerOpen) return;
    const picker = document.getElementById("clr-picker");
    if (focusButtonOnEsc) return;
    if (picker && picker.contains(event.target)) return;
    pendingFocusTarget = event.target;
    isPickerOpen = false;
    Coloris.close();
  };

  const handlePickerEscape = (event) => {
    if (!isPickerOpen || event.key !== "Escape") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    focusButtonOnEsc = true;
    Coloris.close();
  };

  const getPickerFocusableElements = () => {
    const picker = document.getElementById("clr-picker");
    if (!picker) return [];
    return Array.from(picker.querySelectorAll("input, button, [tabindex]")).filter((element) => {
      if (element.disabled) return false;
      if (typeof element.tabIndex === "number" && element.tabIndex < 0) return false;
      if (!(element instanceof HTMLElement)) return false;
      return element.offsetParent !== null || element.getClientRects().length > 0;
    });
  };

  const getDocumentFocusableElements = () => {
    const focusableSelectors = [
      'a[href]',
      'area[href]',
      'input:not([type="hidden"]):not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      'iframe',
      '[tabindex]',
      '[contenteditable="true"]'
    ];
    return Array.from(document.querySelectorAll(focusableSelectors.join(","))).filter((element) => {
      if (!(element instanceof HTMLElement)) return false;
      if (element.hasAttribute("disabled")) return false;
      if (typeof element.tabIndex === "number" && element.tabIndex < 0) return false;
      if (element.closest && element.closest("#clr-picker")) return false;
      return element.offsetParent !== null || element.getClientRects().length > 0;
    });
  };

  const getNextFocusableAfterTrigger = (direction) => {
    const reference = focusReturnTarget || pickerButton;
    const focusableElements = getDocumentFocusableElements();
    if (!focusableElements.length || !reference) return null;

    if (reference === pickerButton && direction > 0 && submitButton) {
      return submitButton;
    }

    const currentIndex = focusableElements.indexOf(reference);
    if (currentIndex === -1) {
      return direction > 0 ? focusableElements[0] : focusableElements[focusableElements.length - 1];
    }

    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= focusableElements.length) return null;
    return focusableElements[nextIndex];
  };

  const handlePickerTabNavigation = (event) => {
    if (!isPickerOpen || event.key !== "Tab") return;
    const picker = document.getElementById("clr-picker");
    if (!picker || !picker.contains(event.target)) return;

    const focusableElements = getPickerFocusableElements();
    if (!focusableElements.length) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    const shouldExitForward = !event.shiftKey && event.target === lastFocusable;
    const shouldExitBackward = event.shiftKey && event.target === firstFocusable;
    if (!shouldExitForward && !shouldExitBackward) return;

    const direction = shouldExitBackward ? -1 : 1;
    const nextElement = getNextFocusableAfterTrigger(direction);
    if (!nextElement) return;

    event.preventDefault();
    pendingFocusTarget = nextElement;
    focusReturnTarget = null;
    Coloris.close();
  };

  document.addEventListener("focusin", handlePickerFocusIn);
  document.addEventListener("keydown", handlePickerEscape);
  document.addEventListener("keydown", handlePickerTabNavigation, true);

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

  const focusPickerTextInput = () => {
    const colorValueInput = document.getElementById("clr-color-value");
    if (!colorValueInput) return;
    focusEl(colorValueInput);
    if (typeof colorValueInput.select === "function") {
      colorValueInput.select();
      return;
    }
    if (typeof colorValueInput.setSelectionRange === "function") {
      colorValueInput.setSelectionRange(0, colorValueInput.value.length);
    }
  };

  const openPicker = ({ target, baseHex, mode, index, rowType = null }) => {
    activeContext = {
      mode,
      index: Number.isInteger(index) ? index : null,
      rowType: rowType || null
    };
    hasCommittedThisSession = false;
    shouldCommit = false;
    focusButtonOnEsc = false;
    focusReturnTarget = target || null;
    activatePickerCell(target);
    positionPickerInput(target || pickerButton);
    Coloris.setInstance("#color-picker-input", { themeMode: getThemeMode(), parent: "body" });
    setPickerBaseColor(baseHex);
    pendingHex = "";
    isPickerOpen = true;
    pendingFocusTarget = null;
    setTimeout(wireCloseButton, 0);
    setTimeout(focusPickerTextInput, 0);
    pickerInput.dispatchEvent(new Event("click", { bubbles: true }));
  };

  Coloris({
    el: "#color-picker-input",
    theme: "polaroid",
    themeMode: getThemeMode(),
    parent: "body",
    alpha: false,
    format: "hex",
    focusInput: true,
    selectInput: true,
    closeButton: true,
    wrap: false,
    margin: 12,
    defaultColor,
    closeLabel: "Select",
    a11y: {
      close: "Select",
    },
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
    isPickerOpen = false;
    if (focusButtonOnEsc) {
      focusEl(focusReturnTarget || pickerButton);
      focusButtonOnEsc = false;
      focusReturnTarget = null;
      return;
    }
    if (pendingFocusTarget) {
      const target = pendingFocusTarget;
      pendingFocusTarget = null;
      setTimeout(() => focusEl(target), 0);
      focusReturnTarget = null;
      return;
    }
    if (focusReturnTarget) {
      focusEl(focusReturnTarget);
      focusReturnTarget = null;
    }
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
    const palettePickerButton = event.target.closest(".palette-color-picker-button");
    if (!palettePickerButton) return;
    event.preventDefault();
    const colorIndex = parseInt(palettePickerButton.getAttribute("data-color-index"), 10);
    const colorHex = normalizeHex(palettePickerButton.getAttribute("data-color-hex"));
    const rowType = palettePickerButton.getAttribute("data-row-type") || null;
    openPicker({
      target: palettePickerButton,
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
      const pickerCell = event.target.closest(".palette-color-picker-button");
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
