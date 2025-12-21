(() => {
  const root = document.documentElement;
  const hoverVarNames = [
    "--link-hover-1",
    "--link-hover-2",
    "--link-hover-3",
    "--link-hover-4",
    "--link-hover-5",
    "--link-hover-6",
  ];

  const readCssVar = (name) =>
    getComputedStyle(root).getPropertyValue(name).trim();

  const uniq = (arr) => {
    const seen = new Set();
    const out = [];
    for (const v of arr) {
      if (!v || seen.has(v)) continue;
      seen.add(v);
      out.push(v);
    }
    return out;
  };

  let colors = [];

  const refreshColors = () => {
    colors = uniq(hoverVarNames.map(readCssVar));
  };

  const pickRandomColor = () => {
    if (!colors.length) refreshColors();
    if (!colors.length) return "";
    const index = Math.floor(Math.random() * colors.length);
    return colors[index] || "";
  };

  const wire = () => {
    const links = Array.from(document.querySelectorAll("a"));
    if (!links.length) return;

    refreshColors();

    links.forEach((link) => {
      link.addEventListener("mouseenter", () => {
        const c = pickRandomColor();
        if (c) link.style.borderColor = c;
      });
      link.addEventListener("mouseleave", () => {
        link.style.borderColor = "";
      });
    });

    new MutationObserver(refreshColors).observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
