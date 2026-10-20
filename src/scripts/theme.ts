/** Colores por capítulo de la historia (deben coincidir con global.css). */
export const ORANGE = '#FF6A3D';
export const INK = '#160F0B';
export const CREAM = '#FFF3E6';
export const STEP_BG = [ORANGE, ORANGE, INK, INK, ORANGE, CREAM] as const;
export const STEP_PARTICLE = [INK, INK, ORANGE, CREAM, INK, INK] as const;
export const STEP_DARK = [false, false, true, true, false, false] as const;
export const STEPS = 5; // transiciones entre los 6 capítulos
