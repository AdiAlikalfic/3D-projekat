import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "3D Model Viewer",
  description: "Upravljanje 3D modelima s Firebase Sinhronizacijom"
}

export default function Rootlayout({
  children,
}: {
  children: React.ReactNode
}) {
  return(
    <html lang="bs">
      <body>
        {children}
      </body>
    </html>
  )
}