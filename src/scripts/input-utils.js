const ACTIVATION_KEYS = new Set(["enter", "return", "numpadenter", " ", "space", "spacebar"]);
const ACTIVATION_KEY_CODES = new Set([13, 32]);
const USER_HEX_VALUE_RE = /^(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const USER_HEX_TOKEN_RE = /\b(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/g;

const isActivationKey = (value) => {
  if (typeof value === "string") {
    return ACTIVATION_KEYS.has(value.toLowerCase());
  }

  if (typeof value === "number") {
    return ACTIVATION_KEY_CODES.has(value);
  }

  if (!value || typeof value !== "object") return false;

  return (
    isActivationKey(value.key) ||
    isActivationKey(value.code) ||
    isActivationKey(value.keyCode) ||
    isActivationKey(value.which)
  );
};

const stripHexPrefix = (value) => String(value || "").trim().replace(/^#/, "");

const normalizeHexForPaletteCell = (value) => stripHexPrefix(value);

const normalizeHexForPicker = (value) => {
  if (!value) return "";
  const clean = stripHexPrefix(value).replace(/[^0-9a-f]/gi, "").slice(0, 6).toLowerCase();
  if (clean.length === 3) {
    return clean.split("").map((char) => char + char).join("");
  }
  if (clean.length !== 6) return "";
  return clean;
};

const normalizeHexForExport = (value) => {
  if (typeof value !== "string") return "";
  return stripHexPrefix(value).slice(0, 6);
};

const normalizeHexStrictSix = (value) => {
  if (typeof value !== "string") return null;
  const normalized = stripHexPrefix(value).toLowerCase();
  return /^[0-9a-f]{6}$/.test(normalized) ? normalized : null;
};

const isAcceptedUserHex = (value) => USER_HEX_VALUE_RE.test(stripHexPrefix(value));

const parseUserHexValues = (value) => {
  if (typeof value !== "string") return null;
  const matches = value.match(USER_HEX_TOKEN_RE);
  if (!matches) return null;

  return matches.map((item) =>
    item.length === 3
      ? item.split("").map((ch) => ch + ch).join("")
      : item
  );
};

export {
  isActivationKey,
  isAcceptedUserHex,
  parseUserHexValues,
  normalizeHexStrictSix,
  normalizeHexForPaletteCell,
  normalizeHexForPicker,
  normalizeHexForExport
};
