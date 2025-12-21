(() => {
  const root = document.documentElement;
  const hoverVarNames = [
    "--link-hover-1",
    "--link-hover-2",
    "--link-hover-3",
    "--link-hover-4",
    "--link-hover-5",
    "--link-hover-6"
  ];
  let linkHoverColors = [];
  let shuffledHoverColors = [];
  let shuffledIndex = 0;

  const readCssVar = (name) =>
    window.getComputedStyle(root).getPropertyValue(name).trim();

  const refreshHoverColors = () => {
    const colors = hoverVarNames.map(readCssVar).filter(Boolean);
    if (!colors.length) return;
    linkHoverColors = colors;
    shuffledHoverColors = [];
    shuffledIndex = 0;
  };

  const reshuffleHoverColors = () => {
    if (!linkHoverColors.length) return;
    shuffledHoverColors = [...linkHoverColors].sort(() => Math.random() - 0.5);
    shuffledIndex = 0;
  };

  const getNextHoverColor = () => {
    if (!linkHoverColors.length) {
      refreshHoverColors();
    }
    if (!linkHoverColors.length) return "";
    if (!shuffledHoverColors.length || shuffledIndex >= shuffledHoverColors.length) {
      reshuffleHoverColors();
    }
    return shuffledHoverColors[shuffledIndex++] || "";
  };

  const wireAlternatingLinkHover = () => {
    const links = Array.from(document.querySelectorAll("a"));
    if (!links.length) return;

    refreshHoverColors();
    const prefersReducedMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hoverIntervals = new WeakMap();

    links.forEach((link) => {
      link.addEventListener("mouseenter", () => {
        const nextColor = getNextHoverColor();
        if (nextColor) {
          link.style.borderColor = nextColor;
        }
        if (prefersReducedMotion) return;
        const intervalId = window.setInterval(() => {
          const chaoticColor = getNextHoverColor();
          if (chaoticColor) {
            link.style.borderColor = chaoticColor;
          }
        }, 220);
        hoverIntervals.set(link, intervalId);
      });
      link.addEventListener("mouseleave", () => {
        link.style.borderColor = "";
        const intervalId = hoverIntervals.get(link);
        if (typeof intervalId === "number") {
          window.clearInterval(intervalId);
          hoverIntervals.delete(link);
        }
      });
    });

    const themeObserver = new MutationObserver(() => {
      refreshHoverColors();
    });
    themeObserver.observe(root, { attributes: true, attributeFilter: ["class"] });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireAlternatingLinkHover);
  } else {
    wireAlternatingLinkHover();
  }
})();
