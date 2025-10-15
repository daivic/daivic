import { useState, Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree, createPortal } from "@react-three/fiber";
import { useGLTF, useFBO } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import "./App.css";

// ==================== Type Definitions ====================
interface ModelConfig {
  name: string;
  modelPath: string;
  applyColorTexture: boolean;
  scaleZ: number;
  modelRotation: [number, number, number];
}

interface PatternConfig {
  name: string;
  path: string;
}

interface AsciiModelSceneProps {
  modelPath?: string;
  applyColorTexture?: boolean;
  scaleZ?: number;
  modelRotation?: [number, number, number];
  patternTexture?: string;
  animate?: boolean;
}

// ==================== Constants ====================

// Animation settings
const ANIMATION_SPEED = {
  VERTICAL_BOB: 1.0,
  ROTATION_SWAY: 0.6,
  TILT: 0.8,
};

const ANIMATION_AMPLITUDE = {
  VERTICAL: 0.2,
  ROTATION: 0.1,
  TILT: 0.05,
};

// Shader settings
const CELL_SIZE = 15.0;
const CAMERA_SIZE = 1.6;
const BACKGROUND_COLOR = "vec3(0.980, 0.980, 0.980)";

// Pattern atlas dimensions (as GLSL float literals)
const PATTERN_STRIP_WIDTH_GLSL = "64.0";
const PATTERN_ATLAS_WIDTH_GLSL = "384.0";

// UI settings
const CONTROL_PANEL_WIDTH = 300;

// ==================== Styles ====================

const styles = {
  container: {
    width: "100vw",
    height: "100vh",
    display: "flex",
  },
  controlPanel: {
    width: `${CONTROL_PANEL_WIDTH}px`,
    padding: "20px",
    backgroundColor: "#1a1a1a",
    color: "white",
    overflowY: "auto" as const,
  },
  canvas: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  heading: {
    marginBottom: "20px",
  },
  sectionHeading: {
    marginBottom: "10px",
  },
  radioGroup: {
    marginBottom: "30px",
  },
  radioOption: {
    marginBottom: "10px",
  },
  label: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  radioInput: {
    marginRight: "10px",
  },
  checkbox: {
    marginBottom: "30px",
  },
  description: {
    fontSize: "12px",
    color: "#888",
    marginTop: "40px",
  },
};

// ==================== Data Configuration ====================

const models: ModelConfig[] = [
  {
    name: "Globe",
    modelPath: "/models/globe.glb",
    applyColorTexture: true,
    scaleZ: 1.0,
    modelRotation: [-0.7, 0.2, 0],
  },
  {
    name: "Base App",
    modelPath: "/models/base-app.glb",
    applyColorTexture: true,
    scaleZ: 1.0,
    modelRotation: [-0.6, -0.6, 0],
  },
  {
    name: "Base Pay",
    modelPath: "/models/base-pay.glb",
    applyColorTexture: true,
    scaleZ: 1.0,
    modelRotation: [-0.6, -0.6, 0],
  },
  {
    name: "Builders",
    modelPath: "/models/builders.glb",
    applyColorTexture: false,
    scaleZ: 1.0,
    modelRotation: [-0.6, -0.6, 0],
  },
  {
    name: "Key",
    modelPath: "/models/key.glb",
    applyColorTexture: false,
    scaleZ: 1.0,
    modelRotation: [-0.6, -0.6, 0],
  },
  {
    name: "Open Source",
    modelPath: "/models/open-source.glb",
    applyColorTexture: true,
    scaleZ: 3,
    modelRotation: [-0.6, -0.6, 0],
  },
];

const patternOptions: PatternConfig[] = [
  { name: "Cards Pattern", path: "/models/pat-cards.png" },
  { name: "Colored Atlas", path: "/patterns/pat7-colored.png" },
  { name: "Blue Strip", path: "/patterns/pat-strip-blue.png" },
  { name: "Green Strip", path: "/patterns/pat-strip-green.png" },
  { name: "Pink Strip", path: "/patterns/pat-strip-pink.png" },
  { name: "Tan Strip", path: "/patterns/pat-strip-tan.png" },
];

// ==================== Shaders ====================

