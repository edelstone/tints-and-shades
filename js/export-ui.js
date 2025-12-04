// export-ui.js - export modal UI: focus trap, scroll lock, formatting, copy
(() => {
  const exportState = {
    palettes: [],
    format: "hex"
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

  const formatHexOutput = (palettes, includeHash) => {
    if (!palettes.length) return "";
    const prefix = includeHash ? "#" : "";
    const blocks = palettes.map(palette => {
      const values = [...palette.shades, ...palette.tints];
      return values.map(item => `${prefix}${item.hex}`).join("\n");
    });
    return blocks.join("\n\n");
  };

  const formatCssOutput = (palettes) => {
    if (!palettes.length) return "";
    const lines = [];
    palettes.forEach((palette) => {
      const baseName = palette.id;
      const shadeLines = palette.shades.map((item) => {
        const tier = (item.step / 10) * 100;
        return `  --${baseName}-shade-${tier}: #${item.hex};`;
      });
      const tintLines = palette.tints.map((item) => {
        const tier = (item.step / 10) * 100;
        return `  --${baseName}-tint-${tier}: #${item.hex};`;
      });
      lines.push(...shadeLines, ...tintLines);
    });
    return `:root {\n${lines.join("\n")}\n}`;
  };

  const formatJsonOutput = (palettes) => {
    if (!palettes.length) return "";
    const tokens = [];
    palettes.forEach((palette) => {
      palette.shades.forEach((item) => {
        const tier = (item.step / 10) * 100;
        tokens.push({ name: `${palette.id}-shade-${tier}`, hex: `#${item.hex}` });
      });
      palette.tints.forEach((item) => {
        const tier = (item.step / 10) * 100;
        tokens.push({ name: `${palette.id}-tint-${tier}`, hex: `#${item.hex}` });
      });
    });
    return JSON.stringify(tokens, null, 2);
  };

  const getExportText = (state) => {
    if (state.format === "css") return formatCssOutput(state.palettes);
    if (state.format === "json") return formatJsonOutput(state.palettes);
    if (state.format === "hex-hash") return formatHexOutput(state.palettes, true);
    return formatHexOutput(state.palettes, false);
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
    const validFormats = ["hex", "hex-hash", "css", "json"];
    state.format = validFormats.includes(format) ? format : "hex";
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
        setTimeout(() => btn.classList.remove("copied"), 1500);
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
    state.format = "hex";
    setExportFormat("hex", state, elements);
    lockBodyScroll();
    if (typeof elements.modal.showModal === "function") {
      elements.modal.showModal();
    } else {
      elements.modal.setAttribute("open", "true");
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
    if (!elements.modal) return;
    if (elements.modal.open) {
      elements.modal.close();
    } else {
      elements.modal.removeAttribute("open");
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
    setExportFormat("hex", exportState, exportElements);
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
