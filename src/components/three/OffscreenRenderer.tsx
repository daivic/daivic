import { useMemo } from "react";
import { useThree, useFrame, createPortal } from "@react-three/fiber";
import * as THREE from "three";
import type { OffscreenRendererProps } from "../../types";

/**
 * Offscreen renderer for framebuffer operations
 * Renders children to a framebuffer object and updates a texture
 */
export function OffscreenRenderer({
  fbo,
  onTextureUpdate,
  camera,
  children,
}: OffscreenRendererProps) {
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