const vertexShader = /* glsl */ `
  varying vec2 v_uv;
  
  void main() {
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const asciiFragmentShader = /* glsl */ `
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
    
    vec3 backgroundColor = ${BACKGROUND_COLOR};
    
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
        (patternIndex * ${PATTERN_STRIP_WIDTH_GLSL} + localUV.x * ${PATTERN_STRIP_WIDTH_GLSL}) / ${PATTERN_ATLAS_WIDTH_GLSL},
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

// ==================== Components ====================

// Offscreen renderer for framebuffer operations
function OffscreenRenderer({
  fbo,
  onTextureUpdate,
  camera,
  children,
}: {
  fbo: ReturnType<typeof useFBO>;
  onTextureUpdate: (texture: THREE.Texture | null) => void;
  camera: THREE.Camera;
  children: React.ReactNode;
}) {
  const { gl } = useThree();
  const offscreenScene = useMemo(() => new THREE.Scene(), []);

  useFrame(() => {
    const currentRenderTarget = gl.getRenderTarget();
    gl.setRenderTarget(fbo);
    gl.clear();
    gl.render(offscreenScene, camera);
    gl.setRenderTarget(currentRenderTarget);
    onTextureUpdate(fbo.texture);
  });

  return <>{createPortal(children, offscreenScene)}</>;
}

// Shader plane that displays the processed texture
function ShaderPlane({
  fragmentShader,
  customUniforms,
}: {
  fragmentShader: string;
  customUniforms?: Record<string, THREE.Uniform>;
}) {
  const { size } = useThree();

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        ...customUniforms,
        u_imageResolution: new THREE.Uniform(
          new THREE.Vector2(size.width, size.height)
        ),
      },
    });
  }, [fragmentShader, customUniforms, size]);

  useFrame(() => {
    if (material && material.uniforms.u_imageResolution) {
      material.uniforms.u_imageResolution.value.set(size.width, size.height);
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

// Main ASCII model scene component
function AsciiModelScene({
  modelPath,
  applyColorTexture = false,
  scaleZ = 1,
  modelRotation = [-0.6, -0.6, 0],
  patternTexture = "/models/pat-cards.png",
  animate = false,
}: AsciiModelSceneProps) {
  const { size } = useThree();
  const modelGroupRef = useRef<THREE.Group>(null);

  const [pattern, setPattern] = useState<THREE.Texture | null>(null);
  const [renderResult, setRenderResult] = useState<THREE.Texture | null>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [colorTexture, setColorTexture] = useState<THREE.Texture | null>(null);

  const camera = useMemo(() => {
    const aspect = size.width / size.height || 1;
    const cam = new THREE.OrthographicCamera(
      -aspect * CAMERA_SIZE,
      aspect * CAMERA_SIZE,
      CAMERA_SIZE,
      -CAMERA_SIZE,
      0.1,
      20
    );
    cam.position.set(0, 2, 1.5);
    cam.lookAt(0, 0, 0);
    return cam;
  }, [size.width, size.height]);

  const customUniforms = useMemo(() => {
    if (!pattern) return undefined;

    return {
      uMap: new THREE.Uniform(renderResult),
      uPattern: new THREE.Uniform(pattern),
      uCellSize: new THREE.Uniform(CELL_SIZE),
    };
  }, [renderResult, pattern]);

  const fbo = useFBO(size.width, size.height, {
    type: THREE.HalfFloatType,
  });

  // Load pattern texture
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const patternTex = loader.load(patternTexture);
    patternTex.wrapS = THREE.RepeatWrapping;
    patternTex.wrapT = THREE.RepeatWrapping;
    patternTex.minFilter = THREE.NearestFilter;
    patternTex.magFilter = THREE.NearestFilter;
    setPattern(patternTex);

    if (applyColorTexture) {
      const rgbTexturePath = "/textures/rgb-tex.jpg";
      loader.load(rgbTexturePath, (loadedTexture) => {
        loadedTexture.flipY = false;
        setColorTexture(loadedTexture);
      });
    } else {
      setColorTexture(null);
    }
  }, [applyColorTexture, patternTexture]);

  // Load GLTF model
  useEffect(() => {
    if (!modelPath) return;

    const loader = new GLTFLoader();
    loader.load(modelPath, (gltf) => {
      const loadedModel = gltf.scene;

      // Center and scale the model
      const box = new THREE.Box3().setFromObject(loadedModel);
      const center = box.getCenter(new THREE.Vector3());
      const modelSize = box.getSize(new THREE.Vector3());
      const maxSize = Math.max(modelSize.x, modelSize.y, modelSize.z);
      const scale = 2 / maxSize;

      loadedModel.scale.setScalar(scale);
      loadedModel.position.sub(center.multiplyScalar(scale));

      setModel(loadedModel);
    });
  }, [modelPath]);

  // Apply color texture to model
  useEffect(() => {
    if (!model || !colorTexture) return;

    model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materials.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.map = colorTexture;
            mat.needsUpdate = true;
          }
        });
      }
    });
  }, [model, colorTexture]);

  // Animation
  useFrame((state) => {
    if (animate && modelGroupRef.current) {
      const time = state.clock.getElapsedTime();
      modelGroupRef.current.position.y =
        Math.sin(time * ANIMATION_SPEED.VERTICAL_BOB) *
        ANIMATION_AMPLITUDE.VERTICAL;
      modelGroupRef.current.rotation.y =
        Math.sin(time * ANIMATION_SPEED.ROTATION_SWAY) *
        ANIMATION_AMPLITUDE.ROTATION;
      modelGroupRef.current.rotation.z =
        Math.sin(time * ANIMATION_SPEED.TILT) * ANIMATION_AMPLITUDE.TILT;
    }
  });

  return (
    <>
      <ShaderPlane
        fragmentShader={asciiFragmentShader}
        customUniforms={customUniforms}
      />

      <OffscreenRenderer
        fbo={fbo}
        onTextureUpdate={setRenderResult}
        camera={camera}
      >
        <ambientLight intensity={8} />

        {model && (
          <group ref={modelGroupRef}>
            <group rotation={modelRotation} scale-z={scaleZ}>
              <primitive object={model} />
            </group>
          </group>
        )}
      </OffscreenRenderer>
    </>
  );
}

