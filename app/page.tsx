"use client"

import { useEffect, useState } from "react";
import { loadAllModels } from "@/lib/modelService";
import dynamic from "next/dynamic";

export default function Home() {
  const [status, setStatus] = useState<string>("Loading...");
  const Scene = dynamic(() => import("@/components/Scene"), {ssr: false})

  useEffect (() => {
    loadAllModels()
    .then((models) => {
      setStatus("Firebase works! Data: " + JSON.stringify(models, null, 2))
    })
    .catch ((error) => {
      setStatus("Error: " + error.message)
    })
  }, [])

  return(
    <main>
      <Scene />
    </main>
  )
}