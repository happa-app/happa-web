// Cuentas del recorte de la foto (cuadrado). Sin nada de React, para poder probarlas solas.
//
// El recorte se guarda como "dónde está su centro en la foto original" (cx, cy, en píxeles de la foto)
// y "cuánto se acerca" (zoom: 1 = el lado corto de la foto entero). Así no depende del tamaño en pantalla.

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;

export type Crop = { zoom: number; cx: number; cy: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// Lado del cuadrado recortado, en píxeles de la foto
export function cropSide(width: number, height: number, zoom: number): number {
  return Math.min(width, height) / zoom;
}

// Que el cuadrado no se salga de la foto
export function clampCrop(crop: Crop, width: number, height: number): Crop {
  const zoom = clamp(crop.zoom, MIN_ZOOM, MAX_ZOOM);
  const half = cropSide(width, height, zoom) / 2;
  return { zoom, cx: clamp(crop.cx, half, width - half), cy: clamp(crop.cy, half, height - half) };
}

// De partida: el cuadrado más grande, en el centro
export function initialCrop(width: number, height: number): Crop {
  return { zoom: MIN_ZOOM, cx: width / 2, cy: height / 2 };
}

// Arrastrar la foto (dx, dy en píxeles de pantalla; view = lado del cuadro en pantalla).
// Al arrastrar a la derecha, se ve más de la izquierda de la foto.
export function moveCrop(crop: Crop, width: number, height: number, dx: number, dy: number, view: number): Crop {
  const scale = view / cropSide(width, height, crop.zoom);
  return clampCrop({ ...crop, cx: crop.cx - dx / scale, cy: crop.cy - dy / scale }, width, height);
}

// Acercar o alejar sin mover el centro
export function zoomCrop(crop: Crop, width: number, height: number, zoom: number): Crop {
  return clampCrop({ ...crop, zoom }, width, height);
}

// Qué parte de la foto se recorta (para dibujarla en el lienzo)
export function sourceRect(crop: Crop, width: number, height: number): { x: number; y: number; side: number } {
  const side = cropSide(width, height, crop.zoom);
  return { x: crop.cx - side / 2, y: crop.cy - side / 2, side };
}

// Dónde se pinta la foto dentro del cuadro, en % del cuadro (no hace falta saber su tamaño en pantalla)
export function imageBox(crop: Crop, width: number, height: number): { left: number; top: number; width: number; height: number } {
  const side = cropSide(width, height, crop.zoom);
  return {
    width: (width / side) * 100,
    height: (height / side) * 100,
    left: 50 - (crop.cx / side) * 100,
    top: 50 - (crop.cy / side) * 100,
  };
}
