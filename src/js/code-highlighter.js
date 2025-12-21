(() => {
  const TOKEN_PREFIX = "code-token";

  const escapeHtml = (value) => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const wrap = (value, type) => (
    `<span class="${TOKEN_PREFIX} ${TOKEN_PREFIX}-${type}">${value}</span>`
  );

  const isJsonKey = (source, endIndex) => /^\s*:/.test(source.slice(endIndex));

  const highlightJson = (source) => {
    const tokenPattern = /"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\]:,]/g;
    let result = "";
    let lastIndex = 0;
    let match;

    while ((match = tokenPattern.exec(source))) {
      const raw = match[0];
      result += escapeHtml(source.slice(lastIndex, match.index));

      let type = "punctuation";
      if (raw[0] === "\"") {
        type = isJsonKey(source, match.index + raw.length) ? "key" : "string";
      } else if (/^(true|false|null)$/.test(raw)) {
        type = "keyword";
      } else if (/^-?\d/.test(raw)) {
        type = "number";
      }

      result += wrap(escapeHtml(raw), type);
      lastIndex = match.index + raw.length;
    }

    result += escapeHtml(source.slice(lastIndex));
    return result;
  };

  const highlightCss = (source) => {
    const tokenPattern = /\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[0-9a-fA-F]{3,8}\b|@[\w-]+|-?\d*\.?\d+(?:%|[a-zA-Z]+)?|[a-zA-Z_-][\w-]*|[{}:;(),]/g;
    let result = "";
    let lastIndex = 0;
    let depth = 0;
    let match;

    const isProperty = (endIndex) => /^\s*:/.test(source.slice(endIndex));
    const isFunction = (endIndex) => /^\s*\(/.test(source.slice(endIndex));

    while ((match = tokenPattern.exec(source))) {
      const raw = match[0];
      result += escapeHtml(source.slice(lastIndex, match.index));

      let type = null;
      if (raw.startsWith("/*")) {
        type = "comment";
      } else if (raw[0] === "\"" || raw[0] === "'") {
        type = "string";
      } else if (raw[0] === "#") {
        type = "number";
      } else if (raw[0] === "@") {
        type = "keyword";
      } else if (/^[{}:;(),]$/.test(raw)) {
        type = "punctuation";
      } else if (/^-?\d/.test(raw)) {
        type = "number";
      } else if (/^[a-zA-Z_-]/.test(raw)) {
        if (isFunction(match.index + raw.length)) {
          type = "function";
        } else if (depth > 0 && isProperty(match.index + raw.length)) {
          type = "key";
        } else if (depth === 0) {
          type = "selector";
        } else {
          type = "value";
        }
      }

      if (type) {
        result += wrap(escapeHtml(raw), type);
      } else {
        result += escapeHtml(raw);
      }

      if (raw === "{") {
        depth += 1;
      } else if (raw === "}") {
        depth = Math.max(0, depth - 1);
      }

      lastIndex = match.index + raw.length;
    }

    result += escapeHtml(source.slice(lastIndex));
    return result;
  };

  const detectLanguage = (element) => {
    if (!element || !element.classList) return null;
    if (element.classList.contains("language-json")) return "json";
    if (element.classList.contains("language-css")) return "css";
    return null;
  };

  const highlight = (code, language) => {
    if (language === "json") return highlightJson(code);
    if (language === "css") return highlightCss(code);
    return escapeHtml(code);
  };

  const highlightElement = (element) => {
    if (!element) return;
    const language = detectLanguage(element);
    if (!language) return;
    const code = element.textContent || "";
    element.innerHTML = highlight(code, language);
  };

  window.CodeHighlighter = {
    highlight,
    highlightElement,
  };
})();
