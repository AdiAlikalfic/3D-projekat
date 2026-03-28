//Pozicija u 3D prostoru -tri koordinate
//x = lijevo/desno, y = gore/dolje, z = naprijed/nazad
export interface Position {
    x: number
    y: number
    z: number
}

//Rotacija u 3D prostoru - ugao za svaku osu
//Vrijednosti su u radijanima (0 do 2*PI = 0° do 360°)
export interface Rotation {
    x: number
    y: number
    z: number
}

//Kompletan state jednog modela
export interface ModelState {
    position: Position
    rotation: Rotation
}

//State cijele aplikacije (oba modela zajedno)
export interface AppState {
    model_1: ModelState
    model_2: ModelState
}

//ID modela - može biti samo "model_1" ili "model_2"
export type ModelId = "model_1" | "model_2"