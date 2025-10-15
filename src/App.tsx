import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { AsciiModelScene } from "./components/three/AsciiModelScene";
import { models } from "./config/models";
import { patternOptions } from "./config/patterns";
import { BACKGROUND_COLOR_CSS } from "./config/constants";
import { useMouseRotation } from "./hooks/useMouseRotation";

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { rotationX, rotationY } = useMouseRotation(containerRef, 0.3);
  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
        position: "absolute",
        top: 0,
        left: 0,
        margin: 0,
        padding: 0,
      }}
    >
      <div
        style={{
          height: "100%",
          width: "100%",
          background: BACKGROUND_COLOR_CSS,
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 5], fov: 20 }}
          dpr={[1, 1.5]} // Limit DPR for performance
          performance={{ min: 0.5 }} // Performance optimization
        >
          <Suspense fallback={null}>
            <AsciiModelScene
              modelPath={models[0].modelPath}
              applyColorTexture={models[0].applyColorTexture}
              patternTexture={patternOptions[3].path}
              animate={true}
              mouseRotationX={rotationX}
              mouseRotationY={rotationY}
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}

export default App;
