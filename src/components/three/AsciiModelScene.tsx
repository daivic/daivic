import { useRef, useEffect, useMemo, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import * as THREE from "three";
import type { AsciiModelSceneProps } from "../../types";
import { OffscreenRenderer } from "./OffscreenRenderer";
import { ShaderPlane } from "./ShaderPlane";
import { useModelLoader } from "../../hooks/useModelLoader";
import { createAsciiFragmentShader } from "../../shaders/asciiFragment.glsl";
import {
  CAMERA_SIZE,
  BACKGROUND_COLOR_GLSL,
  PATTERN_STRIP_WIDTH_GLSL,
  PATTERN_ATLAS_WIDTH_GLSL,
  ANIMATION_SPEED,
  ANIMATION_AMPLITUDE,
} from "../../config/constants";

/**
 * Main ASCII model scene component
 * Handles model loading, rendering, and animation/mouse rotation
 */
export function AsciiModelScene({
  modelPath,
  applyColorTexture = false,
  patternTexture = "/models/pat-cards.png",
  animate = false,
  mouseRotationX = 0,
  mouseRotationY = 0,
}: AsciiModelSceneProps) {
  const { size } = useThree();
  const modelGroupRef = useRef<THREE.Group>(null);

  const [pattern, setPattern] = useState<THREE.Texture | null>(null);
  const [renderResult, setRenderResult] = useState<THREE.Texture | null>(null);

  // Use custom hook for model loading
  const { model } = useModelLoader(modelPath, applyColorTexture);

  // Create orthographic camera
  const camera = useMemo(() => {
    const cam = new THREE.OrthographicCamera(
      -CAMERA_SIZE,
      CAMERA_SIZE,
      CAMERA_SIZE,
      -CAMERA_SIZE,
      0.1,
      20
    );
    cam.position.set(0, 2, 1.5);
    cam.lookAt(0, 0, 0);
    return cam;
  }, []);

  // Create fragment shader
  const fragmentShader = useMemo(
    () =>
      createAsciiFragmentShader(
        BACKGROUND_COLOR_GLSL,
        PATTERN_STRIP_WIDTH_GLSL,
        PATTERN_ATLAS_WIDTH_GLSL
      ),
    []
  );

  // Create custom uniforms with dynamic cell size
  const customUniforms = useMemo(() => {
    if (!pattern) return undefined;

    // Calculate dynamic cell size to maintain consistent number of cells
    // Aim for approximately 80 cells horizontally on a standard screen
    const targetCellsHorizontal = 150;
    const dynamicCellSize = size.width / targetCellsHorizontal;

    return {
      uMap: new THREE.Uniform(renderResult),
      uPattern: new THREE.Uniform(pattern),
      uCellSize: new THREE.Uniform(dynamicCellSize),
    };
  }, [renderResult, pattern, size.width]);

  // Create framebuffer object with reduced resolution for performance
  const fboScale = 0.5; // Reduce resolution for better performance in grid
  const fbo = useFBO(size.width * fboScale, size.height * fboScale, {
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
  }, [patternTexture]);

  // Animation and mouse rotation
  useFrame((state) => {
    if (!modelGroupRef.current) return;

    if (animate) {
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
    // Apply mouse rotation when not animating
    modelGroupRef.current.rotation.x = -mouseRotationX;
    modelGroupRef.current.rotation.y = mouseRotationY;
  });

  return (
    <>
      <ShaderPlane
        fragmentShader={fragmentShader}
        customUniforms={customUniforms}
      />
      <OffscreenRenderer
        fbo={fbo}
        onTextureUpdate={setRenderResult}
        camera={camera}
      >
        <ambientLight intensity={100} />
        {model && (
          <group ref={modelGroupRef}>
            <group>
              <primitive object={model} />
            </group>
          </group>
        )}
      </OffscreenRenderer>
    </>
  );
}
