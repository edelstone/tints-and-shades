(() => {
  const linkHoverColors = ["#e96443", "#ca228e"];
  let nextHoverIndex = 0;

  const getNextHoverColor = () => {
    const color = linkHoverColors[nextHoverIndex];
    nextHoverIndex = (nextHoverIndex + 1) % linkHoverColors.length;
    return color;
  };

  const wireAlternatingLinkHover = () => {
    const links = Array.from(document.querySelectorAll("a"));
    if (!links.length) return;

    links.forEach((link) => {
      link.addEventListener("mouseenter", () => {
        link.style.borderColor = getNextHoverColor();
      });
      link.addEventListener("mouseleave", () => {
        link.style.borderColor = "";
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireAlternatingLinkHover);
  } else {
    wireAlternatingLinkHover();
  }
})();
