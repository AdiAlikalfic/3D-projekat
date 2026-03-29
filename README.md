# 3D Model Viewer

A full-stack 3D web application built with Next.js, React Three Fiber, Three.js and Firebase Firestore.

## 🔗 Live Demo

[nelsonkb-3d.vercel.app](https://3-d-projekat.vercel.app/)

---

## ✨ Features

- 🧊 **Two interactive 3D GLB models** loaded and displayed in a real-time scene
- 🖱️ **Drag & Drop** – move models freely across the scene
- 🚧 **Collision detection** – models cannot overlap or occupy the same space
- 🔄 **Model rotation** – intuitive side panel with slider and ±90° quick buttons
- 📷 **2D / 3D view toggle** – switch between perspective and top-down orthographic camera
- 💾 **Firebase Firestore sync** – every position and rotation change is saved instantly
- 🔁 **Persistent state** – models return to their last saved position after page refresh
- 🌐 **No authentication required** – open to all users

---

## 🛠️ Tech Stack

| Technology             | Purpose                                    |
| ---------------------- | ------------------------------------------ |
| **Next.js 14**         | React framework, file-based routing, SSR   |
| **React Three Fiber**  | React renderer for Three.js                |
| **Three.js**           | 3D engine, raycasting, collision detection |
| **@react-three/drei**  | R3F helpers (OrbitControls, useGLTF, Html) |
| **Firebase Firestore** | NoSQL cloud database for state persistence |
| **TypeScript**         | Type safety across the entire codebase     |
| **Tailwind CSS**       | Utility-first styling                      |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project with Firestore enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/AdiAlikalfic/3D-projekat
cd 3d-projekat

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
moj-3d-projekat/
├── app/
│   ├── page.tsx          # Main entry point
│   ├── layout.tsx        # Root layout
│   └── scene.css         # Scene & UI styles
├── components/
│   ├── Scene.tsx          # 3D scene, camera, lighting, UI panels
│   └── Model.tsx          # Individual 3D model with drag & collision logic
├── lib/
│   ├── firebase.ts        # Firebase initialization
│   └── modelService.ts    # Firestore read/write functions
├── types/
│   └── index.ts           # TypeScript interfaces
└── public/
    └── models/
        ├── model1.glb     # First 3D model
        └── model2.glb     # Second 3D model
```

---

## 🗄️ Database Structure

```
Firestore
└── models (collection)
    ├── model_1 (document)
    │   ├── position: { x, y, z }
    │   └── rotation: { x, y, z }
    └── model_2 (document)
        ├── position: { x, y, z }
        └── rotation: { x, y, z }
```

---

## 📝 Notes

- No login or authentication required – the app is open to all users
- No real-time database listener – data is read once on page load and written on each change
- Firestore is running in **test mode** (suitable for demo purposes)

---

## 📄 License

This project was built as part of a Full Stack Developer interview task.
