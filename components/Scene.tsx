// components/Scene.tsx
"use client"

import { Suspense, useEffect, useState, useCallback,useRef } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, Environment, OrthographicCamera } from "@react-three/drei"
import * as THREE from "three"
import Model from "./Model"
import { loadAllModels, saveModel } from "@/lib/modelService"
import { AppState, ModelId, ModelState } from "@/types"
import "./scene.css"

function CameraController({is2D}: {is2D: boolean}) {
  const {camera} = useThree();

  useEffect(() => {
    if(is2D) {
      // 2D: kamera ide visoko iznad scene i gleda ravno prema dolje
      // Y=40 daje dovoljno prostora da se vidi cijela scena
      // fov=30 je umjeren zoom – nije ni preblizu ni predaleko
      camera.position.set(0, 30, 0);
      camera.lookAt(0, 0, 0);

      if(camera instanceof THREE.PerspectiveCamera) {
        camera.fov = 20
        camera.updateProjectionMatrix()
      }
    } else {
      // 3D: vrati kameru na originalnu poziciju
      camera.position.set(0, 5, 10);
      camera.lookAt(0, 0, 0);

      if(camera instanceof THREE.PerspectiveCamera) {
        camera.fov = 60
        camera.updateProjectionMatrix()
      }
    }
  }, [is2D, camera])

  return null
}

