import type { ModelConfig } from "../types";

export const models: ModelConfig[] = [
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
