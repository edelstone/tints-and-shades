(() => {
  const clipboard = new ClipboardJS(".hex-color");

  clipboard.on("success", (e) => {
    const copiedText = e.text;
    const status = document.getElementById("copy-status");
    const target = e.trigger;

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
    e.clearSelection();
  });
})();