export default function Scene() {
  const [modelStates, setModelStates] = useState<AppState | null>(null)
  const [selectedModelId, setSelectedModelId] = useState<ModelId | null>(null)
  // orbitEnabled kontroliše da li OrbitControls (rotacija kamere) je aktivan
  // Kad korisnik draga model, trebamo ISKLJUČITI rotaciju kamere
  // Inače bi se kamera i model pomjerali istovremeno
  const [orbitEnabled, setOrbitEnabled] = useState(true)
  const [is2D, setIs2D] = useState(false);
  const[rotations, setRotations] = useState<{model_1: number, model_2: number} | null>(null)

  useEffect(() => {
    loadAllModels().then((data) => {
      setModelStates(data)

    // Učitaj rotacije iz Firestorea i pretvori radijane u stepene
    // radToDeg jer slider prikazuje stepene (0-360), a Firestore čuva radijane
    setRotations({
      model_1: THREE.MathUtils.radToDeg(data.model_1.rotation.y),
      model_2: THREE.MathUtils.radToDeg(data.model_2.rotation.y)
    })
    })
  }, [])

  // useCallback memorizuje funkciju da se ne kreira nova na svakom renderu
  // Poziva se iz Model komponente kad se drag završi
  const handleDragEnd = useCallback(async (modelId: ModelId, newState: ModelState) => {
    // Ažuriraj lokalni React state s novom pozicijom/rotacijom
    setModelStates(prev => {
      // prev je prethodni state
      // Uvijek vraćaj novi objekt (immutability)
      if (!prev) return prev
      return {
        ...prev,          // kopiraj sve iz prethodnog statea
        [modelId]: newState  // prepiši samo promijenjeni model
      }
    })

    // Spremi u Firestore asinhrono
    // Ne čekamo (nema await ovdje u callbacku) da UI ostane responzivan
    await saveModel(modelId, newState)
  }, [])

  const handleSelect = useCallback((modelId: ModelId) => {
  // Ako klikneš na već selektovani model – deselektuj ga
  // Inače – selektuj novi
  setSelectedModelId(prev => prev === modelId ? null : modelId)
  }, []);

    // Poziva se dok korisnik pomjera slider – samo vizualni update
  const handleRotationChange = useCallback((modelId: ModelId, degrees: number) => {
  setRotations(prev => ({
    model_1: prev?.model_1 ?? 0,
    model_2: prev?.model_2 ?? 0,
    [modelId]: degrees
  }))
}, []);

    // Poziva se kad korisnik pusti slider – spremi u Firestore
  const handleRotationEnd = useCallback(async (modelId: ModelId, degrees: number) => {
  setRotations(prev => ({
    model_1: prev?.model_1 ?? 0,
    model_2: prev?.model_2 ?? 0,
    [modelId]: degrees
  }))

    if (!modelStates) return
    const currentState = modelStates[modelId]
    const newState: ModelState = {
      ...currentState,
      rotation: {
        ...currentState.rotation,
        y: THREE.MathUtils.degToRad(degrees)
      }
    }
    // Ažuriraj lokalni state
    setModelStates(prev => {
      if (!prev) return prev
      return { ...prev, [modelId]: newState }
    })
    // Spremi u Firestore
    await saveModel(modelId, newState)
  }, [modelStates])

  if (!modelStates || !rotations) {
    return (
      <div className="loading-screen">
      <div className="loading-spinner" />
      <div className="loading-text">
        Učitavam modele
          <span className="loading-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
      </div>
    )
  }

  return (
  <div className="scene-wrapper">

    {/* 2D/3D Toggle */}
    <div className="toggle-wrapper">
      <div className="toggle-container">
        <button
          className={`toggle-btn ${!is2D ? "active" : ""}`}
          onClick={() => setIs2D(false)}
        >
          3D
        </button>
        <button
          className={`toggle-btn ${is2D ? "active" : ""}`}
          onClick={() => setIs2D(true)}
        >
          2D
        </button>
      </div>
    </div>

    {/* Rotation panel */}
    {selectedModelId && (
      <div className="rotation-panel">
        <div className="rotation-panel-header">
          <span className="rotation-panel-title">
            {selectedModelId === "model_1" ? "Model 1" : "Model 2"}
          </span>
          <button
            className="rotation-panel-close"
            onClick={() => setSelectedModelId(null)}
          >
            ×
          </button>
        </div>

        <div className="rotation-label-row">
          <span className="rotation-label">Rotacija Y osi</span>
          <span className="rotation-value">
            {Math.round(rotations[selectedModelId])}°
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="360"
          step="1"
          value={rotations[selectedModelId]}
          className="rotation-slider"
          onChange={(e) => handleRotationChange(selectedModelId, Number(e.target.value))}
          onMouseUp={(e) => handleRotationEnd(selectedModelId, Number((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => handleRotationEnd(selectedModelId, Number((e.target as HTMLInputElement).value))}
        />
        <div className="rotation-slider-labels">
          <span>0°</span>
          <span>360°</span>
        </div>

        <div className="rotation-buttons">
          <button
            className="rotation-btn"
            onClick={() => {
              const newVal = (rotations[selectedModelId] - 90 + 360) % 360
              handleRotationChange(selectedModelId, newVal)
              handleRotationEnd(selectedModelId, newVal)
            }}
          >
            ↺ -90°
          </button>
          <button
            className="rotation-btn"
            onClick={() => {
              const newVal = (rotations[selectedModelId] + 90) % 360
              handleRotationChange(selectedModelId, newVal)
              handleRotationEnd(selectedModelId, newVal)
            }}
          >
            ↻ +90°
          </button>
        </div>
      </div>
    )}

        {/* Hints – različite upute za 2D i 3D mod */}
    <div className="hints-wrapper">
      {!is2D ? (
        // 3D mod hints
        <>
          <div className="hint-item">
            <span className="hint-icon">🖱️</span>
            <span className="hint-text">Lijevi klik + drag – rotiraj kameru</span>
          </div>
          <div className="hint-item">
            <span className="hint-icon">✋</span>
            <span className="hint-text">Klikni na model – pomjeri ga</span>
          </div>
          <div className="hint-item">
            <span className="hint-icon">🔄</span>
            <span className="hint-text">Klikni na model – otvori rotaciju</span>
          </div>
          <div className="hint-item">
            <span className="hint-icon">🔍</span>
            <span className="hint-text">Scroll – zoom</span>
          </div>
        </>
      ) : (
        // 2D mod hints
        <>
          <div className="hint-item">
            <span className="hint-icon">🖱️</span>
            <span className="hint-text">Desni klik + drag – pomjeri kameru</span>
          </div>
          <div className="hint-item">
            <span className="hint-icon">✋</span>
            <span className="hint-text">Klikni na model – pomjeri ga</span>
          </div>
          <div className="hint-item">
            <span className="hint-icon">🔍</span>
            <span className="hint-text">Scroll – zoom</span>
          </div>
        </>
      )}
    </div>

    <Canvas camera={{ position: [0, 5, 10], fov: 60 }} shadows>
      <Suspense fallback={null}>
        <CameraController is2D={is2D} />
        <ambientLight intensity={2} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <directionalLight position={[-10, 5, -5]} intensity={1.5} />
        <hemisphereLight args={["#ffffff", "#888888", 1.6]} />

        <Model
          modelId="model_1"
          path="/models/model1.glb"
          state={modelStates.model_1}
          targetSize={1.5}
          otherModelPosition={new THREE.Vector3(
            modelStates.model_2.position.x,
            modelStates.model_2.position.y,
            modelStates.model_2.position.z
          )}
          onDragEnd={handleDragEnd}
          isSelected={selectedModelId === "model_1"}
          onSelect={handleSelect}
          rotationY={rotations.model_1}
          onRotationChange={handleRotationChange}
          onRotationEnd={handleRotationEnd}
          onDragStateChange={(dragging) => setOrbitEnabled(!dragging)}
        />

        <Model
          modelId="model_2"
          path="/models/model2.glb"
          state={modelStates.model_2}
          targetSize={1.7}
          otherModelPosition={new THREE.Vector3(
            modelStates.model_1.position.x,
            modelStates.model_1.position.y,
            modelStates.model_1.position.z
          )}
          onDragEnd={handleDragEnd}
          isSelected={selectedModelId === "model_2"}
          onSelect={handleSelect}
          rotationY={rotations.model_2}
          onRotationChange={handleRotationChange}
          onRotationEnd={handleRotationEnd}
          onDragStateChange={(dragging) => setOrbitEnabled(!dragging)}
        />

        <gridHelper args={[20, 20]} />
        <OrbitControls enabled={orbitEnabled} enableRotate={!is2D}  enablePan={true} screenSpacePanning={true}/>
      </Suspense>
    </Canvas>
  </div>

 )
}