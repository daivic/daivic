import { useFBO } from "@react-three/drei";
import * as THREE from "three";
import type { ReactNode } from "react";

// Model configuration
export interface ModelConfig {
  name: string;
  modelPath: string;
  applyColorTexture: boolean;
  scaleZ: number;
  modelRotation: [number, number, number];
}

// Pattern configuration
export interface PatternConfig {
  name: string;
  path: string;
}

// ASCII model scene props
export interface AsciiModelSceneProps {
  modelPath?: string;
  applyColorTexture?: boolean;
  scaleZ?: number;
  modelRotation?: [number, number, number];
  patternTexture?: string;
  animate?: boolean;
  mouseRotationX?: number;
  mouseRotationY?: number;
}

// Offscreen renderer props
export interface OffscreenRendererProps {
  fbo: ReturnType<typeof useFBO>;
  onTextureUpdate: (texture: THREE.Texture | null) => void;
  camera: THREE.Camera;
  children: ReactNode;
}

// Shader plane props
export interface ShaderPlaneProps {
  fragmentShader: string;
  customUniforms?: Record<string, THREE.Uniform>;
}
