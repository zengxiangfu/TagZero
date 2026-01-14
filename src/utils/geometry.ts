import type { Point, Rect, Annotation } from '../types';

export function createAnnotation(
  x: number,
  y: number,
  width: number,
  height: number,
  labelId: string
): Annotation {
  return {
    id: crypto.randomUUID(),
    labelId,
    type: 'rect',
    rect: { x, y, width, height },
    color: '#' + Math.floor(Math.random()*16777215).toString(16).padEnd(6, '0') // Random hex color
  };
}

export function isPointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}
