
const hasAnchorLink = (heading) =>
  !!heading.querySelector(".anchor");

const getAnchorIconSvg = () => {
  const template = document.getElementById("icon-link-template");
  return template ? template.innerHTML.trim() : "";
};

const addHeadingAnchors = () => {
  const headings = Array.from(document.querySelectorAll("h2"));
  if (!headings.length) return;
  const anchorIconSvg = getAnchorIconSvg();
  if (!anchorIconSvg) return;

  const locationBase = `${window.location.pathname}${window.location.search}`;

  headings.forEach((heading) => {
    if (hasAnchorLink(heading)) return;
    const id = heading.getAttribute("id");
    if (!id) return;

    const anchor = document.createElement("a");
    anchor.className = "anchor";
    anchor.setAttribute("aria-label", "Anchor");
    anchor.href = `${locationBase}#${id}`;
    anchor.innerHTML = anchorIconSvg;
    const icon = anchor.querySelector("svg");
    if (icon) {
      icon.setAttribute("aria-hidden", "true");
      icon.setAttribute("focusable", "false");
    }
    heading.appendChild(anchor);
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", addHeadingAnchors, { once: true });
} else {
  addHeadingAnchors();
}
