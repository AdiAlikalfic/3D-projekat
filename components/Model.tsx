"use client"

import { useRef, useEffect, useState } from "react"
import { useGLTF, Html } from "@react-three/drei"
import { useThree, ThreeEvent } from "@react-three/fiber"
import * as THREE from "three"
import { ModelState, ModelId } from "@/types"

interface ModelProps {
  modelId: ModelId         
  path: string              
  state: ModelState         
  targetSize?: number       
  otherModelPosition: THREE.Vector3 
  onDragEnd: (modelId: ModelId, newState: ModelState) => void  
  isSelected: boolean
  onSelect: (id: ModelId) => void
  rotationY: number
  onRotationChange: (id: ModelId, degrees: number) => void
  onRotationEnd: (id: ModelId, degrees: number) => void
  onDragStateChange: (isDragging: boolean) => void
}

export default function Model({ 
  modelId, 
  path, 
  state, 
  targetSize = 1,
  otherModelPosition,
  onDragEnd,
  isSelected,
  onSelect,
  rotationY,
  onRotationChange,
  onRotationEnd,
  onDragStateChange
}: ModelProps) {
  const ref = useRef<THREE.Group>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { camera, gl } = useThree()
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  const raycaster = useRef(new THREE.Raycaster())
  const intersectPoint = useRef(new THREE.Vector3())
  const dragOffset = useRef(new THREE.Vector3())
  const isDraggingRef = useRef(false);
  const otherModelPositionRef = useRef(otherModelPosition);

  useEffect(() => {
    otherModelPositionRef.current = otherModelPosition
  }, [otherModelPosition]);

  useEffect(() => {
    if (!ref.current) return
    const box = new THREE.Box3().setFromObject(ref.current)
    const size = new THREE.Vector3()
    box.getSize(size)
    const scaleFactor = targetSize / size.y
    ref.current.scale.set(scaleFactor, scaleFactor, scaleFactor)
  }, [targetSize])

  useEffect(() => {
    const onCanvasPointerMove = (e: PointerEvent) => {
      if(!isDraggingRef.current || !ref.current) return

      const rect = gl.domElement.getBoundingClientRect();

      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      )

      raycaster.current.setFromCamera(mouse, camera);

      raycaster.current.ray.intersectPlane(
        dragPlane.current,
        intersectPoint.current
      )

      const newPosition = intersectPoint.current.clone().add(dragOffset.current)

      const distance = newPosition.distanceTo(otherModelPositionRef.current)
      if(distance < 1.5) return
      ref.current.position.set(newPosition.x, 0, newPosition.z)
    }

    const onCanvasPointerUp = (e: PointerEvent) => {
      if(!isDraggingRef.current || !ref.current) return

      isDraggingRef.current = false
      setIsDragging(false)
      document.body.style.cursor = "auto"
      onDragStateChange(false);

      const finalPosition = ref.current.position
      onDragEnd(modelId, {
        position: { x: finalPosition.x, y: finalPosition.y, z: finalPosition.z },
        rotation: {
          x: state.rotation.x,
          y: THREE.MathUtils.degToRad(rotationY),
          z: state.rotation.z
        }
      })
    }

    // Dodajemo listenere na gl.domElement (canvas element)
    // Ne na model, ne na window – na sam canvas
    gl.domElement.addEventListener("pointermove", onCanvasPointerMove)
    gl.domElement.addEventListener("pointerup", onCanvasPointerUp)

    // Cleanup funkcija – uklanja listenere kad se komponenta unmountuje
    // Ili kad se dependencies promijene
    // Bez ovoga bi se listeneri gomilali i stvarali memory leak
    return () => {
      gl.domElement.removeEventListener("pointermove", onCanvasPointerMove)
      gl.domElement.removeEventListener("pointerup", onCanvasPointerUp)
    }
  }, [camera, gl, modelId, onDragEnd, rotationY, state.rotation])

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    setIsDragging(false);
    document.body.style.cursor = "grabbing"
    onSelect(modelId);
    onDragStateChange(true);

    const rect = gl.domElement.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    )

    raycaster.current.setFromCamera(e.pointer, camera)
    raycaster.current.ray.intersectPlane(dragPlane.current, intersectPoint.current)

    if (ref.current) {
      dragOffset.current.subVectors(
        ref.current.position,  
        intersectPoint.current 
      )
    }
  }

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !ref.current) return
    raycaster.current.setFromCamera(e.pointer, camera)
    raycaster.current.ray.intersectPlane(dragPlane.current, intersectPoint.current)
    const newPosition = intersectPoint.current.clone().add(dragOffset.current)
    const distance = newPosition.distanceTo(otherModelPosition)
    if (distance < 3) return
    ref.current.position.set(newPosition.x, 0, newPosition.z)
  }

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !ref.current) return

    setIsDragging(false)

    const finalPosition = ref.current.position

    // Pozivamo callback koji smo dobili kao prop iz Scene.tsx
    // Šaljemo novi state (pozicija + rotacija) gore u parent komponentu
    // Parent će ovo sačuvati u Firestore
    onDragEnd(modelId, {
      position: {
        x: finalPosition.x,
        y: finalPosition.y,
        z: finalPosition.z
      },
      rotation: {
        x: state.rotation.x,
        // Pretvaramo stepene iz slidera nazad u radijane za čuvanje
        y: THREE.MathUtils.degToRad(rotationY),
        z: state.rotation.z
      }
    })
  }

  // Funkcija koja se poziva kad se slider za rotaciju pomjeri
  const handleRotationChange = (degrees: number) => {
    onRotationChange(modelId, degrees)
    // Ako model postoji u sceni, odmah primijeni rotaciju vizualno
    if (ref.current) {
      // degToRad pretvara stepene u radijane jer Three.js koristi radijane
      // 180° = Math.PI radijana, 360° = 2*Math.PI radijana
      ref.current.rotation.y = THREE.MathUtils.degToRad(degrees)
    }
  }

  // Funkcija koja se poziva kad korisnik OTPUSTI slider
  // Tek tada šaljemo promjenu u Firestore (ne na svaki pomak slidera)
  const handleRotationEnd = (degrees: number) => {
    onRotationEnd(modelId, degrees)
  }

  return (
    <group
      ref={ref}
      position={[state.position.x, state.position.y, state.position.z]}
      rotation={[state.rotation.x, THREE.MathUtils.degToRad(rotationY), state.rotation.z]}
      onPointerDown={handlePointerDown}
      // Kad je iznad modela kursor postaje "grab" (ruka zatvorena)
      // Kad vučeš postaje "grabbing" (ruka otvorena)
      onPointerOver={() => {
      if (!isDraggingRef.current) document.body.style.cursor = "grab"
    }}
    onPointerOut={() => {
      if (!isDraggingRef.current) document.body.style.cursor = "auto"
    }}
    >
      <primitive object={useGLTF(path).scene.clone()} />
      <Html
      center
      distanceFactor={8}
      position={[0, targetSize + 0.3, 0]}
      occlude
    >
        <div className={`model-tooltip ${isSelected ? "selected" : ""}`}>
          <div className="model-tooltip-dot" />
          <span className="model-tooltip-label">
            {modelId === "model_1" ? "Model 1" : "Model 2"}
          </span>
        </div>
      </Html>
    </group>
  )
}

useGLTF.preload("/models/model1.glb")
useGLTF.preload("/models/model2.glb")