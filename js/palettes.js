// palettes.js - parse input, render tints/shades (table markup helpers), sync hash, and feed export data
(() => {
  let warningTimeout = null;
  let hexCellKeyHandlerAdded = false;

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
    const parts = [];
    parts.push(`${HASH_PARAM_KEYS.colors}=${colorsArray.join(",")}`);

    if (typeof copyWithHashtag === "boolean") {
      parts.push(`${HASH_PARAM_KEYS.hashtag}=${copyWithHashtag ? "1" : "0"}`);
    }

    if (typeof tintShadeCount === "number" && !Number.isNaN(tintShadeCount)) {
      parts.push(`${HASH_PARAM_KEYS.steps}=${normalizeTintShadeCount(tintShadeCount)}`);
    }

    return parts.join("&");
  };

  const updateHashState = (colorsArray, settings = {}) => {
    const hashString = buildHashString(colorsArray, settings.copyWithHashtag, settings.tintShadeCount);
    window.location.hash = hashString;
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
    return `<thead><tr class="table-header">${headers.join("")}</tr></thead>`;
  };

  const updateHexValueDisplay = (copyWithHashtag) => {
    const hexCells = document.querySelectorAll(".hex-value");
    hexCells.forEach((cell) => {
      const raw = (cell.textContent || "").trim().replace(/^#/, "");
      cell.textContent = copyWithHashtag ? `#${raw}` : raw;
    });
  };

  const makeTableRowColors = (colors, displayType, colorPrefix, options = {}) => colors.map((colorItem, index) => {
    const enableBasePicker = options.enableBasePicker && index === 0 && typeof options.colorIndex === "number";
    const colorPickerIcon = enableBasePicker ? getIconMarkup("icon-color-picker-template") : "";
    const hexValue = typeof colorItem === "string" ? colorItem : colorItem.hex;
    const prefix = colorPrefix || "";
    if (displayType === "colors") {
      if (enableBasePicker) {
        const ariaLabel = `Adjust #${hexValue.toUpperCase()} with the color picker`;
        return `<td tabindex="0" role="button" aria-label="${ariaLabel}" class="hex-color hex-color--picker" style="background-color:#${hexValue}" data-color-index="${options.colorIndex}" data-color-hex="${hexValue}">
          <span class="copy-indicator copy-indicator--picker" aria-hidden="true">${colorPickerIcon}</span>
        </td>`;
      }
      const copyIcon = getIconMarkup("icon-copy-template");
      const checkIcon = getIconMarkup("icon-check-template");
      const ariaLabel = `Copy ${prefix}${hexValue.toUpperCase()}`;
      return `<td tabindex="0" role="button" aria-label="${ariaLabel}" class="hex-color" style="background-color:#${hexValue}" data-clipboard-text="${prefix}${hexValue}">
        <span class="copy-indicator copy-indicator--copy" aria-hidden="true">${copyIcon}</span>
        <span class="copy-indicator copy-indicator--check" aria-hidden="true">${checkIcon}</span>
      </td>`;
    }
    return `<td class="hex-value">${prefix}${hexValue.toUpperCase()}</td>`;
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

  // Parse an input string for hexadecimal color values (supports shorthand)
  const parseColorValues = (colorValues) => {
    let colorValuesArray = colorValues.match(/\b[0-9A-Fa-f]{3}\b|[0-9A-Fa-f]{6}\b/g);
    if (colorValuesArray) {
      colorValuesArray = colorValuesArray.map(item => (item.length === 3 ? item.split("").reduce((acc, it) => acc + it + it, "") : item));
    }
    return colorValuesArray;
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
      const friendlyName = exportNaming.makeUniqueName(exportNaming.getFriendlyName(baseHex, fallbackName), usedNames);

      return { id: friendlyName, base: baseHex, shades, tints, stepsPerSide };
    });
  };

  const createTintsAndShades = (settings, firstTime = false, options = {}) => {
    const { skipScroll = false, skipFocus = false } = options;
    const colorInput = document.getElementById("color-values");
    const tableContainer = document.getElementById("tints-and-shades");
    const warning = document.getElementById("warning");
    const parsedColorsArray = parseColorValues(colorInput.value);

    if (parsedColorsArray !== null && parsedColorsArray.length) {
      const { state, elements, toggleExportWrapperVisibility, setExportFormat, updateExportOutput } = exportUI;
      const colorDisplayRows = [];
      let tableRowCounter = 0;
      const colorPrefix = settings.copyWithHashtag ? "#" : "";

      const tintShadeCount = normalizeTintShadeCount(settings.tintShadeCount);

      parsedColorsArray.forEach((color, colorIndex) => {
        const calculatedShades = colorUtils.calculateShades(color, tintShadeCount);
        colorDisplayRows[tableRowCounter++] = `<tr>${makeTableRowColors(calculatedShades, "colors", colorPrefix, { enableBasePicker: true, colorIndex })}</tr>`;
        colorDisplayRows[tableRowCounter++] = `<tr>${makeTableRowColors(calculatedShades, "RGBValues", colorPrefix)}</tr>`;

        const calculatedTints = colorUtils.calculateTints(color, tintShadeCount);
        colorDisplayRows[tableRowCounter++] = `<tr>${makeTableRowColors(calculatedTints, "colors", colorPrefix, { enableBasePicker: true, colorIndex })}</tr>`;
        colorDisplayRows[tableRowCounter++] = `<tr>${makeTableRowColors(calculatedTints, "RGBValues", colorPrefix)}</tr>`;
      });

      const colorDisplayTable = `<table>${buildTableHeader(tintShadeCount)}${colorDisplayRows.join("")}</table>`;
        tableContainer.innerHTML = colorDisplayTable;

      if (!hexCellKeyHandlerAdded) {
        tableContainer.addEventListener("keydown", (event) => {
          const target = event.target;
          if (!target || !target.classList || !target.classList.contains("hex-color")) return;
          if (target.closest && target.closest(".hex-color--picker")) return;
          if (!isActivationKey(event)) return;
          event.preventDefault();
          target.click();
        });
        hexCellKeyHandlerAdded = true;
      }

      state.palettes = buildPaletteData(parsedColorsArray, tintShadeCount);
      state.tintShadeCount = tintShadeCount;
      toggleExportWrapperVisibility(true, elements);
      setExportFormat(state.format, state, elements);
      updateExportOutput(state, elements);

      updateHashState(parsedColorsArray, settings);

      if (!skipScroll) {
        const scrollElement = document.getElementById("scroll-top") || document.getElementById("tints-and-shades");
        if (scrollElement) {
          smoothScrollTo(scrollElement, 500, -16);
        } else {
          console.error("Element with id 'tints-and-shades' not found.");
        }
      }

      setTimeout(() => {
        tableContainer.removeAttribute("tabindex");
        if (!skipFocus) {
          const makeButton = document.getElementById("make");
          if (makeButton) {
            makeButton.focus();
          }
        }
      });

      updateHexValueDisplay(settings.copyWithHashtag);
    } else if (!firstTime) {
      smoothScrollTo(document.body, 500);
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
