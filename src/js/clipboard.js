const initClipboard = () => {
  if (document.documentElement.dataset.tsClipboardBound === "true") return true;
  document.documentElement.dataset.tsClipboardBound = "true";

  const copyWithFallback = async (text) => {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(text);
      return;
    }

    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "absolute";
    helper.style.left = "-9999px";
    helper.style.top = "0";
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(helper);
    if (!copied) throw new Error("execCommand copy failed");
  };

  const handleCopySuccess = (target, copiedText) => {
    const status = document.getElementById("copy-status");

    target.classList.add("copy-locked");
    target.setAttribute("aria-disabled", "true");
    target.setAttribute("tabindex", "-1");

    target.classList.add("copied");
    target.setAttribute("aria-label", `Copied ${copiedText} to clipboard`);

    if (status) {
      status.textContent = `Copied ${copiedText} to clipboard.`;
    }

    requestAnimationFrame(() => target.focus());

    setTimeout(() => {
      target.classList.remove("copied");
      target.classList.remove("copy-locked");
      target.removeAttribute("aria-disabled");
      target.setAttribute("tabindex", "0");
    }, 1500);

    setTimeout(() => {
      target.setAttribute("aria-label", "Color swatch");
      if (status) status.textContent = "";
    }, 4500);
  };

  const handleCopyFailure = (target) => {
    const status = document.getElementById("copy-status");
    target.setAttribute("aria-label", "Copy failed");
    if (status) {
      status.textContent = "Copy failed.";
      setTimeout(() => {
        status.textContent = "";
      }, 4500);
    }
  };

  document.addEventListener("click", async (event) => {
    const target = event.target && event.target.closest ? event.target.closest(".hex-color") : null;
    if (!target) return;
    const copiedText = target.getAttribute("data-clipboard-text") || (target.textContent || "").trim();
    if (!copiedText) return;
    try {
      await copyWithFallback(copiedText);
      handleCopySuccess(target, copiedText);
    } catch (error) {
      console.error(error);
      handleCopyFailure(target);
    }
  });

  return true;
};

export { initClipboard };
export default initClipboard;
