(() => {
  const VALID_EXPORT_FORMATS = ["hex", "hex-hash", "rgb", "css", "json"];
  const EXPORT_FORMAT_STORAGE_KEY = "export-preferred-format";

  const getStoredExportFormat = () => {
    try {
      const storedFormat = localStorage.getItem(EXPORT_FORMAT_STORAGE_KEY);
      if (storedFormat && VALID_EXPORT_FORMATS.includes(storedFormat)) {
        return storedFormat;
      }
    } catch (err) {
      // Ignore storage errors and fall back to default
    }
    return "hex";
  };

  const persistExportFormat = (format) => {
    if (!VALID_EXPORT_FORMATS.includes(format)) return;
    try {
      localStorage.setItem(EXPORT_FORMAT_STORAGE_KEY, format);
    } catch (err) {
      // Ignore storage errors
    }
  };

  const exportState = {
    palettes: [],
    format: getStoredExportFormat()
  };

  const exportElements = {
    wrapper: null,
    openButton: null,
    modal: null,
    closeButton: null,
    tabs: [],
    output: null,
    code: null,
    copyFab: null,
    copyStatus: null,
    imageButton: null,
  };

  const LANGUAGE_CLASSES = [
    "language-none",
    "language-css",
    "language-json",
    "language-javascript",
    "language-markup"
  ];

  const getLanguageClassForFormat = (format) => {
    switch (format) {
      case "css":
        return "language-css";
      case "json":
        return "language-json";
      case "js":
        return "language-javascript";
      case "html":
        return "language-markup";
      default:
        return "language-none";
    }
  };

  const updateExportLanguage = (format, elements) => {
    if (!elements.output) return;
    const languageClass = getLanguageClassForFormat(format);
    LANGUAGE_CLASSES.forEach((className) => {
      elements.output.classList.remove(className);
      if (elements.code) {
        elements.code.classList.remove(className);
      }
    });
    elements.output.classList.add(languageClass);
    if (elements.code) {
      elements.code.classList.add(languageClass);
    }
  };

  const highlightExportCode = (codeElement) => {
    if (!codeElement || typeof window === "undefined") return;
    const prism = window.Prism;
    if (!prism || typeof prism.highlightElement !== "function") return;
    prism.highlightElement(codeElement);
  };

  let pageScrollY = 0;
  let handleOutsidePointerDown = null;

  const clampPercent = (percent) => {
    if (typeof percent !== "number" || Number.isNaN(percent)) return 0;
    return Math.min(Math.max(percent, 0), 100);
  };

  const formatCssTier = (percent) => {
    const safe = clampPercent(percent);
    return Math.round(safe * 10).toString(); // use 100s scale (10% => 100)
  };

  const prefersReducedMotion = () => {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  const canvasToBlob = (canvas) => new Promise((resolve) => {
    const serialize = () => {
      const dataUrl = canvas.toDataURL("image/png");
      const base64 = dataUrl.split(",")[1] || "";
      const binary = atob(base64);
      const buffer = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        buffer[i] = binary.charCodeAt(i);
      }
      resolve(new Blob([buffer], { type: "image/png" }));
    };

    if (canvas.toBlob) {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        serialize();
      });
      return;
    }
    serialize();
  });

  const downloadBlob = (blob, filename) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  function createTableCanvas(table) {
    if (!table) return null;

    const rows = Array.from(table.rows || []);
    if (!rows.length) return null;

    const tableRect = table.getBoundingClientRect();
    const tableStyle = window.getComputedStyle(table);

    const totalWidth = Math.max(1, Math.round(tableRect.width));
    const totalHeight = Math.max(1, Math.round(tableRect.height));
    if (!totalWidth || !totalHeight) return null;

    const paddingX = 24;
    const paddingY = 16;
    const bottomTrim = 12;

    const ratio = Math.max(1, window.devicePixelRatio || 1);
    const canvasWidthCss = totalWidth + paddingX * 2;
    const canvasHeightCss = totalHeight + paddingY * 2 - bottomTrim;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(canvasWidthCss * ratio));
    canvas.height = Math.max(1, Math.round(canvasHeightCss * ratio));

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.scale(ratio, ratio);

    const rootBackground = window.getComputedStyle(document.documentElement).backgroundColor;
    const isTransparent = (value) =>
      !value || value === "transparent" || value === "rgba(0, 0, 0, 0)";

    let tableBackground = tableStyle.backgroundColor;
    if (isTransparent(tableBackground)) {
      tableBackground = !isTransparent(rootBackground) ? rootBackground : "#fff";
    }

    ctx.fillStyle = tableBackground;
    ctx.fillRect(0, 0, canvasWidthCss, canvasHeightCss);

    ctx.textBaseline = "top";

    rows.forEach((row) => {
      const rowRect = row.getBoundingClientRect();
      const rowTop = Math.round(rowRect.top - tableRect.top);
      const rowHeight = Math.max(1, Math.round(rowRect.height));

      const cells = Array.from(row.cells);
      if (!cells.length) return;

      const cellRects = cells.map((cell) => cell.getBoundingClientRect());
      const edges = cellRects.map((r) => ({
        left: r.left - tableRect.left,
        right: r.right - tableRect.left
      }));

      const intEdges = edges.map((edge, index) => {
        const left = Math.round(edge.left);
        let right = Math.round(edge.right);
        if (index === edges.length - 1) right = totalWidth;
        return { left, right, width: Math.max(1, right - left) };
      });

      cells.forEach((cell, index) => {
        const { left, width } = intEdges[index];
        const x = paddingX + left;
        const y = paddingY + rowTop;

        const computed = window.getComputedStyle(cell);
        const cellBg = computed.backgroundColor;

        if (!isTransparent(cellBg)) {
          ctx.fillStyle = cellBg;
        } else {
          ctx.fillStyle = tableBackground;
        }
        const isLastCell = index === cells.length - 1;
        ctx.fillRect(
          x,
          y,
          isLastCell ? width : width + 2,
          rowHeight
        );

        const rawText = (cell.textContent || "").trim();
        const hexPattern = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
        let text = rawText;
        if (hexPattern.test(rawText)) {
          text = rawText.toLowerCase();
        }
        if (!text) return;

        ctx.fillStyle = computed.color || "#000";
        const fontSize = 14;
        const fontFamily = computed.fontFamily || "Work Sans, system-ui, sans-serif";
        ctx.font = `${fontSize}px ${fontFamily}`;

        const isHeaderRow = row.classList && row.classList.contains("table-header");
        const isNameRow = row.classList && row.classList.contains("palette-titlebar");
        const titleOffset = isHeaderRow ? 8 : 8;

        const textAlignValue = computed.textAlign || "left";
        const direction = computed.direction || "ltr";
        let normalizedAlign = textAlignValue;

        if (textAlignValue === "start") {
          normalizedAlign = direction === "rtl" ? "right" : "left";
        } else if (textAlignValue === "end") {
          normalizedAlign = direction === "rtl" ? "left" : "right";
        }

        if (isNameRow) {
          normalizedAlign = "left";
        }

        ctx.textAlign = normalizedAlign;

        let textX = x + width / 2;
        if (normalizedAlign === "left") {
          const paddingLeft = parseFloat(computed.paddingLeft) || 0;
          textX = x + paddingLeft;
        } else if (normalizedAlign === "right") {
          const paddingRight = parseFloat(computed.paddingRight) || 0;
          textX = x + width - paddingRight;
        }

        ctx.fillText(text, textX, y + titleOffset);
      });
    });

    return { canvas, width: totalWidth, height: totalHeight };
  }

  const downloadPaletteTableAsPng = async () => {
    if (!exportState.palettes || !exportState.palettes.length) return;
    const tableWrapper = document.getElementById("tints-and-shades");
    if (!tableWrapper) return;
    const paletteWrappers = Array.from(tableWrapper.querySelectorAll(".palette-wrapper"));
    if (!paletteWrappers.length) return;
    const aggregatedTable = document.createElement("table");
    const firstTable = paletteWrappers[0].querySelector("table");
    if (firstTable) aggregatedTable.className = firstTable.className;

    const copyComputedProperties = (sourceElement, targetElement, properties) => {
      if (!sourceElement || !targetElement) return;
      const computed = window.getComputedStyle(sourceElement);
      properties.forEach((property) => {
        const value = computed.getPropertyValue(property);
        if (value !== "") {
          targetElement.style.setProperty(property, value);
        }
      });
    };

    const copyRowStyles = (sourceRow, targetRow) => {
      Array.from(sourceRow.cells).forEach((cell, index) => {
        const targetCell = targetRow.cells[index];
        if (!targetCell) return;
        copyComputedProperties(cell, targetCell, [
          "background-color",
          "color",
          "font-family",
          "font-size",
          "font-weight",
          "line-height",
          "letter-spacing",
          "text-align",
          "direction",
          "text-transform",
          "padding-left",
          "padding-right",
          "padding-top",
          "padding-bottom",
          "box-sizing"
        ]);
        const cellRect = cell.getBoundingClientRect();
        targetCell.style.setProperty("width", `${Math.max(1, Math.round(cellRect.width))}px`);
        targetCell.style.setProperty("height", `${Math.max(1, Math.round(cellRect.height))}px`);
      });
    };

    paletteWrappers.forEach((wrapper, index) => {
      const paletteNameLabel = wrapper.querySelector(".palette-titlebar-name");
      const paletteNameText = (paletteNameLabel && paletteNameLabel.textContent)
        ? paletteNameLabel.textContent.trim()
        : "";
      const innerTable = wrapper.querySelector("table");
      if (!innerTable) return;
      const headerRow = innerTable.querySelector(".table-header");
      const columnCount = headerRow
        ? headerRow.cells.length
        : (innerTable.rows[0] ? innerTable.rows[0].cells.length : 1);

      if (paletteNameText) {
        const nameRow = document.createElement("tr");
        nameRow.className = "palette-titlebar";
        const nameCell = document.createElement("td");
        nameCell.setAttribute("colspan", `${columnCount}`);
        nameCell.textContent = paletteNameText;
        nameCell.style.paddingBottom = "8px";
        if (paletteNameLabel) {
          copyComputedProperties(paletteNameLabel, nameCell, [
            "color",
            "font-family",
            "font-size",
            "font-weight",
            "letter-spacing",
            "text-transform"
          ]);
        }
        nameRow.appendChild(nameCell);
        aggregatedTable.appendChild(nameRow);
      }

      if (headerRow) {
        const clonedHeader = headerRow.cloneNode(true);
        copyRowStyles(headerRow, clonedHeader);
        Array.from(clonedHeader.cells).forEach((cell) => {
          cell.style.paddingBottom = "4px";
          cell.style.paddingTop = "6px";
          cell.style.verticalAlign = "bottom";
          cell.style.lineHeight = "1.2";
        });
        aggregatedTable.appendChild(clonedHeader);
      }

      innerTable.querySelectorAll("tbody tr").forEach((row) => {
        const clonedRow = row.cloneNode(true);
        copyRowStyles(row, clonedRow);
        aggregatedTable.appendChild(clonedRow);
      });

      const isLastPalette = index === paletteWrappers.length - 1;
      if (!isLastPalette) {
        const spacerRow = document.createElement("tr");
        const spacerCell = document.createElement("td");
        spacerCell.setAttribute("colspan", `${columnCount}`);
        spacerCell.innerHTML = "&nbsp;";
        spacerCell.style.height = "8px";
        spacerCell.style.lineHeight = "8px";
        spacerCell.style.border = "none";
        spacerRow.appendChild(spacerCell);
        aggregatedTable.appendChild(spacerRow);
      }
    });

    const rowCount = aggregatedTable.rows.length;
    if (!rowCount) return;

    const hiddenWrapper = document.createElement("div");
    Object.assign(hiddenWrapper.style, {
      position: "absolute",
      top: "-9999px",
      left: "-9999px",
      opacity: "0",
      pointerEvents: "none",
    });
    const paletteTableShim = document.createElement("div");
    paletteTableShim.className = "palette-table";
    paletteTableShim.appendChild(aggregatedTable);
    hiddenWrapper.appendChild(paletteTableShim);
    tableWrapper.appendChild(hiddenWrapper);

    let canvasResult = null;
    try {
      canvasResult = createTableCanvas(aggregatedTable);
    } finally {
      if (hiddenWrapper.parentNode) {
        hiddenWrapper.parentNode.removeChild(hiddenWrapper);
      }
    }
    if (!canvasResult || !canvasResult.canvas) return;
    const { canvas } = canvasResult;
    const imageButton = exportElements.imageButton;
    if (imageButton) {
      imageButton.disabled = true;
      imageButton.setAttribute("aria-busy", "true");
    }
    try {
      const blob = await canvasToBlob(canvas);
      if (!blob) throw new Error("Failed to create PNG");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      downloadBlob(blob, `palettes-${timestamp}.png`);
    } catch (error) {
      console.error("Failed to export palette table as PNG", error);
    } finally {
      if (imageButton) {
        imageButton.disabled = false;
        imageButton.removeAttribute("aria-busy");
      }
    }
  };

  const lockBodyScroll = () => {
    if (document.body.classList.contains("modal-open")) return;
    pageScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.style.position = "fixed";
    document.body.style.top = `-${pageScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.classList.add("modal-open");
  };

  const unlockBodyScroll = () => {
    const scrollToY = pageScrollY || 0;
    document.body.classList.remove("modal-open");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    window.scrollTo(0, scrollToY);
  };

  const getDialogFocusable = () => {
    if (!exportElements.modal) return [];
    const selectors = [
      "button",
      "[href]",
      'input:not([type=\"hidden\"])',
      "select",
      "textarea",
      "[tabindex]:not([tabindex='-1'])"
    ];
    const nodes = Array.from(exportElements.modal.querySelectorAll(selectors.join(",")));
    return nodes.filter((node) => {
      const tabIndex = node.tabIndex;
      const isHidden = node.getAttribute("aria-hidden") === "true";
      const isDisabled = node.hasAttribute("disabled");
      return !isHidden && !isDisabled && tabIndex !== -1;
    });
  };

  const resetExportScroll = (elements) => {
    if (elements.output) {
      elements.output.scrollTop = 0;
      elements.output.scrollLeft = 0;
    }
    if (elements.output && elements.output.parentElement) {
      elements.output.parentElement.scrollTop = 0;
      elements.output.parentElement.scrollLeft = 0;
    }
  };

  const formatHexOutput = (palettes, includeHash, stepLabel) => {
    if (!palettes.length) return "";
    const prefix = includeHash ? "#" : "";
    const shadesHeader = stepLabel ? `${stepLabel} shades` : "shades";
    const tintsHeader = stepLabel ? `${stepLabel} tints` : "tints";
    const blocks = palettes.map((palette) => {
      const rawLabel = palette.label || palette.id;
      const label = exportNaming.formatLabelForDisplay(rawLabel) || rawLabel;
      const baseLine = `${label} - ${prefix}${palette.base}`;
      const shadeLines = palette.shades.map((item) => `${prefix}${item.hex}`);
      const tintLines = palette.tints.map((item) => `${prefix}${item.hex}`);
      return [
        baseLine,
        "",
        shadesHeader,
        "-----",
        ...shadeLines,
        "",
        tintsHeader,
        "-----",
        ...tintLines
      ].join("\n");
    });
    return blocks.join("\n\n");
  };

  const formatCssOutput = (palettes) => {
    if (!palettes.length) return "";
    const lines = [];
    palettes.forEach((palette) => {
      const baseName = palette.id;
      const rawLabel = palette.label || baseName;
      const label = exportNaming.formatLabelForDisplay(rawLabel) || rawLabel;
      lines.push(`  /* ${label} */`);
      lines.push(`  --${baseName}-base: #${palette.base};`);
      const shadeLines = palette.shades.map((item) => {
        const tier = formatCssTier(item.percent);
        return `  --${baseName}-shade-${tier}: #${item.hex};`;
      });
      const tintLines = palette.tints.map((item) => {
        const tier = formatCssTier(item.percent);
        return `  --${baseName}-tint-${tier}: #${item.hex};`;
      });
      lines.push(...shadeLines, ...tintLines);
    });
    return `:root {\n${lines.join("\n")}\n}`;
  };

  const formatJsonOutput = (palettes) => {
    if (!palettes.length) return "";
    const makePalettePayload = (palette) => {
      const shades = palette.shades.map((item) => {
        const step = formatCssTier(item.percent);
        return {
          step: Number(step),
          name: `${palette.id}-shade-${step}`,
          hex: `#${item.hex}`
        };
      });
      const tints = palette.tints.map((item) => {
        const step = formatCssTier(item.percent);
        return {
          step: Number(step),
          name: `${palette.id}-tint-${step}`,
          hex: `#${item.hex}`
        };
      });
      return {
        base: {
          name: palette.id,
          hex: `#${palette.base}`
        },
        shades,
        tints
      };
    };

    if (palettes.length === 1) {
      return JSON.stringify(makePalettePayload(palettes[0]), null, 2);
    }

    const payload = {};
    palettes.forEach((palette) => {
      payload[palette.id] = makePalettePayload(palette);
    });
    return JSON.stringify(payload, null, 2);
  };

  const normalizeHex = (hex) => {
    if (typeof hex !== "string") return "";
    return hex.replace(/^#/, "").trim().slice(0, 6);
  };

  const formatRgbValue = (hex) => {
    const normalized = normalizeHex(hex);
    if (normalized.length !== 6) return "";
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    if ([r, g, b].some((value) => Number.isNaN(value))) return "";
    return `rgb(${r}, ${g}, ${b})`;
  };

  const formatRgbOutput = (palettes, stepLabel) => {
    if (!palettes.length) return "";
    const blocks = palettes.map((palette) => {
      const rawLabel = palette.label || palette.id;
      const label = exportNaming.formatLabelForDisplay(rawLabel) || rawLabel;
      const rgbValue = formatRgbValue(palette.base) || palette.base;
      const baseLine = `${label} - ${rgbValue}`;
      const shadeLines = palette.shades.map((item) => formatRgbValue(item.hex) || item.hex);
      const tintLines = palette.tints.map((item) => formatRgbValue(item.hex) || item.hex);
      const shadesHeader = stepLabel ? `${stepLabel} shades` : "shades";
      const tintsHeader = stepLabel ? `${stepLabel} tints` : "tints";
      return [
        baseLine,
        "",
        shadesHeader,
        "-----",
        ...shadeLines,
        "",
        tintsHeader,
        "-----",
        ...tintLines
      ].join("\n");
    });
    return blocks.join("\n\n");
  };

  const getExportText = (state) => {
    let stepLabel = "";
    if (state && typeof state.tintShadeCount === "number" && state.tintShadeCount > 0) {
      const percentStep = Math.round(100 / state.tintShadeCount);
      stepLabel = `${percentStep}%`;
    }
    if (state.format === "css") return formatCssOutput(state.palettes);
    if (state.format === "json") return formatJsonOutput(state.palettes);
    if (state.format === "hex-hash") return formatHexOutput(state.palettes, true, stepLabel);
    if (state.format === "rgb") return formatRgbOutput(state.palettes, stepLabel);
    return formatHexOutput(state.palettes, false, stepLabel);
  };

  const updateExportOutput = (state, elements) => {
    if (!elements.output) return;
    const text = getExportText(state);
    if (elements.code) {
      elements.code.textContent = text;
      highlightExportCode(elements.code);
    } else {
      elements.output.textContent = text;
    }
    elements.output.setAttribute("aria-labelledby", `export-tab-${state.format}`);
  };

  const updateExportCornerRadius = (state, elements) => {
    if (!elements.output) return;
    const firstTabFormat = elements.tabs[0] ? elements.tabs[0].dataset.format : null;
    const isFirstTabActive = state.format === firstTabFormat;
    elements.output.classList.toggle("is-first-tab-active", isFirstTabActive);
  };

  const setExportFormat = (format, state, elements) => {
    state.format = VALID_EXPORT_FORMATS.includes(format) ? format : "hex";
    persistExportFormat(state.format);
    if (elements.tabs.length) {
      elements.tabs.forEach((tab) => {
        const isActive = tab.dataset.format === state.format;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
        tab.setAttribute("tabindex", isActive ? "0" : "-1");
      });
    }
    updateExportLanguage(state.format, elements);
    updateExportCornerRadius(state, elements);
    updateExportOutput(state, elements);
    resetExportScroll(elements);
  };

  const toggleExportWrapperVisibility = (visible, elements) => {
    if (!elements.wrapper || !elements.openButton) return;
    elements.wrapper.hidden = !visible;
    elements.openButton.disabled = !visible;
    elements.openButton.setAttribute("aria-expanded", "false");
    if (elements.imageButton) {
      elements.imageButton.disabled = !visible;
      elements.imageButton.setAttribute("aria-disabled", visible ? "false" : "true");
    }
  };

  const copyExportOutput = async (state, elements) => {
    const text = getExportText(state);
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const helper = document.createElement("textarea");
        helper.value = text;
        helper.setAttribute("readonly", "");
        helper.style.position = "absolute";
        helper.style.left = "-9999px";
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        document.body.removeChild(helper);
      }
      const btn = elements.copyFab;
      if (btn) {
        btn.classList.add("copied");
        btn.disabled = true;
        btn.setAttribute("aria-disabled", "true");
        setTimeout(() => {
          btn.classList.remove("copied");
          btn.disabled = false;
          btn.setAttribute("aria-disabled", "false");
        }, 1500);
      }
      const status = elements.copyStatus;
      if (status) {
        status.textContent = "Copied export output to clipboard.";
        setTimeout(() => {
          status.textContent = "";
        }, 4500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectExportOutput = () => {
    if (!exportElements.output) return;
    const selection = window.getSelection && window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(exportElements.output);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const openExportModal = (state, elements) => {
    if (!elements.modal) return;
    if (!state.palettes.length) return;
    setExportFormat(state.format, state, elements);
    lockBodyScroll();
    if (typeof elements.modal.showModal === "function") {
      elements.modal.showModal();
    } else {
      elements.modal.setAttribute("open", "true");
    }
    elements.modal.classList.remove("is-closing");
    elements.modal.removeAttribute("data-closing");
    if (!prefersReducedMotion()) {
      elements.modal.classList.add("is-opening");
      elements.modal.addEventListener("animationend", (event) => {
        if (event.target === elements.modal && event.animationName === "export-dialog-fade") {
          elements.modal.classList.remove("is-opening");
        }
      }, { once: true });
    } else {
      elements.modal.classList.remove("is-opening");
    }
    if (!handleOutsidePointerDown) {
      handleOutsidePointerDown = (event) => {
        if (!elements.modal || !elements.modal.open) return;
        const rect = elements.modal.getBoundingClientRect();
        const isOutside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
        if (isOutside) {
          closeExportModal(elements);
        }
      };
      document.addEventListener("pointerdown", handleOutsidePointerDown);
    }
    if (elements.openButton) {
      elements.openButton.setAttribute("aria-expanded", "true");
    }
    const activeTab = elements.tabs.find((tab) => tab.classList.contains("is-active")) || elements.tabs[0];
    if (activeTab) activeTab.focus();
    // Reset scroll after layout to avoid stale scroll positions on reopen
    requestAnimationFrame(() => resetExportScroll(elements));
  };

  const closeExportModal = (elements) => {
    const modal = elements.modal;
    if (!modal) return;
    if (modal.getAttribute("data-closing") === "true") return;

    const completeClose = () => {
      modal.removeAttribute("data-closing");
      modal.classList.remove("is-closing");
      modal.classList.remove("is-opening");
      if (modal.open && typeof modal.close === "function") {
        modal.close();
      } else {
        modal.removeAttribute("open");
      }
      resetExportScroll(elements);
      unlockBodyScroll();
      if (handleOutsidePointerDown) {
        document.removeEventListener("pointerdown", handleOutsidePointerDown);
        handleOutsidePointerDown = null;
      }
      if (elements.openButton) {
        elements.openButton.setAttribute("aria-expanded", "false");
      }
    };

    if (!modal.open && !modal.hasAttribute("open")) {
      completeClose();
      return;
    }

    if (prefersReducedMotion()) {
      completeClose();
      return;
    }

    modal.setAttribute("data-closing", "true");
    modal.classList.remove("is-opening");
    modal.classList.add("is-closing");

    let closeFallbackTimer = null;
    const handleAnimationEnd = (event) => {
      if (event.target !== modal || event.animationName !== "export-dialog-fade") return;
      clearTimeout(closeFallbackTimer);
      modal.removeEventListener("animationend", handleAnimationEnd);
      completeClose();
    };

    closeFallbackTimer = setTimeout(() => {
      modal.removeEventListener("animationend", handleAnimationEnd);
      completeClose();
    }, 250);

    modal.addEventListener("animationend", handleAnimationEnd);
  };

  const wireExportControls = () => {
    exportElements.wrapper = document.getElementById("palette-controls-wrapper");
    exportElements.openButton = document.getElementById("export-open");
    exportElements.modal = document.getElementById("export-dialog");
    exportElements.closeButton = document.getElementById("export-close");
    exportElements.tabs = Array.from(document.querySelectorAll(".export-tab"));
    exportElements.output = document.getElementById("export-output");
    exportElements.code = exportElements.output
      ? exportElements.output.querySelector(".export-output-code")
      : null;
    exportElements.copyFab = document.getElementById("export-copy");
    exportElements.copyStatus = document.getElementById("export-copy-status");
    exportElements.imageButton = document.getElementById("export-image");

    if (exportElements.openButton) {
      exportElements.openButton.addEventListener("click", () => openExportModal(exportState, exportElements));
    }

    if (exportElements.closeButton) {
      exportElements.closeButton.addEventListener("click", () => closeExportModal(exportElements));
    }

    if (exportElements.modal) {
      exportElements.modal.addEventListener("cancel", (event) => {
        event.preventDefault();
        closeExportModal(exportElements);
      });
      exportElements.modal.addEventListener("click", (event) => {
        // Prevent accidental close when dragging inside the dialog;
        // outside clicks are handled via document-level pointer listener.
        event.stopPropagation();
      });
      exportElements.modal.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          closeExportModal(exportElements);
          return;
        }
        if (event.key === "Tab") {
          const focusables = getDialogFocusable();
          if (!focusables.length) return;
          const currentIndex = focusables.indexOf(document.activeElement);
          let nextIndex = currentIndex;
          if (event.shiftKey) {
            nextIndex = currentIndex <= 0 ? focusables.length - 1 : currentIndex - 1;
          } else {
            nextIndex = currentIndex === focusables.length - 1 ? 0 : currentIndex + 1;
          }
          focusables[nextIndex].focus();
          event.preventDefault();
        }
      });

    }

    if (exportElements.tabs.length) {
      exportElements.tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          setExportFormat(tab.dataset.format, exportState, exportElements);
        });
        tab.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            tab.click();
          }
          if (event.key === "Home") {
            event.preventDefault();
            const firstTab = exportElements.tabs[0];
            if (firstTab) {
              firstTab.click();
              firstTab.focus();
            }
          }
          if (event.key === "End") {
            event.preventDefault();
            const lastTab = exportElements.tabs[exportElements.tabs.length - 1];
            if (lastTab) {
              lastTab.click();
              lastTab.focus();
            }
          }
          if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            event.preventDefault();
            const currentIndex = exportElements.tabs.indexOf(tab);
            const nextIndex = (currentIndex + 1) % exportElements.tabs.length;
            exportElements.tabs[nextIndex].click();
            exportElements.tabs[nextIndex].focus();
          }
          if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            event.preventDefault();
            const currentIndex = exportElements.tabs.indexOf(tab);
            const prevIndex = (currentIndex - 1 + exportElements.tabs.length) % exportElements.tabs.length;
            exportElements.tabs[prevIndex].click();
            exportElements.tabs[prevIndex].focus();
          }
        });
      });
    }

    if (exportElements.copyFab) {
      exportElements.copyFab.addEventListener("click", () => copyExportOutput(exportState, exportElements));
    }

    if (exportElements.output) {
      exportElements.output.addEventListener("click", (event) => {
        if (event.detail === 3) {
          event.preventDefault();
          selectExportOutput();
        }
      });
    }

    if (exportElements.imageButton) {
      exportElements.imageButton.addEventListener("click", () => downloadPaletteTableAsPng());
    }

    toggleExportWrapperVisibility(false, exportElements);
    setExportFormat(exportState.format, exportState, exportElements);
  };

  const updateClipboardData = (copyWithHashtag) => {
    const colorCells = document.querySelectorAll("#tints-and-shades td[data-clipboard-text]");
    colorCells.forEach(cell => {
      const colorCode = cell.getAttribute("data-clipboard-text");
      if (copyWithHashtag) {
        cell.setAttribute("data-clipboard-text", `#${colorCode}`);
      } else {
        cell.setAttribute("data-clipboard-text", colorCode.substr(1));
      }
    });
  };

  window.exportUI = {
    state: exportState,
    elements: exportElements,
    formatListOutput: formatHexOutput,
    formatCssOutput,
    formatJsonOutput,
    getExportText,
    updateExportOutput,
    setExportFormat,
    toggleExportWrapperVisibility,
    copyExportOutput,
    openExportModal,
    closeExportModal,
    wireExportControls,
    updateClipboardData
  };
})();
