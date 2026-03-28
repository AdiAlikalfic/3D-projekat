import { db } from "./firebase";
import {doc, getDoc, setDoc, updateDoc} from "firebase/firestore";
import {ModelState, ModelId} from "@/types";

const DEFAULT_STATES: Record<ModelId, ModelState> = {
    model_1: {
        position: { x: -2, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
    },
    model_2: {
        position: { x: 2, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
    }
}

export async function loadModel(modelId: ModelId): Promise<ModelState> {
    const docRef = doc(db, "models", modelId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data() as ModelState
    } else {
        await setDoc(docRef, DEFAULT_STATES[modelId])
        return DEFAULT_STATES[modelId]
    }
}

export async function loadAllModels(): Promise<Record<ModelId, ModelState>> {
    const [model1, model2] = await Promise.all([
        loadModel("model_1"),
        loadModel("model_2")
    ])

    return {model_1: model1, model_2: model2}
}

export async function saveModel(modelId: ModelId, state: ModelState): Promise<void> {
    const docRef = doc(db, "models", modelId)

    await updateDoc(docRef, {
        position: state.position,
        rotation: state.rotation
    })
}