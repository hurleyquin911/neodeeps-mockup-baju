export type GarmentType = "tshirt" | "longsleeve" | "hoodie" | "tank";
export type SizeCode = "S" | "M" | "L" | "XL" | "XXL" | "3XL";
export type PrintView = "front" | "back" | "sleeveLeft" | "sleeveRight";
export type Unit = "cm" | "in";

export type Tool =
  | "select"
  | "pan"
  | "text"
  | "image"
  | "shape"
  | "draw"
  | "eraser"
  | "pen"
  | "eyedropper"
  | "crop"
  | "zoom";

export type ShapeKind =
  | "rect"
  | "roundRect"
  | "ellipse"
  | "circle"
  | "triangle"
  | "star"
  | "line"
  | "arrow"
  | "polygon"
  | "heart"
  | "diamond";

export type BlendMode =
  | "source-over"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "soft-light"
  | "hard-light"
  | "difference"
  | "destination-out";

export type AlignDir =
  | "left"
  | "centerX"
  | "right"
  | "top"
  | "centerY"
  | "bottom";

export type ImageFilters = {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  grayscale: number;
  sepia: number;
  invert: number;
};

export type CanvasObject = {
  id: string;
  type: "text" | "image" | "shape" | "path" | "group";
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  blendMode: BlendMode;
  fill: string;
  stroke: string;
  strokeWidth: number;
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontBold?: boolean;
  fontItalic?: boolean;
  textAlign?: "left" | "center" | "right";
  textDecoration?: "" | "underline" | "line-through";
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: "none" | "uppercase" | "lowercase";
  curve?: number;
  src?: string;
  naturalWidth?: number;
  naturalHeight?: number;
  flipX?: boolean;
  flipY?: boolean;
  cropL?: number;
  cropT?: number;
  cropR?: number;
  cropB?: number;
  filters?: ImageFilters;
  shape?: ShapeKind;
  cornerRadius?: number;
  sides?: number;
  pointerLength?: number;
  points?: number[];
  closed?: boolean;
  tension?: number;
  brushSize?: number;
  pathD?: string;
  viewBox?: number;
  children?: CanvasObject[];
};

export type Measurements = {
  chestFlat: number;
  length: number;
  shoulder: number;
  sleeveLength: number;
  sleeveOpening: number;
  neckWidth: number;
  neckDropFront: number;
  neckDropBack: number;
  armhole: number;
  hem: number;
};

export type PrintArea = {
  width: number;
  height: number;
  x: number;
  y: number;
};

export type GarmentLayout = {
  width: number;
  height: number;
  bodyTop: number;
  path: string;
  details: string;
  print: Record<PrintView, PrintArea>;
  body: PrintArea;
  sleeveBox: { left: PrintArea; right: PrintArea };
  measurements: Measurements;
};

export type BrushSettings = {
  size: number;
  color: string;
  opacity: number;
  tension: number;
};

export const DEFAULT_FILTERS: ImageFilters = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  invert: 0,
};

export function createBaseObject(
  patch: Partial<CanvasObject> & Pick<CanvasObject, "id" | "type" | "name">,
): CanvasObject {
  return {
    x: 4,
    y: 4,
    width: 10,
    height: 6,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    blendMode: "source-over",
    fill: "#111111",
    stroke: "transparent",
    strokeWidth: 0,
    shadowEnabled: false,
    shadowColor: "#000000",
    shadowBlur: 8,
    shadowOffsetX: 0,
    shadowOffsetY: 2,
    shadowOpacity: 0.35,
    ...patch,
  };
}
