import { useRef, useEffect, useState } from "react";
import * as THREE from "three";

interface MouseRotation {
  rotationX: number;
  rotationY: number;
}

/**
 * Hook to track mouse position and calculate rotation values
 * @param elementRef - Reference to the HTML element to track mouse over
 * @param sensitivity - Rotation sensitivity (default: 0.5)
 * @returns Object with rotationX and rotationY values
 */
export function useMouseRotation(
  elementRef: React.RefObject<HTMLElement>,
  sensitivity: number = 0.5
): MouseRotation {
  const [rotation, setRotation] = useState<MouseRotation>({
    rotationX: 0,
    rotationY: 0,
  });

  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });
  const animationFrameId = useRef<number>();

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = element.getBoundingClientRect();

      // Calculate normalized mouse position (-1 to 1)
      const normalizedX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const normalizedY = ((event.clientY - rect.top) / rect.height) * 2 - 1;

      // Calculate target rotation (limit to reasonable range)
      const maxRotation = Math.PI / 4; // 45 degrees
      targetRotation.current = {
        x: -normalizedY * maxRotation * sensitivity,
        y: normalizedX * maxRotation * sensitivity,
      };
    };

    const handleMouseLeave = () => {
      // Reset rotation when mouse leaves
      targetRotation.current = { x: 0, y: 0 };
    };

    // Smooth animation loop
    const animate = () => {
      // Lerp current rotation towards target
      const lerpFactor = 0.1;
      currentRotation.current.x = THREE.MathUtils.lerp(
        currentRotation.current.x,
        targetRotation.current.x,
        lerpFactor
      );
      currentRotation.current.y = THREE.MathUtils.lerp(
        currentRotation.current.y,
        targetRotation.current.y,
        lerpFactor
      );

      setRotation({
        rotationX: currentRotation.current.x,
        rotationY: currentRotation.current.y,
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);
    animate();

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [elementRef, sensitivity]);

  return rotation;
}
