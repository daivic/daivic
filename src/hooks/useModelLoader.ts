import { useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";

/**
 * Custom hook to load and manage GLTF models with optional color texture
 */
export function useModelLoader(
  modelPath?: string,
  applyColorTexture?: boolean
) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [colorTexture, setColorTexture] = useState<THREE.Texture | null>(null);

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
      const maxSize = Math.min(modelSize.x, modelSize.y, modelSize.z);
      const scale = 2 / maxSize;

      loadedModel.scale.setScalar(scale);
      loadedModel.position.sub(center.multiplyScalar(scale));

      setModel(loadedModel);
    });

    return () => {
      // Cleanup if needed
      setModel(null);
    };
  }, [modelPath]);

  // Load color texture
  useEffect(() => {
    if (applyColorTexture) {
      const loader = new THREE.TextureLoader();
      const rgbTexturePath = "/textures/rgb-tex.jpg";
      loader.load(rgbTexturePath, (loadedTexture) => {
        loadedTexture.flipY = false;
        setColorTexture(loadedTexture);
      });
    } else {
      setColorTexture(null);
    }
  }, [applyColorTexture]);

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

  return { model, colorTexture };
}
