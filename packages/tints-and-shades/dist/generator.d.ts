export type ScaleColor = {
    hex: string;
    ratio: number;
    percent: number;
};
export declare const calculateShades: (colorValue: string, steps?: number[]) => ScaleColor[];
export declare const calculateTints: (colorValue: string, steps?: number[]) => ScaleColor[];
