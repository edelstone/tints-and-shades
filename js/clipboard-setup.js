(() => {
  const clipboard = new ClipboardJS(".hex-color");

  clipboard.on("success", (e) => {
    const copiedText = e.text;
    const status = document.getElementById("copy-status");

    e.trigger.classList.add("copied");
    e.trigger.setAttribute("aria-label", `Copied ${copiedText} to clipboard`);

    if (status) {
      status.textContent = `Copied ${copiedText} to clipboard.`;
    }

    setTimeout(() => e.trigger.blur(), 250);
    setTimeout(() => e.trigger.classList.remove("copied"), 1500);
    setTimeout(() => {
      e.trigger.setAttribute("aria-label", "Color swatch");
      if (status) status.textContent = "";
    }, 4500);
    e.clearSelection();
  });
})();
