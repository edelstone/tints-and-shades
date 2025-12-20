(() => {
  const shareElements = {
    openButton: document.getElementById("share-open"),
    modal: document.getElementById("share-dialog"),
    closeButton: document.getElementById("share-close"),
    input: document.getElementById("share-link-input"),
    copyButton: document.getElementById("share-copy"),
    copyStatus: document.getElementById("share-copy-status")
  };

  let pageScrollY = 0;
  let handleOutsidePointerDown = null;

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
    if (!shareElements.modal) return [];
    const selectors = [
      "button",
      "[href]",
      'input:not([type="hidden"])',
      "select",
      "textarea",
      "[tabindex]:not([tabindex='-1'])"
    ];
    const nodes = Array.from(shareElements.modal.querySelectorAll(selectors.join(",")));
    return nodes.filter((node) => {
      const tabIndex = node.tabIndex;
      const isHidden = node.getAttribute("aria-hidden") === "true";
      const isDisabled = node.hasAttribute("disabled");
      return !isHidden && !isDisabled && tabIndex !== -1;
    });
  };

  const resizeShareInputHeight = () => {
    if (!shareElements.input) return;
    shareElements.input.style.height = "auto";
    shareElements.input.style.height = `${shareElements.input.scrollHeight}px`;
  };

  const updateShareLinkValue = () => {
    if (!shareElements.input) return;
    shareElements.input.value = window.location.href;
    resizeShareInputHeight();
  };

  const copyShareLink = async () => {
    if (!shareElements.input) return;
    const text = shareElements.input.value;
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
      const btn = shareElements.copyButton;
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
      const status = shareElements.copyStatus;
      if (status) {
        status.textContent = "Copied share link to clipboard.";
        setTimeout(() => {
          status.textContent = "";
        }, 4500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const focusCopyButton = () => {
    if (!shareElements.copyButton) return;
    try {
      shareElements.copyButton.focus({ preventScroll: true });
    } catch (error) {
      shareElements.copyButton.focus();
    }
  };

  const openShareModal = () => {
    if (!shareElements.modal) return;
    updateShareLinkValue();
    lockBodyScroll();
    if (typeof shareElements.modal.showModal === "function") {
      shareElements.modal.showModal();
    } else {
      shareElements.modal.setAttribute("open", "true");
    }
    shareElements.modal.classList.remove("is-closing");
    shareElements.modal.removeAttribute("data-closing");
    if (!prefersReducedMotion()) {
      shareElements.modal.classList.add("is-opening");
      shareElements.modal.addEventListener("animationend", (event) => {
        if (event.target === shareElements.modal && event.animationName === "export-dialog-fade") {
          shareElements.modal.classList.remove("is-opening");
        }
      }, { once: true });
    } else {
      shareElements.modal.classList.remove("is-opening");
    }
    if (!handleOutsidePointerDown) {
      handleOutsidePointerDown = (event) => {
        if (!shareElements.modal || !shareElements.modal.open) return;
        const rect = shareElements.modal.getBoundingClientRect();
        const isOutside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
        if (isOutside) {
          closeShareModal();
        }
      };
      document.addEventListener("pointerdown", handleOutsidePointerDown);
    }
    if (shareElements.openButton) {
      shareElements.openButton.setAttribute("aria-expanded", "true");
    }
    requestAnimationFrame(() => {
      resizeShareInputHeight();
      focusCopyButton();
    });
  };

  const closeShareModal = () => {
    const modal = shareElements.modal;
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
      unlockBodyScroll();
      if (handleOutsidePointerDown) {
        document.removeEventListener("pointerdown", handleOutsidePointerDown);
        handleOutsidePointerDown = null;
      }
      if (shareElements.openButton) {
        shareElements.openButton.setAttribute("aria-expanded", "false");
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

  const wireShareControls = () => {
    if (shareElements.openButton) {
      shareElements.openButton.addEventListener("click", () => openShareModal());
    }

    if (shareElements.closeButton) {
      shareElements.closeButton.addEventListener("click", () => closeShareModal());
    }

    if (shareElements.modal) {
      shareElements.modal.addEventListener("cancel", (event) => {
        event.preventDefault();
        closeShareModal();
      });
      shareElements.modal.addEventListener("click", (event) => {
        event.stopPropagation();
      });
      shareElements.modal.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          closeShareModal();
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

    if (shareElements.copyButton) {
      shareElements.copyButton.addEventListener("click", () => copyShareLink());
    }

    if (shareElements.input) {
      shareElements.input.setAttribute("tabindex", "-1");
      shareElements.input.addEventListener("click", () => {
        shareElements.input.select();
      });
    }
  };

  wireShareControls();

  window.shareUI = {
    openShareModal,
    closeShareModal,
    elements: shareElements
  };
})();
