(() => {
  const clipboard = new ClipboardJS(".hex-color");

  clipboard.on("success", (e) => {
    const copiedText = e.text;
    const status = document.getElementById("copy-status");
    const target = e.trigger;

    target.classList.remove("copied-resting");
    target.classList.add("copied");
    target.setAttribute("aria-label", `Copied ${copiedText} to clipboard`);

    if (status) {
      status.textContent = `Copied ${copiedText} to clipboard.`;
    }

    requestAnimationFrame(() => target.focus());

    setTimeout(() => {
      target.classList.remove("copied");
      if (document.activeElement === target) {
        target.classList.add("copied-resting");
      }
    }, 1500);

    target.addEventListener("blur", () => {
      target.classList.remove("copied-resting");
    }, { once: true });

    setTimeout(() => {
      target.setAttribute("aria-label", "Color swatch");
      if (status) status.textContent = "";
    }, 4500);
    e.clearSelection();
  });
})();
