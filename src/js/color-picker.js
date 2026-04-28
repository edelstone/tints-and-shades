import palettes from "./palettes.js";
import Coloris from "/vendor/coloris/esm/coloris.min.js";
import { isActivationKey, normalizeHexForPicker } from "./input-utils.js";

const initColorPicker = () => {
  const colorInput = document.getElementById("color-values");
  const pickerInput = document.getElementById("color-picker-input");
  const pickerButton = document.getElementById("color-picker-button");
  const submitButton = document.getElementById("make");

  if (!colorInput || !pickerInput || !pickerButton || !palettes) return false;
  if (typeof Coloris.init === "function") {
    Coloris.init();
  }

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
  let suppressNextPalettePickerOpen = null;
  let suppressNextPickerButtonOpen = false;
  const GLOBAL_GUARD = "__tsColorPickerDocumentHandlersBound";
  const getEventTargetElement = (event) => {
    let node = event && event.target;
    while (node) {
      if (node instanceof Element) return node;
      node = node.parentNode;
    }
    return null;
  };
  const closestFromEvent = (event, selector) => {
    const target = getEventTargetElement(event);
    return target ? target.closest(selector) : null;
  };

  const clearActivePickerCell = () => {
    if (activePickerCell && activePickerCell.classList) {
      activePickerCell.classList.remove("is-picker-open");
    }
    activePickerCell = null;
  };

  const activatePickerCell = (target) => {
    clearActivePickerCell();
    if (target && target.classList && target.classList.contains("edit-base-button")) {
      activePickerCell = target;
      activePickerCell.classList.add("is-picker-open");
    }
  };

  const focusEl = (el) => {
    if (el && typeof el.focus === "function") {
      el.focus({ preventScroll: true });
    }
  };

  const suppressTooltipUntilMouseOut = (target) => {
    if (!target || !target.setAttribute) return;
    target.setAttribute("data-tooltip-suppressed", "true");
    const clear = () => {
      target.removeAttribute("data-tooltip-suppressed");
    };
    target.addEventListener("mouseleave", clear, { once: true });
    target.addEventListener("pointerleave", clear, { once: true });
  };

  const handlePickerFocusIn = (event) => {
    if (!isPickerOpen) return;
    const picker = document.getElementById("clr-picker");
    if (focusButtonOnEsc) return;
    if (picker && picker.contains(event.target)) return;
    const palettePickerButton = closestFromEvent(event, ".edit-base-button");
    if (palettePickerButton && palettePickerButton === activePickerCell) {
      suppressNextPalettePickerOpen = palettePickerButton;
    }
    pendingFocusTarget = event.target;
    Coloris.close();
  };

  const handlePickerEscape = (event) => {
    if (event.defaultPrevented) return;
    if (!isPickerOpen || event.key !== "Escape") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    focusButtonOnEsc = true;
    Coloris.close();
  };

  const getPickerCloseButton = () => document.getElementById("clr-close");

  const getPickerFocusableElements = () => {
    const picker = document.getElementById("clr-picker");
    if (!picker) return [];
    return Array.from(picker.querySelectorAll('input, button, [tabindex]:not([tabindex="-1"])')).filter((element) => {
      if (element.disabled) return false;
      if (element.getAttribute("tabindex") === "0" && element.matches("div, span, p, section")) return false;
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
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ];
    return Array.from(document.querySelectorAll(focusableSelectors.join(","))).filter((element) => {
      if (!(element instanceof HTMLElement)) return false;
      if (element.hasAttribute("disabled")) return false;
      if (element.getAttribute("tabindex") === "0" && element.matches("div, span, p, section")) return false;
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
    if (event.defaultPrevented) return;
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

  const handlePickerEnterCommit = (event) => {
    if (event.defaultPrevented) return;
    if (!isPickerOpen || event.key !== "Enter") return;
    const picker = document.getElementById("clr-picker");
    if (!picker || !picker.contains(event.target)) return;
    if (event.target.tagName === "BUTTON") return;
    if (event.target.id === "clr-color-value") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    const closeButton = getPickerCloseButton();
    if (closeButton) {
      focusEl(closeButton);
    }
  };

  const handlePalettePickerClick = (event) => {
    const palettePickerButton = closestFromEvent(event, ".edit-base-button");
    if (!palettePickerButton) return;
    event.preventDefault();
    if (suppressNextPalettePickerOpen === palettePickerButton) {
      suppressNextPalettePickerOpen = null;
      return;
    }
    if (isPickerOpen && activePickerCell === palettePickerButton) {
      focusReturnTarget = palettePickerButton;
      suppressTooltipUntilMouseOut(palettePickerButton);
      Coloris.close();
      return;
    }
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
  };

  const handlePalettePickerPointerDown = (event) => {
    const palettePickerButton = closestFromEvent(event, ".edit-base-button");
    if (!palettePickerButton) return;
    if (!isPickerOpen || activePickerCell !== palettePickerButton) return;
    suppressNextPalettePickerOpen = palettePickerButton;
    focusReturnTarget = palettePickerButton;
    suppressTooltipUntilMouseOut(palettePickerButton);
    Coloris.close();
    event.preventDefault();
    event.stopPropagation();
  };

  if (!window[GLOBAL_GUARD]) {
    document.addEventListener("focusin", handlePickerFocusIn);
    document.addEventListener("keydown", handlePickerEscape);
    document.addEventListener("keydown", handlePickerTabNavigation, true);
    document.addEventListener("keydown", handlePickerEnterCommit, true);
    document.addEventListener("pointerdown", handlePalettePickerPointerDown);
    document.addEventListener("click", handlePalettePickerClick);
    window[GLOBAL_GUARD] = true;
  }

  const normalizeHex = normalizeHexForPicker;

  const getThemeMode = () => (document.documentElement.classList.contains("darkmode-active") ? "dark" : "light");
  const WINDOW_REFRESH_HANDLER = "__tsColorPickerWindowRefreshHandler";

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

  if (window[WINDOW_REFRESH_HANDLER]) {
    window.removeEventListener("resize", window[WINDOW_REFRESH_HANDLER]);
    window.removeEventListener("scroll", window[WINDOW_REFRESH_HANDLER]);
  }
  window.addEventListener("resize", refreshPickerPosition);
  window.addEventListener("scroll", refreshPickerPosition, { passive: true });
  window[WINDOW_REFRESH_HANDLER] = refreshPickerPosition;

  pickerInput.setAttribute("tabindex", "-1");
  pickerInput.setAttribute("aria-hidden", "true");
  pickerInput.inert = true;

  const setPickerBaseColor = (overrideHex) => {
    const parsedValues = palettes && palettes.parseColorValues
      ? palettes.parseColorValues(colorInput.value)
      : [];
    const lastHex = parsedValues && parsedValues.length ? parsedValues[parsedValues.length - 1] : null;
    const hexToUse = normalizeHex(overrideHex || (lastHex ? `#${lastHex}` : defaultColor));
    const formatted = `#${hexToUse || normalizeHex(defaultColor)}`;
    pickerInput.value = formatted;
  };

  const handlePalettePickerKeydown = (event) => {
    if (event.defaultPrevented) return;
    if (!isActivationKey(event)) return;
    const pickerCell = closestFromEvent(event, ".edit-base-button");
    if (!pickerCell) return;
    event.preventDefault();
    event.stopPropagation();
    suppressNextPalettePickerOpen = null;
    if (isPickerOpen && activePickerCell === pickerCell) {
      focusReturnTarget = pickerCell;
      suppressTooltipUntilMouseOut(pickerCell);
      Coloris.close();
      return;
    }
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
    const parsed = palettes && palettes.parseColorValues
      ? palettes.parseColorValues(colorInput.value) || []
      : [];

    if (activeContext.mode === "edit" && Number.isInteger(activeContext.index)) {
      if (activeContext.index < 0 || activeContext.index >= parsed.length) return;
    }

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
      if (event.defaultPrevented) return;
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
    closeButton: false,
    wrap: false,
    margin: 6,
    defaultColor,
    onChange: (color) => {
      pendingHex = normalizeHex(color);
    }
  });

  if (!pickerInput.dataset.tsBound) {
    pickerInput.dataset.tsBound = "true";
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
  }

  if (!pickerButton.dataset.tsBound) {
    pickerButton.dataset.tsBound = "true";
    pickerButton.addEventListener("pointerdown", (event) => {
      if (!isPickerOpen || activeContext.mode !== "add") return;
      suppressNextPickerButtonOpen = true;
      focusReturnTarget = pickerButton;
      Coloris.close();
      event.preventDefault();
      event.stopPropagation();
    });
    pickerButton.addEventListener("click", () => {
      if (suppressNextPickerButtonOpen) {
        suppressNextPickerButtonOpen = false;
        return;
      }
      if (isPickerOpen && activeContext.mode === "add") {
        focusReturnTarget = pickerButton;
        Coloris.close();
        return;
      }
      openPicker({ target: pickerButton, baseHex: null, mode: "add", index: null });
    });

    pickerButton.addEventListener("keydown", (event) => {
      if (event.defaultPrevented) return;
      if (isActivationKey(event)) {
        event.preventDefault();
        if (isPickerOpen && activeContext.mode === "add") {
          focusReturnTarget = pickerButton;
          Coloris.close();
          return;
        }
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
  }


  const paletteContainer = document.getElementById("tints-and-shades");
  if (paletteContainer && !paletteContainer.dataset.tsPickerKeydownBound) {
    paletteContainer.dataset.tsPickerKeydownBound = "true";
    paletteContainer.addEventListener("keydown", handlePalettePickerKeydown, true);
  }

  if (submitButton) {
    submitButton.addEventListener("keydown", (event) => {
      if (event.defaultPrevented) return;
      if (event.key === "Tab" && event.shiftKey) {
        event.preventDefault();
        focusEl(pickerButton);
      }
    });
  }
  return true;
};

export { initColorPicker };
export default initColorPicker;
