import { useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ShaderPlaneProps } from "../../types";
import { vertexShader } from "../../shaders/vertex.glsl";

/**
 * Shader plane that displays the processed texture
 */
export function ShaderPlane({
  fragmentShader,
  customUniforms,
}: ShaderPlaneProps) {
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
