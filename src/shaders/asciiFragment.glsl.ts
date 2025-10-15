export const createAsciiFragmentShader = (
  backgroundColor: string,
  patternStripWidth: string,
  patternAtlasWidth: string
) => /* glsl */ `
  precision mediump float;

  uniform sampler2D uMap;
  uniform sampler2D uPattern;
  uniform vec2 u_imageResolution;
  uniform float uCellSize;
  
  varying vec2 v_uv;

  void main() {
    vec2 cellCoord = floor(v_uv * u_imageResolution / uCellSize);
    vec2 cellUV = (cellCoord * uCellSize) / u_imageResolution;
    vec2 cellSize = uCellSize / u_imageResolution;
    
    vec2 sampleUV = cellUV + cellSize * 0.5;
    vec4 originalColor = texture2D(uMap, sampleUV);
    
    vec3 backgroundColor = ${backgroundColor};
    
    float contentStrength = length(originalColor.rgb);
    float hasContent = step(0.1, contentStrength);
    
    if (hasContent > 0.5) {
      vec2 pixelCoord = floor(v_uv * u_imageResolution);
      vec2 cellPixelCoord = mod(pixelCoord, uCellSize);
      vec2 localUV = cellPixelCoord / uCellSize;
      
      vec3 color = originalColor.rgb;
      
      float patternIndex;
      
      // Detect which color channel is dominant
      float maxChannel = max(max(color.r, color.g), color.b);
      float minChannel = min(min(color.r, color.g), color.b);
      float diff = maxChannel - minChannel;
      
      // Check if it's a grayscale color (all channels similar)
      if (diff < 0.2) {
        // Grayscale - use luminance to pick pattern (1-5)
        float luminance = (color.r + color.g + color.b) / 3.0;
        if (luminance < 0.25) {
          patternIndex = 1.0; // Dark
        } else if (luminance < 0.5) {
          patternIndex = 2.0; // Medium-dark
        } else if (luminance < 0.75) {
          patternIndex = 3.0; // Medium-light
        } else {
          patternIndex = 4.0; // Light/white
        }
      } else {
        // It's a colored pixel - find which channel is dominant
        if (color.r == maxChannel) {
          // Red dominant
          if (color.g > minChannel + 0.3) {
            patternIndex = 4.0; // Yellow-ish (red + green)
          } else if (color.b > minChannel + 0.3) {
            patternIndex = 5.0; // Magenta-ish (red + blue)  
          } else {
            patternIndex = 1.0; // Pure red
          }
        } else if (color.g == maxChannel) {
          // Green dominant
          if (color.r > minChannel + 0.3) {
            patternIndex = 4.0; // Yellow-ish (green + red)
          } else if (color.b > minChannel + 0.3) {
            patternIndex = 5.0; // Cyan-ish (green + blue)
          } else {
            patternIndex = 2.0; // Pure green
          }
        } else {
          // Blue dominant
          if (color.r > minChannel + 0.3) {
            patternIndex = 5.0; // Magenta-ish (blue + red)
          } else if (color.g > minChannel + 0.3) {
            patternIndex = 5.0; // Cyan-ish (blue + green)
          } else {
            patternIndex = 3.0; // Pure blue
          }
        }
      }
      
      vec2 patternUV = vec2(
        (patternIndex * ${patternStripWidth} + localUV.x * ${patternStripWidth}) / ${patternAtlasWidth},
        localUV.y
      );
      
      vec4 patternColor = texture2D(uPattern, patternUV);
      vec3 finalColor = mix(backgroundColor, patternColor.rgb, patternColor.a);
      
      gl_FragColor = vec4(finalColor, 1.0);
    } else {
      gl_FragColor = vec4(backgroundColor, 1.0);
    }
  }
`;
