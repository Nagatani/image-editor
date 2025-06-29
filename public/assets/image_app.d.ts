/* tslint:disable */
/* eslint-disable */
export function adjust_brightness(image_data: Uint8Array, value: number): Uint8Array;
export function adjust_contrast(image_data: Uint8Array, value: number): Uint8Array;
export function adjust_saturation(image_data: Uint8Array, value: number): Uint8Array;
export function rotate(image_data: Uint8Array, angle: number): Uint8Array;
export function crop(image_data: Uint8Array, x: number, y: number, width: number, height: number): Uint8Array;
export function adjust_white_balance(image_data: Uint8Array, value: number): Uint8Array;
export function flip_horizontal(image_data: Uint8Array): Uint8Array;
export function flip_vertical(image_data: Uint8Array): Uint8Array;
export function rotate_arbitrary(image_data: Uint8Array, angle: number): Uint8Array;
export function resize(image_data: Uint8Array, width: number, height: number): Uint8Array;
export function to_grayscale(image_data: Uint8Array): Uint8Array;
export function apply_sepia(image_data: Uint8Array): Uint8Array;
export function gaussian_blur(image_data: Uint8Array, sigma: number): Uint8Array;
export function sharpen(image_data: Uint8Array, amount: number): Uint8Array;
export function adjust_hue(image_data: Uint8Array, shift: number): Uint8Array;
export function adjust_exposure(image_data: Uint8Array, stops: number): Uint8Array;
export function adjust_vibrance(image_data: Uint8Array, amount: number): Uint8Array;
export function apply_vignette(image_data: Uint8Array, strength: number, radius: number): Uint8Array;
export function reduce_noise(image_data: Uint8Array, strength: number): Uint8Array;
export function apply_emboss(image_data: Uint8Array): Uint8Array;
export function histogram_equalization(image_data: Uint8Array): Uint8Array;
export function adjust_highlights(image_data: Uint8Array, amount: number): Uint8Array;
export function adjust_shadows(image_data: Uint8Array, amount: number): Uint8Array;
export function adjust_curves(image_data: Uint8Array, red_gamma: number, green_gamma: number, blue_gamma: number): Uint8Array;
export function adjust_levels(image_data: Uint8Array, black_point: number, white_point: number, gamma: number): Uint8Array;
export function calculate_histogram(image_data: Uint8Array): Uint32Array;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly adjust_brightness: (a: number, b: number, c: number) => [number, number];
  readonly adjust_contrast: (a: number, b: number, c: number) => [number, number];
  readonly adjust_saturation: (a: number, b: number, c: number) => [number, number];
  readonly rotate: (a: number, b: number, c: number) => [number, number];
  readonly crop: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number];
  readonly adjust_white_balance: (a: number, b: number, c: number) => [number, number];
  readonly flip_horizontal: (a: number, b: number) => [number, number];
  readonly flip_vertical: (a: number, b: number) => [number, number];
  readonly rotate_arbitrary: (a: number, b: number, c: number) => [number, number];
  readonly resize: (a: number, b: number, c: number, d: number) => [number, number];
  readonly to_grayscale: (a: number, b: number) => [number, number];
  readonly apply_sepia: (a: number, b: number) => [number, number];
  readonly gaussian_blur: (a: number, b: number, c: number) => [number, number];
  readonly sharpen: (a: number, b: number, c: number) => [number, number];
  readonly adjust_hue: (a: number, b: number, c: number) => [number, number];
  readonly adjust_exposure: (a: number, b: number, c: number) => [number, number];
  readonly adjust_vibrance: (a: number, b: number, c: number) => [number, number];
  readonly apply_vignette: (a: number, b: number, c: number, d: number) => [number, number];
  readonly reduce_noise: (a: number, b: number, c: number) => [number, number];
  readonly apply_emboss: (a: number, b: number) => [number, number];
  readonly histogram_equalization: (a: number, b: number) => [number, number];
  readonly adjust_highlights: (a: number, b: number, c: number) => [number, number];
  readonly adjust_shadows: (a: number, b: number, c: number) => [number, number];
  readonly adjust_curves: (a: number, b: number, c: number, d: number, e: number) => [number, number];
  readonly adjust_levels: (a: number, b: number, c: number, d: number, e: number) => [number, number];
  readonly calculate_histogram: (a: number, b: number) => [number, number];
  readonly __wbindgen_export_0: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
