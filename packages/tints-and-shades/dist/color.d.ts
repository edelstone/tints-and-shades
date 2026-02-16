export type RGB = {
    red: number;
    green: number;
    blue: number;
};
export type HSL = {
    hue: number;
    saturation: number;
    lightness: number;
};
export declare const normalizeHex: (value: string) => string | null;
export declare const hexToRgb: (colorValue: string) => RGB;
export declare const rgbToHex: (rgb: RGB) => string;
export declare const rgbToHsl: (rgb: RGB) => HSL;
export declare const hslToRgb: ({ hue, saturation, lightness }: HSL) => RGB;
export declare const getComplementaryHex: (colorValue: string) => string;
export declare const getSplitComplementaryHexes: (colorValue: string) => [string, string];
export declare const getAnalogousHexes: (colorValue: string) => [string, string];
export declare const getTriadicHexes: (colorValue: string) => [string, string];
