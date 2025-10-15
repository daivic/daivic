// Animation settings
export const ANIMATION_SPEED = {
  VERTICAL_BOB: 1.0,
  ROTATION_SWAY: 0.6,
  TILT: 0.8,
};

export const ANIMATION_AMPLITUDE = {
  VERTICAL: 0.2,
  ROTATION: 0.1,
  TILT: 0.05,
};

// Shader settings
export const CELL_SIZE = 15.0;
export const CAMERA_SIZE = 1.6;

// Background colors - keep these in sync
export const BACKGROUND_COLOR_RGB = { r: 250, g: 250, b: 250 }; // Off-white
export const BACKGROUND_COLOR_CSS = `rgb(${BACKGROUND_COLOR_RGB.r}, ${BACKGROUND_COLOR_RGB.g}, ${BACKGROUND_COLOR_RGB.b})`;
export const BACKGROUND_COLOR_GLSL = `vec3(${BACKGROUND_COLOR_RGB.r / 255}, ${
  BACKGROUND_COLOR_RGB.g / 255
}, ${BACKGROUND_COLOR_RGB.b / 255})`;

// Pattern atlas dimensions (as GLSL float literals)
export const PATTERN_STRIP_WIDTH_GLSL = "64.0";
export const PATTERN_ATLAS_WIDTH_GLSL = "384.0";

// UI settings
export const CONTROL_PANEL_WIDTH = 300;
