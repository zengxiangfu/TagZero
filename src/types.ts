export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LabelItem {
  id: string;
  name: string;
  value?: string;
  color: string;
}

export interface LabelSet {
  id: string;
  name: string;
  presetImage?: string;
  labels: LabelItem[];
}

export type ShapeType = 'rect' | 'circle' | 'triangle' | 'polygon';

export interface Annotation {
  id: string;
  labelId: string; // Reference to LabelItem.id
  type: ShapeType;
  rect?: Rect;     // For rect
  points?: number[]; // For polygon, triangle
  radius?: number; // For circle
  color: string;
}

export interface ImageFile {
  id: string;
  name: string;
  url: string;
  file?: File;
  annotations: Annotation[];
}
