// palettes.js - parse input, render tints/shades (table markup helpers), sync hash, and feed export data
(() => {
  let warningTimeout = null;
  let hexCellKeyHandlerAdded = false;

  const TABLE_HEADER = `<thead><tr class="table-header"><td><span>0%</span></td><td><span>10%</span></td><td><span>20%</span></td><td><span>30%</span></td><td><span>40%</span></td><td><span>50%</span></td><td><span>60%</span></td><td><span>70%</span></td><td><span>80%</span></td><td><span>90%</span></td><td><span>100%</span></td></tr></thead>`;

  const makeTableRowColors = (colors, displayType, colorPrefix) => colors.map(colorHex => {
    if (displayType === "colors") {
      return `<td tabindex="0" role="button" aria-label="Color swatch" class="hex-color" style="background-color:#${colorHex}" data-clipboard-text="${colorPrefix}${colorHex}"></td>`;
    }
    return `<td class="hex-value">${colorHex.toUpperCase()}</td>`;
  }).join("");

  const smoothScrollTo = (element, duration) => {
    const targetPosition = element.getBoundingClientRect().top + window.scrollY;
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

  const buildPaletteData = (colors) => {
    const usedNames = new Set();
    return colors.map((color, index) => {
      const baseHex = color.toLowerCase();
      const shades = colorUtils.calculateShades(color)
        .map((hex, idx) => ({ hex: hex.toLowerCase(), step: idx * 10 }))
        .filter(item => item.hex !== baseHex && item.hex !== "000000");
      const tints = colorUtils.calculateTints(color)
        .map((hex, idx) => ({ hex: hex.toLowerCase(), step: idx * 10 }))
        .filter(item => item.hex !== baseHex && item.hex !== "ffffff");

      const fallbackName = `color-${index + 1}`;
      const friendlyName = exportNaming.makeUniqueName(exportNaming.getFriendlyName(baseHex, fallbackName), usedNames);

      return { id: friendlyName, shades, tints };
    });
  };

  const createTintsAndShades = (settings, firstTime = false) => {
    const colorInput = document.getElementById("color-values");
    const tableContainer = document.getElementById("tints-and-shades");
    const warning = document.getElementById("warning");
    const parsedColorsArray = parseColorValues(colorInput.value);

    if (parsedColorsArray !== null && parsedColorsArray.length) {
      const { state, elements, toggleExportWrapperVisibility, setExportFormat, updateExportOutput } = exportUI;
      const colorDisplayRows = [];
      let tableRowCounter = 0;
      const colorPrefix = settings.copyWithHashtag ? "#" : "";

      parsedColorsArray.forEach(color => {
        const calculatedShades = colorUtils.calculateShades(color);
        colorDisplayRows[tableRowCounter++] = `<tr>${makeTableRowColors(calculatedShades, "colors", colorPrefix)}</tr>`;
        colorDisplayRows[tableRowCounter++] = `<tr>${makeTableRowColors(calculatedShades, "RGBValues")}</tr>`;

        const calculatedTints = colorUtils.calculateTints(color);
        colorDisplayRows[tableRowCounter++] = `<tr>${makeTableRowColors(calculatedTints, "colors", colorPrefix)}</tr>`;
        colorDisplayRows[tableRowCounter++] = `<tr>${makeTableRowColors(calculatedTints, "RGBValues")}</tr>`;
      });

      const colorDisplayTable = `<table>${TABLE_HEADER}${colorDisplayRows.join("")}</table>`;
      tableContainer.innerHTML = colorDisplayTable;

      if (!hexCellKeyHandlerAdded) {
        tableContainer.addEventListener("keydown", (event) => {
          const target = event.target;
          if (!target || !target.classList || !target.classList.contains("hex-color")) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            target.click();
          }
        });
        hexCellKeyHandlerAdded = true;
      }

      state.palettes = buildPaletteData(parsedColorsArray);
      toggleExportWrapperVisibility(true, elements);
      setExportFormat("hex", state, elements);
      updateExportOutput(state, elements);

      window.location.hash = parsedColorsArray.join(",");

      const scrollElement = document.getElementById("scroll-top");
      if (scrollElement) {
        smoothScrollTo(scrollElement, 500);
      } else {
        console.error("Element with id 'scroll-top' not found.");
      }

      setTimeout(() => {
        tableContainer.setAttribute("tabindex", "0");
        tableContainer.focus();
      });

      tableContainer.addEventListener("blur", () => {
        tableContainer.setAttribute("tabindex", "-1");
      });
    } else if (!firstTime) {
      smoothScrollTo(document.body, 500);
      tableContainer.innerHTML = "";
      window.location.hash = "";
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
    TABLE_HEADER,
    makeTableRowColors
  };
})();