// ==================== Main App Component ====================

function App() {
  const [selectedModelIndex, setSelectedModelIndex] = useState(0);
  const [selectedPatternIndex, setSelectedPatternIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  return (
    <div style={styles.container}>
      {/* Control Panel */}
      <div style={styles.controlPanel}>
        <h2 style={styles.heading}>ASCII Glyph Shader Demo</h2>

        <div style={styles.radioGroup}>
          <h3 style={styles.sectionHeading}>Select Model</h3>
          {models.map((model, index) => (
            <div key={index} style={styles.radioOption}>
              <label style={styles.label}>
                <input
                  type="radio"
                  name="model"
                  checked={selectedModelIndex === index}
                  onChange={() => setSelectedModelIndex(index)}
                  style={styles.radioInput}
                />
                {model.name}
              </label>
            </div>
          ))}
        </div>

        <div style={styles.radioGroup}>
          <h3 style={styles.sectionHeading}>Select Pattern</h3>
          {patternOptions.map((pattern, index) => (
            <div key={index} style={styles.radioOption}>
              <label style={styles.label}>
                <input
                  type="radio"
                  name="pattern"
                  checked={selectedPatternIndex === index}
                  onChange={() => setSelectedPatternIndex(index)}
                  style={styles.radioInput}
                />
                {pattern.name}
              </label>
            </div>
          ))}
        </div>

        <div style={styles.checkbox}>
          <label style={styles.label}>
            <input
              type="checkbox"
              checked={animate}
              onChange={(e) => setAnimate(e.target.checked)}
              style={styles.radioInput}
            />
            Animate
          </label>
        </div>

        <div style={styles.description}>
          <p>
            This demo showcases an ASCII glyph shader effect using the exact
            pattern from Base.org.
          </p>
        </div>
      </div>

      {/* Canvas */}
      <div style={styles.canvas}>
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <Suspense fallback={null}>
            <AsciiModelScene
              key={`${selectedModelIndex}-${selectedPatternIndex}`}
              modelPath={models[selectedModelIndex].modelPath}
              applyColorTexture={models[selectedModelIndex].applyColorTexture}
              scaleZ={models[selectedModelIndex].scaleZ}
              modelRotation={models[selectedModelIndex].modelRotation}
              patternTexture={patternOptions[selectedPatternIndex].path}
              animate={animate}
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}

// Preload all models
models.forEach((model) => {
  if (model.modelPath) {
    useGLTF.preload(model.modelPath);
  }
});

export default App;
