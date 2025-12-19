(() => {
  let warningTimeout = null;
  const closingPaletteStates = new WeakMap();
  const EMPTY_STATE_SCROLL_DURATION = 500;

  const VALID_TINT_SHADE_COUNTS = [5, 10, 20];
  const DEFAULT_TINT_SHADE_COUNT = 10;
  const ACTIVATION_KEYS = new Set(["enter", "return", "numpadenter", " ", "space", "spacebar"]);
  const ACTIVATION_KEY_CODES = new Set([13, 32]);
  const isActivationKey = (value) => {
    if (typeof value === "string") {
      return ACTIVATION_KEYS.has(value.toLowerCase());
    }

    if (typeof value === "number") {
      return ACTIVATION_KEY_CODES.has(value);
    }

    if (!value || typeof value !== "object") return false;

    return (
      isActivationKey(value.key) ||
      isActivationKey(value.code) ||
      isActivationKey(value.keyCode) ||
      isActivationKey(value.which)
    );
  };
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
  const HASH_PARAM_KEYS = {
    colors: "colors",
    hashtag: "hashtag",
    steps: "steps"
  };

  const getIconMarkup = (templateId) => {
    const template = document.getElementById(templateId);
    if (!template) return "";
    return (template.innerHTML || "").trim();
  };

  const normalizeTintShadeCount = (value) => {
    const parsed = parseInt(value, 10);
    if (VALID_TINT_SHADE_COUNTS.includes(parsed)) return parsed;
    return DEFAULT_TINT_SHADE_COUNT;
  };

  const parseHashHashtagParam = (value) => {
    if (typeof value !== "string") return null;
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
    return null;
  };

  const parseHashTintShadeParam = (value) => {
    if (typeof value !== "string" || value.trim() === "") return null;
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return null;
    return normalizeTintShadeCount(parsed);
  };

  const readHashState = () => {
    const rawHash = window.location.hash.slice(1);
    if (!rawHash) return {};

    if (!rawHash.includes("=")) {
      const colors = rawHash.replace(/[,+.]/g, " ").replace(/#/g, "").trim();
      return colors ? { colors } : {};
    }

    const params = new URLSearchParams(rawHash);
    const colorsParam = params.get(HASH_PARAM_KEYS.colors);
    const hashtagParam = parseHashHashtagParam(params.get(HASH_PARAM_KEYS.hashtag));
    const tintShadeParam = parseHashTintShadeParam(params.get(HASH_PARAM_KEYS.steps));
    const state = {};

    if (colorsParam) {
      const cleanedColors = colorsParam.replace(/[,+.]/g, " ").replace(/#/g, "").trim();
      if (cleanedColors) state.colors = cleanedColors;
    }

    if (typeof hashtagParam === "boolean") {
      state.copyWithHashtag = hashtagParam;
    }

    if (typeof tintShadeParam === "number") {
      state.tintShadeCount = tintShadeParam;
    }

    return state;
  };

  const buildHashString = (colorsArray, copyWithHashtag, tintShadeCount) => {
    if (!colorsArray || !colorsArray.length) return "";

    const parts = [`${HASH_PARAM_KEYS.colors}=${colorsArray.join(",")}`];

    if (typeof copyWithHashtag === "boolean") {
      parts.push(`${HASH_PARAM_KEYS.hashtag}=${copyWithHashtag ? "1" : "0"}`);
    }

    const normalizedSteps = normalizeTintShadeCount(tintShadeCount);
    if (Number.isFinite(normalizedSteps)) {
      parts.push(`${HASH_PARAM_KEYS.steps}=${normalizedSteps}`);
    }

    return parts.join("&");
  };

  const updateHashState = (colorsArray, settings = {}) => {
    const hashString = buildHashString(colorsArray, settings.copyWithHashtag, settings.tintShadeCount);
    if (!hashString) {
      if (window.history && typeof window.history.replaceState === "function") {
        const baseUrl = `${window.location.pathname}${window.location.search}`;
        window.history.replaceState(null, "", baseUrl);
      } else if (window.location.hash) {
        window.location.hash = "";
      }
      return;
    }
    window.location.hash = hashString;
  };

  const TOOLTIP_CLEARANCE = 40;

  const enableComplementTooltip = (toggleButton) => {
    if (!toggleButton) return;
    const stored = toggleButton.dataset.complementTooltip;
    if (stored) {
      toggleButton.setAttribute("data-tooltip", stored);
      delete toggleButton.dataset.complementTooltip;
    }
  };

  const disableComplementTooltip = (toggleButton) => {
    if (!toggleButton) return;
    const tooltipValue = toggleButton.getAttribute("data-tooltip");
    if (tooltipValue) {
      toggleButton.dataset.complementTooltip = tooltipValue;
      toggleButton.removeAttribute("data-tooltip");
    }
  };

  const restoreComplementTooltip = (toggleButton) => {
    if (!toggleButton) return;
    if (!toggleButton.dataset.complementTooltip) return;

    const shouldDelay = typeof toggleButton.matches === "function" && toggleButton.matches(":hover");
    if (shouldDelay) {
      const handlePointerLeave = () => {
        enableComplementTooltip(toggleButton);
      };
      toggleButton.addEventListener("pointerleave", handlePointerLeave, { once: true });
      return;
    }

    enableComplementTooltip(toggleButton);
  };

  const closeComplementDropdowns = (exceptionDropdown = null) => {
    const openDropdowns = document.querySelectorAll(".palette-complement-dropdown.is-open");
    openDropdowns.forEach((dropdown) => {
      if (exceptionDropdown && dropdown === exceptionDropdown) return;
      dropdown.classList.remove("is-open");
      const toggleButton = dropdown.querySelector(".palette-complement-dropdown-toggle");
      if (toggleButton) {
        toggleButton.setAttribute("aria-expanded", "false");
        restoreComplementTooltip(toggleButton);
      }
      const menu = dropdown.querySelector(".palette-complement-dropdown-menu");
      if (menu) {
        menu.setAttribute("aria-hidden", "true");
      }
    });
  };

  const focusDropdownMenuItem = (items, index) => {
    const target = items[index];
    if (target && typeof target.focus === "function") {
      target.focus();
    }
  };

  const handleDropdownMenuKeydown = (event) => {
    if (event.defaultPrevented) return;
    const menu = event.currentTarget;
    if (!menu) return;
    const dropdown = menu.closest && menu.closest(".palette-complement-dropdown");
    if (!dropdown || !dropdown.classList.contains("is-open")) return;

    const menuItems = Array.from(menu.querySelectorAll(".palette-complement-dropdown-item"));
    if (!menuItems.length) return;

    const currentIndex = menuItems.indexOf(event.target);
    const moveFocus = (direction) => {
      if (currentIndex === -1) {
        focusDropdownMenuItem(menuItems, direction > 0 ? 0 : menuItems.length - 1);
        return;
      }
      const nextIndex = (currentIndex + direction + menuItems.length) % menuItems.length;
      focusDropdownMenuItem(menuItems, nextIndex);
    };

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      moveFocus(1);
      return;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      moveFocus(-1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusDropdownMenuItem(menuItems, 0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      focusDropdownMenuItem(menuItems, menuItems.length - 1);
      return;
    }

    if (event.key === "Escape" || event.key === "Esc") {
      event.preventDefault();
      closeComplementDropdowns();
      const toggleButton = dropdown.querySelector(".palette-complement-dropdown-toggle");
      if (toggleButton && typeof toggleButton.focus === "function") {
        toggleButton.focus();
      }
    }
  };

  const handleDropdownToggleKeydown = (event) => {
    if (event.defaultPrevented) return;
    if (!event) return;
    const toggleButton = closestFromEvent(event, ".palette-complement-dropdown-toggle");
    if (!toggleButton) return;
    const dropdown = toggleButton.closest && toggleButton.closest(".palette-complement-dropdown");
    if (!dropdown || !dropdown.classList.contains("is-open")) return;
    const menu = dropdown.querySelector && dropdown.querySelector(".palette-complement-dropdown-menu");
    if (!menu) return;
    const menuItems = Array.from(menu.querySelectorAll(".palette-complement-dropdown-item"));
    if (!menuItems.length) return;

    const focusFirstItem = () => focusDropdownMenuItem(menuItems, 0);
    const focusLastItem = () => focusDropdownMenuItem(menuItems, menuItems.length - 1);

    if (event.key === "ArrowDown" || event.key === "ArrowRight" || event.key === "Home") {
      event.preventDefault();
      focusFirstItem();
      return;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowLeft" || event.key === "End") {
      event.preventDefault();
      focusLastItem();
      return;
    }
  };

  const wireDropdownMenuKeyboard = (menu) => {
    if (!menu) return;
    if (menu.dataset.keyboardWired === "true") return;
    menu.addEventListener("keydown", handleDropdownMenuKeydown);
    menu.dataset.keyboardWired = "true";
  };

  const toggleComplementDropdownMenu = (toggleButton) => {
    if (!toggleButton) return;
    const dropdown = toggleButton.closest(".palette-complement-dropdown");
    if (!dropdown) return;
    const menu = dropdown.querySelector(".palette-complement-dropdown-menu");
    const isOpen = dropdown.classList.contains("is-open");
    if (isOpen) {
      dropdown.classList.remove("is-open");
      toggleButton.setAttribute("aria-expanded", "false");
      if (menu) menu.setAttribute("aria-hidden", "true");
      restoreComplementTooltip(toggleButton);
      return;
    }
    closeComplementDropdowns(dropdown);
    dropdown.classList.add("is-open");
    toggleButton.setAttribute("aria-expanded", "true");
    if (menu) menu.setAttribute("aria-hidden", "false");
    disableComplementTooltip(toggleButton);
    if (menu) {
      wireDropdownMenuKeyboard(menu);
    }
  };

  const handleDocumentClickForComplementDropdowns = (event) => {
    if (!event) return;
    const target = getEventTargetElement(event);
    if (!target) return;
    if (target.closest(".palette-complement-dropdown")) return;
    closeComplementDropdowns();
  };

  const handleDocumentKeydownForComplementDropdowns = (event) => {
    if (!event || event.defaultPrevented) return;
    if (event.key === "Escape" || event.key === "Esc") {
      closeComplementDropdowns();
    }
  };

  const handleDocumentFocusInForComplementDropdowns = (event) => {
    if (!event || !event.target) return;
    const openDropdown = document.querySelector(".palette-complement-dropdown.is-open");
    if (!openDropdown) return;
    if (openDropdown.contains(event.target)) return;
    closeComplementDropdowns();
  };

  const ensureComplementDropdownListeners = () => {
    const handlerStore = window.__tsPalettesHandlers || (window.__tsPalettesHandlers = {});
    if (handlerStore.bound === true) {
      document.removeEventListener("click", handlerStore.complementClick);
      document.removeEventListener("keydown", handlerStore.complementKeydown);
      document.removeEventListener("focusin", handlerStore.complementFocusIn);
    }
    const next = {
      complementClick: handleDocumentClickForComplementDropdowns,
      complementKeydown: handleDocumentKeydownForComplementDropdowns,
      complementFocusIn: handleDocumentFocusInForComplementDropdowns
    };
    document.addEventListener("click", next.complementClick);
    document.addEventListener("keydown", next.complementKeydown);
    document.addEventListener("focusin", next.complementFocusIn);
    Object.assign(handlerStore, next, { bound: true });
  };

  const handleHexCellKeydown = (event) => {
    if (event.defaultPrevented) return;
    const target = getEventTargetElement(event);
    if (!target || !target.classList || !target.classList.contains("hex-color")) return;
    if (!isActivationKey(event)) return;
    event.preventDefault();
    target.click();
  };

  const handlePaletteTableClick = (event) => {
    const target = getEventTargetElement(event);
    if (!target) return;
    const container = event.currentTarget;
    if (!container || !container.__tsPaletteHandlers) return;
    const handlerStore = container.__tsPaletteHandlers;
    const dropdownToggle = target.closest && target.closest(".palette-complement-dropdown-toggle");
    if (dropdownToggle) {
      toggleComplementDropdownMenu(dropdownToggle);
      return;
    }

    const dropdownItem = target.closest && target.closest(".palette-complement-dropdown-item");
    if (dropdownItem) {
      const paletteIndex = parseInt(dropdownItem.getAttribute("data-palette-index"), 10);
      if (!Number.isNaN(paletteIndex)) {
        const action = dropdownItem.getAttribute("data-dropdown-action");
        if (action === "split-complementary") {
          handlerStore.toggleSplitComplementaryPalette(paletteIndex);
        } else if (action === "analogous") {
          handlerStore.toggleAnalogousPalette(paletteIndex);
        } else if (action === "triadic") {
          handlerStore.toggleTriadicPalette(paletteIndex);
        } else {
          handlerStore.toggleComplementPalette(paletteIndex);
        }
      }
      closeComplementDropdowns();
      return;
    }

    const duplicateTrigger = target.closest && target.closest(".palette-duplicate-button");
    if (duplicateTrigger) {
      const paletteIndex = parseInt(duplicateTrigger.getAttribute("data-palette-index"), 10);
      if (!Number.isNaN(paletteIndex)) {
        handlerStore.duplicatePaletteAtIndex(paletteIndex);
      }
      return;
    }

    const button = target.closest && target.closest(".palette-close-button");
    if (!button) return;

    const paletteIndex = parseInt(button.getAttribute("data-palette-index"), 10);
    if (Number.isNaN(paletteIndex)) return;

    const paletteWrapper = button.closest(".palette-wrapper");
    handlerStore.requestPaletteRemoval(paletteIndex, paletteWrapper);
  };

  const formatPercentLabel = (value) => {
    const trimmed = value % 1 === 0 ? value.toString() : value.toFixed(1);
    return `${trimmed.replace(/\.0+$/, "")}%`;
  };

  const buildTableHeader = (steps) => {
    const safeSteps = Math.max(1, steps);
    const headers = Array.from({ length: safeSteps }, (_, index) => {
      if (index === 0) return "<td><span>Base</span></td>";
      const percent = (index / safeSteps) * 100;
      return `<td><span>${formatPercentLabel(percent)}</span></td>`;
    });
    return `<tr class="table-header">${headers.join("")}</tr>`;
  };

  const updateHexValueDisplay = (copyWithHashtag) => {
    const hexCells = document.querySelectorAll(".hex-value");
    hexCells.forEach((cell) => {
      const codeElement = cell.querySelector("code");
      const targetElement = codeElement || cell;
      const raw = (targetElement.textContent || "").trim().replace(/^#/, "");
      const value = copyWithHashtag ? `#${raw}` : raw;
      if (codeElement) {
        codeElement.textContent = value;
      } else {
        cell.textContent = value;
      }
    });
  };

  const getColorCellMarkup = (hexValue, prefix, baseClassName, rowTypeAttribute) => {
    const copyIcon = getIconMarkup("icon-copy-template");
    const checkIcon = getIconMarkup("icon-check-template");
    const ariaLabel = `Copy ${prefix}${hexValue.toUpperCase()}`;
    return `<td tabindex="0" role="button" aria-label="${ariaLabel}" class="hex-color${baseClassName}" style="background-color:#${hexValue}" data-clipboard-text="${prefix}${hexValue}"${rowTypeAttribute}>
      <span class="copy-indicator copy-indicator-copy" aria-hidden="true">${copyIcon}</span>
      <span class="copy-indicator copy-indicator-check" aria-hidden="true">${checkIcon}</span>
    </td>`;
  };

  const makeTableRowColors = (colors, displayType, colorPrefix, options = {}) => colors.map((colorItem, index) => {
    const baseClassName = index === 0 ? " hex-color--base" : "";
    const hexValue = typeof colorItem === "string" ? colorItem : colorItem.hex;
    const prefix = colorPrefix || "";
    const rowTypeAttribute = options.rowType ? ` data-row-type="${options.rowType}"` : "";
    if (displayType === "colors") {
      return getColorCellMarkup(hexValue, prefix, baseClassName, rowTypeAttribute);
    }
    return `<td class="hex-value"><code>${prefix}${hexValue.toUpperCase()}</code></td>`;
  }).join("");

  const prefersReducedMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const smoothScrollTo = (element, duration, offset = 0) => {
    if (prefersReducedMotion()) {
      const targetPosition = element.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo(0, targetPosition);
      return;
    }
    const targetPosition = element.getBoundingClientRect().top + window.scrollY + offset;
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    let startTime = null;

    const ease = (t, b, c, d) => {
      t /= d / 2;
      if (t < 1) return c / 2 * t * t + b;
      t--;
      return -c / 2 * (t * (t - 2) - 1) + b;
    };

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = ease(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    };

    requestAnimationFrame(animation);
  };

  const smoothScrollToPosition = (targetPosition, duration = 500) => {
    const safeTarget = Math.max(0, Math.floor(targetPosition));
    const startPosition = window.scrollY;
    const distance = safeTarget - startPosition;
    if (!distance) {
      window.scrollTo(0, safeTarget);
      return;
    }
    if (prefersReducedMotion()) {
      window.scrollTo(0, safeTarget);
      return;
    }

    let startTime = null;
    const ease = (t, b, c, d) => {
      t /= d / 2;
      if (t < 1) return c / 2 * t * t + b;
      t--;
      return -c / 2 * (t * (t - 2) - 1) + b;
    };

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = ease(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    };

    requestAnimationFrame(animation);
  };

  const HEX_RE = /\b(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/g;

  const parseColorValues = (colorValues) => {
    const matches = colorValues.match(HEX_RE);
    if (!matches) return null;

    return matches.map((item) =>
      item.length === 3
        ? item.split("").map(ch => ch + ch).join("")
        : item
    );
  };

  const buildPaletteData = (colors, tintShadeCount) => {
    const stepsPerSide = normalizeTintShadeCount(tintShadeCount);
    const usedNames = new Set();
    return colors.map((color, index) => {
      const baseHex = color.toLowerCase();
      const shades = colorUtils.calculateShades(color, stepsPerSide)
        .map((entry) => ({ hex: entry.hex.toLowerCase(), percent: entry.percent }))
        .filter(item => item.hex !== baseHex && item.hex !== "000000");
      const tints = colorUtils.calculateTints(color, stepsPerSide)
        .map((entry) => ({ hex: entry.hex.toLowerCase(), percent: entry.percent }))
        .filter(item => item.hex !== baseHex && item.hex !== "ffffff");

      const fallbackName = `color-${index + 1}`;
      const friendlyName = exportNaming.getFriendlyName(baseHex, fallbackName);
      const uniqueId = exportNaming.makeUniqueName(friendlyName.slug, usedNames);
      const label = friendlyName.label || fallbackName;

      return { id: uniqueId, label, base: baseHex, shades, tints, stepsPerSide };
    });
  };

  const createTintsAndShades = (settings, firstTime = false, options = {}) => {
    const {
      skipScroll = false,
      skipFocus = false,
      focusPickerContext = null,
      enteringPaletteIndex = null,
      enteringPaletteIndexes = [],
      enteringFocusContext = null,
      ensurePaletteInView = null,
      ensurePaletteSkipDownwardScroll = false,
      ensurePaletteRangeStart = null,
      ensurePaletteRangeEnd = null
    } = options;

    const enteringIndexes = (() => {
      const candidates = [];
      if (Array.isArray(enteringPaletteIndexes)) {
        enteringPaletteIndexes.forEach((value) => {
          if (Number.isInteger(value)) candidates.push(value);
        });
      }
      if (Number.isInteger(enteringPaletteIndex)) {
        candidates.push(enteringPaletteIndex);
      }
      const uniqueIndexes = Array.from(new Set(candidates));
      return uniqueIndexes.sort((a, b) => a - b);
    })();

    const colorInput = document.getElementById("color-values");
    const enteringIndexesSet = new Set(enteringIndexes);
    const tableContainer = document.getElementById("tints-and-shades");
    const warning = document.getElementById("warning");
    ensureComplementDropdownListeners();

    const focusPickerCell = (context) => {
      if (!tableContainer || !context) return false;
      const { colorIndex, rowType } = context;
      if (!Number.isInteger(colorIndex)) return false;
      const rowAttribute = rowType ? `[data-row-type="${rowType}"]` : "";
      const selectors = [
        `.palette-color-picker-button[data-color-index="${colorIndex}"]${rowAttribute}`,
        `.hex-color-picker[data-color-index="${colorIndex}"]${rowAttribute}`
      ];
      const focusTarget = tableContainer.querySelector(selectors.join(","));
      if (focusTarget && typeof focusTarget.focus === "function") {
        try {
          focusTarget.focus({ preventScroll: true });
        } catch (error) {
          focusTarget.focus();
        }
        return true;
      }
      return false;
    };

    const animatePaletteElement = (target, focusContext = null, { skipScroll = false } = {}) => {
      if (!target || prefersReducedMotion()) return;

      const computedStyle = window.getComputedStyle(target);
      const initialRect = target.getBoundingClientRect();
      const finalHeight = initialRect.height;
      if (!finalHeight) {
        target.style.opacity = "1";
        target.style.height = "";
        target.style.marginBottom = "";
        target.style.paddingTop = "";
        target.style.paddingBottom = "";
        target.style.overflow = "";
        return;
      }

      const finalMarginBottom = computedStyle.marginBottom;
      const finalPaddingTop = computedStyle.paddingTop;
      const finalPaddingBottom = computedStyle.paddingBottom;

      target.style.height = "0px";
      target.style.marginBottom = "0px";
      target.style.paddingTop = "0px";
      target.style.paddingBottom = "0px";
      target.style.opacity = "0";
      target.style.visibility = "hidden";
      target.style.overflow = "hidden";

      const viewportHeight = window.innerHeight;
      const viewportBottom = window.scrollY + viewportHeight;
      const finalBottomAbsolute = initialRect.top + window.scrollY + finalHeight;
      if (!skipScroll && finalBottomAbsolute > viewportBottom) {
        const scrollMargin = 16;
        const desiredScrollTop = Math.max(0, finalBottomAbsolute - viewportHeight + scrollMargin);
        if (desiredScrollTop > window.scrollY) {
          smoothScrollToPosition(desiredScrollTop, 500);
        }
      }

      target.getBoundingClientRect(); // flush layout before expanding

      requestAnimationFrame(() => {
        target.style.height = `${finalHeight}px`;
        target.style.marginBottom = finalMarginBottom;
        target.style.paddingTop = finalPaddingTop;
        target.style.paddingBottom = finalPaddingBottom;
      });

      let layoutTransitionDone = false;
      let handleTransitionEnd;
      let fallbackTimeout;
      const cleanup = () => {
        target.style.height = "";
        target.style.marginBottom = "";
        target.style.paddingTop = "";
        target.style.paddingBottom = "";
        target.style.overflow = "";
        target.style.opacity = "";
        target.style.visibility = "";
        target.removeAttribute("data-entering");
        target.removeEventListener("transitionend", handleTransitionEnd);
        clearTimeout(fallbackTimeout);
      };

      handleTransitionEnd = (event) => {
        if (event.target !== target) return;

        if (!layoutTransitionDone && event.propertyName === "height") {
          layoutTransitionDone = true;
          requestAnimationFrame(() => {
            target.style.visibility = "visible";
            target.style.opacity = "1";
            if (focusContext) {
              focusPickerCell(focusContext);
            }
          });
          return;
        }

        if (layoutTransitionDone && event.propertyName === "opacity") {
          cleanup();
        }
      };

      fallbackTimeout = setTimeout(() => {
        if (!layoutTransitionDone) {
          layoutTransitionDone = true;
          target.style.visibility = "visible";
          target.style.opacity = "1";
          if (focusContext) {
            focusPickerCell(focusContext);
          }
          return;
        }
        cleanup();
      }, 480);

      target.addEventListener("transitionend", handleTransitionEnd);
    };

    const animatePaletteEntry = (paletteIndex, focusContext = null, { skipScroll = false } = {}) => {
      if (!tableContainer || !Number.isInteger(paletteIndex)) return;
      const wrappers = Array.from(tableContainer.querySelectorAll(".palette-wrapper"));
      const target = wrappers[paletteIndex];
      if (!target) return;
      animatePaletteElement(target, focusContext, { skipScroll });
    };

    const waitForPaletteEntryAnimations = (callback) => {
      if (!tableContainer || typeof callback !== "function") return;
      const hasEnteringPalette = () => tableContainer.querySelector(".palette-wrapper[data-entering=\"true\"]");
      const checkAnimation = () => {
        if (!hasEnteringPalette()) {
          callback();
          return;
        }
        requestAnimationFrame(checkAnimation);
      };
      if (!hasEnteringPalette()) {
        callback();
        return;
      }
      requestAnimationFrame(checkAnimation);
    };

    const normalizeHexValue = (colorValue) => {
      if (typeof colorValue !== "string") return null;
      const normalized = colorValue.replace(/^#/, "").trim().toLowerCase();
      if (/^[0-9a-f]{6}$/.test(normalized)) return normalized;
      return null;
    };

    const moduloHue = (value) => ((value % 360) + 360) % 360;

    const insertRelatedPalettes = (paletteIndex, paletteHexes = [], { ensureRangeVisible = false } = {}) => {
      if (!colorInput) return false;
      const currentColors = parseColorValues(colorInput.value) || [];
      if (!Number.isInteger(paletteIndex) || paletteIndex < 0 || paletteIndex >= currentColors.length) return false;

      const normalizedHexes = paletteHexes
        .map((value) => normalizeHexValue(value))
        .filter(Boolean);

      if (!normalizedHexes.length) return false;

      const updatedColors = currentColors.slice();
      const insertionIndex = paletteIndex + 1;
      updatedColors.splice(insertionIndex, 0, ...normalizedHexes);
      colorInput.value = updatedColors.join(" ");

      const options = {
        skipScroll: true,
        skipFocus: true,
        enteringPaletteIndex: insertionIndex,
        enteringPaletteIndexes: normalizedHexes.map((_, idx) => insertionIndex + idx),
        enteringFocusContext: { colorIndex: insertionIndex, rowType: "base" }
      };

      if (ensureRangeVisible && normalizedHexes.length) {
        const lastInsertionIndex = insertionIndex + normalizedHexes.length - 1;
        options.ensurePaletteRangeStart = insertionIndex;
        options.ensurePaletteRangeEnd = lastInsertionIndex;
      }

      createTintsAndShades(settings, false, options);
      return true;
    };

    const calculateSplitComplementaryHexes = (colorValue) => {
      const normalized = normalizeHexValue(colorValue);
      if (!normalized) return [];
      const rgb = colorUtils.hexToRGB(normalized);
      const hsl = colorUtils.rgbToHsl(rgb);
      const offsets = [180 - 30, 180 + 30];
      return offsets.map((offset) => {
        const hue = moduloHue(hsl.hue + offset);
        const complementaryRgb = colorUtils.hslToRgb({
          hue,
          saturation: hsl.saturation,
          lightness: hsl.lightness
        });
        return colorUtils.rgbToHex(complementaryRgb);
      });
    };

    const calculateAnalogousHexes = (colorValue) => {
      const normalized = normalizeHexValue(colorValue);
      if (!normalized) return [];
      const rgb = colorUtils.hexToRGB(normalized);
      const hsl = colorUtils.rgbToHsl(rgb);
      const offsets = [-30, 30];
      return offsets.map((offset) => {
        const hue = moduloHue(hsl.hue + offset);
        const analogousRgb = colorUtils.hslToRgb({
          hue,
          saturation: hsl.saturation,
          lightness: hsl.lightness
        });
        return colorUtils.rgbToHex(analogousRgb);
      });
    };

    const calculateTriadicHexes = (colorValue) => {
      const normalized = normalizeHexValue(colorValue);
      if (!normalized) return [];
      const rgb = colorUtils.hexToRGB(normalized);
      const hsl = colorUtils.rgbToHsl(rgb);
      const offsets = [120, 240];
      return offsets.map((offset) => {
        const hue = moduloHue(hsl.hue + offset);
        const triadicRgb = colorUtils.hslToRgb({
          hue,
          saturation: hsl.saturation,
          lightness: hsl.lightness
        });
        return colorUtils.rgbToHex(triadicRgb);
      });
    };

    const toggleComplementPalette = (paletteIndex) => {
      if (!colorInput) return;
      const currentColors = parseColorValues(colorInput.value) || [];
      if (!Number.isInteger(paletteIndex) || paletteIndex < 0 || paletteIndex >= currentColors.length) return;
      const baseColor = currentColors[paletteIndex];
      if (!baseColor) return;
      const complementHex = colorUtils.calculateComplementaryHex(baseColor);
      if (!complementHex) return;
      insertRelatedPalettes(paletteIndex, [complementHex]);
    };

    const toggleSplitComplementaryPalette = (paletteIndex) => {
      if (!colorInput) return;
      const currentColors = parseColorValues(colorInput.value) || [];
      if (!Number.isInteger(paletteIndex) || paletteIndex < 0 || paletteIndex >= currentColors.length) return;

      const baseColor = currentColors[paletteIndex];
      if (!baseColor) return;

      const splitHexes = calculateSplitComplementaryHexes(baseColor);
      if (!splitHexes.length) return;

      insertRelatedPalettes(paletteIndex, splitHexes, { ensureRangeVisible: true });
    };

    const toggleAnalogousPalette = (paletteIndex) => {
      if (!colorInput) return;
      const currentColors = parseColorValues(colorInput.value) || [];
      if (!Number.isInteger(paletteIndex) || paletteIndex < 0 || paletteIndex >= currentColors.length) return;

      const baseColor = currentColors[paletteIndex];
      if (!baseColor) return;

      const analogousHexes = calculateAnalogousHexes(baseColor);
      if (!analogousHexes.length) return;

      insertRelatedPalettes(paletteIndex, analogousHexes, { ensureRangeVisible: true });
    };

    const toggleTriadicPalette = (paletteIndex) => {
      if (!colorInput) return;
      const currentColors = parseColorValues(colorInput.value) || [];
      if (!Number.isInteger(paletteIndex) || paletteIndex < 0 || paletteIndex >= currentColors.length) return;

      const baseColor = currentColors[paletteIndex];
      if (!baseColor) return;

      const triadicHexes = calculateTriadicHexes(baseColor);
      if (!triadicHexes.length) return;

      insertRelatedPalettes(paletteIndex, triadicHexes, { ensureRangeVisible: true });
    };

    const ensurePaletteVisible = (paletteIndex, skipDownwardScroll = false) => {
      if (!tableContainer || !Number.isInteger(paletteIndex)) return;
      const wrappers = Array.from(tableContainer.querySelectorAll(".palette-wrapper"));
      const target = wrappers[paletteIndex];
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const absoluteTop = rect.top + window.scrollY;
      const absoluteBottom = absoluteTop + rect.height;
      const scrollMargin = 16;
      const safeScrollMargin = Math.max(scrollMargin, TOOLTIP_CLEARANCE);
      const viewportTop = window.scrollY;
      const viewportBottom = viewportTop + window.innerHeight;
      let targetScroll = null;

      if (absoluteTop < viewportTop + scrollMargin) {
        targetScroll = absoluteTop - safeScrollMargin;
      } else if (absoluteBottom > viewportBottom - scrollMargin) {
        targetScroll = absoluteBottom - window.innerHeight + scrollMargin;
      }

      if (targetScroll !== null) {
        if (skipDownwardScroll && targetScroll > window.scrollY) {
          return;
        }
        smoothScrollToPosition(targetScroll, 400);
      }
    };

    const ensurePaletteRangeVisible = (startIndex, endIndex) => {
      if (!tableContainer || !Number.isInteger(startIndex) || !Number.isInteger(endIndex)) return;
      const wrappers = Array.from(tableContainer.querySelectorAll(".palette-wrapper"));
      if (!wrappers.length) return;
      const rangeStart = Math.min(startIndex, endIndex);
      const rangeEnd = Math.max(startIndex, endIndex);
      const first = wrappers[rangeStart];
      const last = wrappers[rangeEnd];
      if (!first || !last) return;
      const scrollMargin = 16;
      const safeScrollMargin = Math.max(scrollMargin, TOOLTIP_CLEARANCE);
      const viewportTop = window.scrollY + scrollMargin;
      const viewportBottom = window.scrollY + window.innerHeight - scrollMargin;
      const rangeTop = first.getBoundingClientRect().top + window.scrollY;
      const rangeBottom = last.getBoundingClientRect().bottom + window.scrollY;
      const availableHeight = window.innerHeight - scrollMargin * 2;
      let targetScroll = null;

      if (rangeBottom - rangeTop <= availableHeight) {
        targetScroll = rangeTop - safeScrollMargin;
      } else if (rangeBottom > viewportBottom) {
        targetScroll = rangeBottom - window.innerHeight + scrollMargin;
      } else if (rangeTop < viewportTop) {
        targetScroll = rangeTop - safeScrollMargin;
      }

      if (targetScroll !== null && targetScroll !== window.scrollY) {
        smoothScrollToPosition(targetScroll, 400);
      }
    };

    const applyNoPalettesState = () => {
      if (tableContainer) {
        tableContainer.innerHTML = "";
        tableContainer.removeAttribute("tabindex");
      }

      updateHashState([], settings);
      exportUI.state.palettes = [];
      exportUI.toggleExportWrapperVisibility(false, exportUI.elements);

      if (warning) {
        warning.classList.remove("visible");
      }
      if (warningTimeout) {
        clearTimeout(warningTimeout);
        warningTimeout = null;
      }

      smoothScrollToPosition(0, EMPTY_STATE_SCROLL_DURATION);
      const colorValuesInput = document.getElementById("color-values");
      if (colorValuesInput) {
        const len = colorValuesInput.value.length;
        try {
          colorValuesInput.focus({ preventScroll: true });
        } catch (error) {
          colorValuesInput.focus();
        }
        colorValuesInput.setSelectionRange(len, len);
        return;
      }

      const makeButton = document.getElementById("make");
      if (makeButton) {
        try {
          makeButton.focus({ preventScroll: true });
        } catch (error) {
          makeButton.focus();
        }
      }
    };

    const removePaletteAtIndex = (paletteIndex) => {
      const colorInputElement = document.getElementById("color-values");
      if (!colorInputElement) return;

      const currentColors = parseColorValues(colorInputElement.value) || [];
      if (!currentColors.length) return;
      if (paletteIndex < 0 || paletteIndex >= currentColors.length) return;

      currentColors.splice(paletteIndex, 1);
      colorInputElement.value = currentColors.join(" ");

      if (!currentColors.length) {
        applyNoPalettesState();
        return;
      }

      updateHashState(currentColors, settings);

      // decide which palette's close button should get focus
      const nextFocusIndex = Math.min(paletteIndex, currentColors.length - 1);
      const hasLowerPalette = paletteIndex < currentColors.length;

      if (window.palettes && typeof window.palettes.createTintsAndShades === "function") {
        window.palettes.createTintsAndShades(settings, false, {
          skipScroll: true,
          focusPickerContext: { colorIndex: nextFocusIndex, rowType: "base" },
          ensurePaletteInView: nextFocusIndex,
          ensurePaletteSkipDownwardScroll: hasLowerPalette
        });
      }
    };

    const duplicatePaletteAtIndex = (paletteIndex) => {
      const colorInputElement = document.getElementById("color-values");
      if (!colorInputElement) return;

      const currentColors = parseColorValues(colorInputElement.value) || [];
      if (!currentColors.length) return;
      if (paletteIndex < 0 || paletteIndex >= currentColors.length) return;

      const updatedColors = currentColors.slice();
      updatedColors.splice(paletteIndex + 1, 0, currentColors[paletteIndex]);
      colorInputElement.value = updatedColors.join(" ");

      if (window.palettes && typeof window.palettes.createTintsAndShades === "function") {
        window.palettes.createTintsAndShades(settings, false, {
          skipScroll: true,
          skipFocus: true,
          enteringPaletteIndex: paletteIndex + 1,
          enteringPaletteIndexes: [paletteIndex + 1],
          enteringFocusContext: { colorIndex: paletteIndex + 1, rowType: "base" }
        });
      }
    };

    const requestPaletteRemoval = (paletteIndex, paletteWrapper) => {
      const currentColors = parseColorValues(colorInput.value) || [];
      const reducedMotion = prefersReducedMotion();
      const isLastPalette = currentColors.length === 1;

      if (isLastPalette) {
        removePaletteAtIndex(paletteIndex);
        return;
      }

      if (!paletteWrapper || reducedMotion) {
        removePaletteAtIndex(paletteIndex);
        return;
      }

      const hasLowerPalette = paletteIndex + 1 < currentColors.length;
      const adjacentPaletteIndex = hasLowerPalette ? paletteIndex + 1 : paletteIndex - 1;
      if (!hasLowerPalette && Number.isInteger(adjacentPaletteIndex) && adjacentPaletteIndex >= 0) {
        ensurePaletteVisible(adjacentPaletteIndex);
      }

      if (closingPaletteStates.has(paletteWrapper)) return;

      const wrapperState = { stage: "fading" };
      closingPaletteStates.set(paletteWrapper, wrapperState);

      const cleanupStyles = () => {
        paletteWrapper.style.height = "";
        paletteWrapper.style.marginBottom = "";
        paletteWrapper.style.paddingTop = "";
        paletteWrapper.style.paddingBottom = "";
        paletteWrapper.style.overflow = "";
        paletteWrapper.classList.remove("palette-wrapper-fading", "palette-wrapper-collapsing");
      };

      const handleTransitionEnd = (event) => {
        if (event.target !== paletteWrapper) return;

        if (wrapperState.stage === "fading" && event.propertyName === "opacity") {
          wrapperState.stage = "collapsing";
          paletteWrapper.classList.add("palette-wrapper-collapsing");
          paletteWrapper.getBoundingClientRect(); // ensure styles apply before collapsing
          requestAnimationFrame(() => {
            paletteWrapper.style.height = "0px";
            paletteWrapper.style.marginBottom = "0px";
            paletteWrapper.style.paddingTop = "0px";
            paletteWrapper.style.paddingBottom = "0px";
          });
          return;
        }

        if (wrapperState.stage === "collapsing" && event.propertyName === "height") {
          paletteWrapper.removeEventListener("transitionend", handleTransitionEnd);
          closingPaletteStates.delete(paletteWrapper);
          cleanupStyles();
          removePaletteAtIndex(paletteIndex);
        }
      };

      paletteWrapper.addEventListener("transitionend", handleTransitionEnd);

      const wrapperHeight = paletteWrapper.getBoundingClientRect().height;
      paletteWrapper.style.height = `${wrapperHeight}px`;
      paletteWrapper.style.overflow = "hidden";
      paletteWrapper.getBoundingClientRect(); // force layout before animating

      requestAnimationFrame(() => {
        paletteWrapper.classList.add("palette-wrapper-fading");
      });
    };

    tableContainer.__tsPaletteHandlers = {
      toggleComplementPalette,
      toggleSplitComplementaryPalette,
      toggleAnalogousPalette,
      toggleTriadicPalette,
      duplicatePaletteAtIndex,
      requestPaletteRemoval
    };

    const parsedColorsArray = parseColorValues(colorInput.value);

    if (parsedColorsArray && parsedColorsArray.length) {
      const { state, elements, toggleExportWrapperVisibility, setExportFormat, updateExportOutput } = exportUI;
      const tintShadeCount = normalizeTintShadeCount(settings.tintShadeCount);
      const paletteMetadata = buildPaletteData(parsedColorsArray, tintShadeCount);
      const paletteTables = [];
      const colorPrefix = settings.copyWithHashtag ? "#" : "";

      parsedColorsArray.forEach((color, colorIndex) => {
        const paletteData = paletteMetadata[colorIndex] || {};
        const rawLabel = paletteData.label || paletteData.id || "Base";
        const paletteLabel = exportNaming.formatLabelForDisplay(rawLabel) || rawLabel;
        const paletteRows = [];

        const calculatedShades = colorUtils.calculateShades(color, tintShadeCount);
        paletteRows.push(`<tr>${makeTableRowColors(calculatedShades, "colors", colorPrefix, { enableBasePicker: true, colorIndex, rowType: "shades" })}</tr>`);
        paletteRows.push(`<tr>${makeTableRowColors(calculatedShades, "RGBValues", colorPrefix)}</tr>`);

        const calculatedTints = colorUtils.calculateTints(color, tintShadeCount);
        paletteRows.push(`<tr>${makeTableRowColors(calculatedTints, "colors", colorPrefix, { enableBasePicker: true, colorIndex, rowType: "tints" })}</tr>`);
        paletteRows.push(`<tr>${makeTableRowColors(calculatedTints, "RGBValues", colorPrefix)}</tr>`);

        const headerRow = buildTableHeader(tintShadeCount);
        const filterIcon = getIconMarkup("icon-color-filter-template");
        const colorPickerIcon = getIconMarkup("icon-color-picker-template");
        const plusIcon = getIconMarkup("icon-plus-template");
        const closeIcon = getIconMarkup("icon-x-template");
        const complementDropdownMarkup = `<div class="palette-complement-dropdown">
          <button type="button" class="palette-complement-dropdown-toggle palette-titlebar-action" data-tooltip="Add related colors" aria-haspopup="menu" aria-expanded="false" aria-label="Add related colors for ${paletteLabel}">${filterIcon}</button>
          <div class="palette-complement-dropdown-menu" role="menu" aria-hidden="true">
            <button type="button" class="palette-complement-dropdown-item" role="menuitem" tabindex="-1" data-palette-index="${colorIndex}" data-dropdown-action="complementary">Complementary</button>
            <button type="button" class="palette-complement-dropdown-item" role="menuitem" tabindex="-1" data-palette-index="${colorIndex}" data-dropdown-action="split-complementary">Split complementary</button>
            <button type="button" class="palette-complement-dropdown-item" role="menuitem" tabindex="-1" data-palette-index="${colorIndex}" data-dropdown-action="analogous">Analogous</button>
            <button type="button" class="palette-complement-dropdown-item" role="menuitem" tabindex="-1" data-palette-index="${colorIndex}" data-dropdown-action="triadic">Triadic</button>
          </div>
        </div>`;
        const normalizedBaseHex = color ? color.replace(/^#/, "") : "";
        const paletteColorPickerButton = `<button type="button" class="palette-color-picker-button palette-titlebar-action" data-tooltip="Edit base color" data-color-index="${colorIndex}" data-color-hex="${normalizedBaseHex}" data-row-type="base" aria-label="Adjust ${paletteLabel} base color">${colorPickerIcon}</button>`;
        const duplicateButton = `<button type="button" class="palette-duplicate-button palette-titlebar-action" data-tooltip="Duplicate" data-palette-index="${colorIndex}" aria-label="Duplicate ${paletteLabel} palette">${plusIcon}</button>`;
        const removeButton = `<button type="button" class="palette-close-button palette-titlebar-action" data-tooltip="Remove" data-palette-index="${colorIndex}" aria-label="Remove ${paletteLabel} palette">${closeIcon}</button>`;
        const paletteNameMarkup = `<div class="palette-titlebar" role="heading" aria-level="2"><span class="palette-titlebar-name">${paletteLabel}</span><div class="palette-titlebar-controls">${paletteColorPickerButton}${complementDropdownMarkup}${duplicateButton}${removeButton}</div></div>`;
        const isEntering = enteringIndexesSet.has(colorIndex);
        const enteringAttr = isEntering ? ' data-entering="true"' : "";
        const tableMarkup = `<div class="palette-wrapper" role="region" aria-label="${paletteLabel}" data-palette-index="${colorIndex}"${enteringAttr}>${paletteNameMarkup}<div class="palette-table"><table><thead>${headerRow}</thead><tbody>${paletteRows.join("")}</tbody></table></div></div>`;
        paletteTables.push(tableMarkup);
      });

      tableContainer.innerHTML = paletteTables.join("");
      closeComplementDropdowns();

      const hasRangeTarget = Number.isInteger(ensurePaletteRangeStart) && Number.isInteger(ensurePaletteRangeEnd);
      const shouldSkipEntryScrolls = hasRangeTarget;
      if (hasRangeTarget) {
        ensurePaletteRangeVisible(ensurePaletteRangeStart, ensurePaletteRangeEnd);
      }

      if (enteringIndexes.length) {
        enteringIndexes.forEach((entryIndex, index) => {
          const focusContext = index === 0 ? enteringFocusContext : null;
          animatePaletteEntry(entryIndex, focusContext, { skipScroll: shouldSkipEntryScrolls });
        });
      }

      if (!hasRangeTarget && Number.isInteger(ensurePaletteInView)) {
        ensurePaletteVisible(ensurePaletteInView, ensurePaletteSkipDownwardScroll);
      }

      if (!tableContainer.dataset.tsHexKeydownBound) {
        tableContainer.dataset.tsHexKeydownBound = "true";
        tableContainer.addEventListener("keydown", handleHexCellKeydown);
      }

      if (!tableContainer.dataset.tsPaletteClickBound) {
        tableContainer.dataset.tsPaletteClickBound = "true";
        tableContainer.addEventListener("click", handlePaletteTableClick);
      }

      if (!tableContainer.dataset.tsDropdownToggleKeydownBound) {
        tableContainer.dataset.tsDropdownToggleKeydownBound = "true";
        tableContainer.addEventListener("keydown", handleDropdownToggleKeydown);
      }

      state.palettes = paletteMetadata;
      state.tintShadeCount = tintShadeCount;
      toggleExportWrapperVisibility(true, elements);
      setExportFormat(state.format, state, elements);
      updateExportOutput(state, elements);

      updateHashState(parsedColorsArray, settings);

      if (!skipScroll) {
        const scrollElement = document.getElementById("scroll-top") || document.getElementById("tints-and-shades");
        if (scrollElement) {
          smoothScrollTo(scrollElement, 500, -TOOLTIP_CLEARANCE);
        }
      }

      setTimeout(() => {
        tableContainer.removeAttribute("tabindex");
        const pickerFocused = focusPickerContext && focusPickerCell(focusPickerContext);

        // if we have a target close button index, focus it after rebuild
        if (!pickerFocused && !skipFocus) {
          const activeStepButton = document.querySelector(".step-selector-option.is-active");
          if (activeStepButton) {
            activeStepButton.focus();
          } else {
            const makeButton = document.getElementById("make");
            if (makeButton) makeButton.focus();
          }
        }

        if (hasRangeTarget) {
          waitForPaletteEntryAnimations(() => ensurePaletteRangeVisible(ensurePaletteRangeStart, ensurePaletteRangeEnd));
        }
      });

      updateHexValueDisplay(settings.copyWithHashtag);
    } else if (!firstTime) {
      smoothScrollToPosition(0, EMPTY_STATE_SCROLL_DURATION);
      tableContainer.innerHTML = "";
      updateHashState([], settings);
      warning.classList.add("visible");

      if (warningTimeout) clearTimeout(warningTimeout);
      warningTimeout = setTimeout(() => {
        warning.classList.remove("visible");
        warningTimeout = null;
      }, 3000);

      colorInput.focus();
      exportUI.state.palettes = [];
      exportUI.toggleExportWrapperVisibility(false, exportUI.elements);
    }

    return false;
  };

  window.palettes = {
    parseColorValues,
    buildPaletteData,
    createTintsAndShades,
    makeTableRowColors,
    buildTableHeader,
    normalizeTintShadeCount,
    updateHexValueDisplay,
    readHashState,
    updateHashState
  };
})();
