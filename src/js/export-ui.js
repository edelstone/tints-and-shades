// export-ui.js - export modal UI: focus trap, scroll lock, formatting, copy
(() => {
  const VALID_EXPORT_FORMATS = ["hex", "hex-hash", "css", "json"];
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
    copyFab: null,
  };

  let pageScrollY = 0;
  let handleOutsidePointerDown = null;

  const clampPercent = (percent) => {
    if (typeof percent !== "number" || Number.isNaN(percent)) return 0;
    return Math.min(Math.max(percent, 0), 100);
  };

  const formatPercentToken = (percent) => {
    const safe = clampPercent(percent);
    const rounded = Math.round(safe * 10) / 10; // one decimal
    const stringValue = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
    return stringValue.replace(/\.0+$/, "").replace(".", "-");
  };

  const formatCssTier = (percent) => {
    const safe = clampPercent(percent);
    return Math.round(safe * 10).toString(); // use 100s scale (10% => 100)
  };

  const formatPaletteLabel = (id) => {
    if (!id || typeof id !== "string") return "Base";
    return id
      .split(/[-_]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const prefersReducedMotion = () => {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      const label = formatPaletteLabel(palette.id);
      const baseLine = `${label} (${prefix}${palette.base})`;
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
      lines.push(`  /* ${formatPaletteLabel(baseName)} */`);
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

  const getExportText = (state) => {
    let stepLabel = "";
    if (state && typeof state.tintShadeCount === "number" && state.tintShadeCount > 0) {
      const percentStep = Math.round(100 / state.tintShadeCount);
      stepLabel = `${percentStep}%`;
    }
    if (state.format === "css") return formatCssOutput(state.palettes);
    if (state.format === "json") return formatJsonOutput(state.palettes);
    if (state.format === "hex-hash") return formatHexOutput(state.palettes, true, stepLabel);
    return formatHexOutput(state.palettes, false, stepLabel);
  };

  const updateExportOutput = (state, elements) => {
    if (!elements.output) return;
    const text = getExportText(state);
    elements.output.textContent = text;
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
    updateExportCornerRadius(state, elements);
    updateExportOutput(state, elements);
    resetExportScroll(elements);
  };

  const toggleExportWrapperVisibility = (visible, elements) => {
    if (!elements.wrapper || !elements.openButton) return;
    elements.wrapper.hidden = !visible;
    elements.openButton.disabled = !visible;
    elements.openButton.setAttribute("aria-expanded", "false");
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
      [elements.copyFab].forEach((btn) => {
        if (!btn) return;
        btn.classList.add("copied");
        btn.disabled = true;
        btn.setAttribute("aria-disabled", "true");
        setTimeout(() => {
          btn.classList.remove("copied");
          btn.disabled = false;
          btn.setAttribute("aria-disabled", "false");
        }, 1500);
      });
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
        if (event.target === elements.modal && event.animationName === "export-modal-fade") {
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
      if (event.target !== modal || event.animationName !== "export-modal-fade") return;
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
    exportElements.wrapper = document.getElementById("export-wrapper");
    exportElements.openButton = document.getElementById("export-open");
    exportElements.modal = document.getElementById("export-modal");
    exportElements.closeButton = document.getElementById("export-close");
    exportElements.tabs = Array.from(document.querySelectorAll(".export-tab"));
    exportElements.output = document.getElementById("export-output");
    exportElements.copyFab = document.getElementById("export-copy-fab");

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

  const makeTableRowColors = (colors, displayType, colorPrefix) => colors.map(colorHex => {
    if (displayType === "colors") {
      return `<td tabindex="0" role="button" aria-label="Color swatch" class="hex-color" style="background-color:#${colorHex}" data-clipboard-text="${colorPrefix}${colorHex}"></td>`;
    }
    return `<td class="hex-value">${colorHex.toUpperCase()}</td>`;
  }).join("");

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
