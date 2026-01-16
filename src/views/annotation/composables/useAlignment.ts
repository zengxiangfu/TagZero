import { ref } from 'vue';
import Konva from 'konva';

export interface AlignmentLine {
    points: number[];
    stroke: string;
    dash?: number[];
    strokeWidth?: number;
}

export function useAlignment() {
    const alignmentLines = ref<AlignmentLine[]>([]);

    const clearLines = () => {
        alignmentLines.value = [];
    };

    // Helper to get vertical/horizontal guides from a node's bounding box
    const getNodeGuides = (node: Konva.Node, relativeTo: Konva.Container) => {
        // Use getClientRect to get absolute-like coords relative to the group
        // This handles x/y + width/height automatically
        const box = node.getClientRect({ relativeTo });
        
        return {
            vertical: [
                Math.round(box.x), 
                Math.round(box.x + box.width / 2), 
                Math.round(box.x + box.width)
            ],
            horizontal: [
                Math.round(box.y), 
                Math.round(box.y + box.height / 2), 
                Math.round(box.y + box.height)
            ]
        };
    };

    // Helper to get "stops" for the active object (edges/center we want to snap)
    const getObjectSnappingEdges = (node: Konva.Node, relativeTo: Konva.Container) => {
        const box = node.getClientRect({ relativeTo });
        const absPos = node.absolutePosition(); 
        // We use relativeTo (Group) coords.
        // node.x() is relative to Group.
        
        return {
            vertical: [
                { guide: Math.round(box.x), offset: Math.round(box.x - node.x()), snap: 'start' },
                { guide: Math.round(box.x + box.width / 2), offset: Math.round(box.x + box.width / 2 - node.x()), snap: 'center' },
                { guide: Math.round(box.x + box.width), offset: Math.round(box.x + box.width - node.x()), snap: 'end' },
            ],
            horizontal: [
                { guide: Math.round(box.y), offset: Math.round(box.y - node.y()), snap: 'start' },
                { guide: Math.round(box.y + box.height / 2), offset: Math.round(box.y + box.height / 2 - node.y()), snap: 'center' },
                { guide: Math.round(box.y + box.height), offset: Math.round(box.y + box.height - node.y()), snap: 'end' },
            ]
        };
    };

    const drawGuides = (guides: { minV: any, minH: any }, scale: number) => {
        const lines: AlignmentLine[] = [];
        const size = 100000; // Large enough to cover canvas

        if (guides.minV) {
            lines.push({
                points: [guides.minV.lineGuide, -size, guides.minV.lineGuide, size],
                stroke: 'rgb(0, 161, 255)',
                dash: [4, 6],
                strokeWidth: 1 / scale
            });
        }
        if (guides.minH) {
            lines.push({
                points: [-size, guides.minH.lineGuide, size, guides.minH.lineGuide],
                stroke: 'rgb(0, 161, 255)',
                dash: [4, 6],
                strokeWidth: 1 / scale
            });
        }
        alignmentLines.value = lines;
    };

    const snapNode = (e: any, scale = 1) => {
        const node = e.target as Konva.Node;
        const parent = node.getParent();
        if (!parent) return;

        // 1. Gather guides from all other nodes (siblings)
        const guideMapV = new Set<number>();
        const guideMapH = new Set<number>();

        parent.getChildren().forEach((child: Konva.Node) => {
            // Skip self
            if (child === node) return;
            // Skip non-annotation shapes (e.g., selection anchors, image)
            // We assume annotations have a name set (the ID)
            // Anchors usually don't have a name set in this specific app (based on snippet)
            if (!child.name() || child.name() === 'image') return;
            
            const guides = getNodeGuides(child, parent);
            guides.vertical.forEach(g => guideMapV.add(g));
            guides.horizontal.forEach(g => guideMapH.add(g));
        });

        // 2. Get active node edges
        const edges = getObjectSnappingEdges(node, parent);

        // 3. Find closest snap
        const threshold = 10 / scale;
        let minV: any = null;
        let minH: any = null;

        // Check Vertical
        edges.vertical.forEach(edge => {
            guideMapV.forEach(guide => {
                const diff = Math.abs(guide - edge.guide);
                if (diff < threshold) {
                    if (!minV || diff < minV.diff) {
                        minV = { lineGuide: guide, diff, offset: edge.offset, snap: edge.snap };
                    }
                }
            });
        });

        // Check Horizontal
        edges.horizontal.forEach(edge => {
            guideMapH.forEach(guide => {
                const diff = Math.abs(guide - edge.guide);
                if (diff < threshold) {
                    if (!minH || diff < minH.diff) {
                        minH = { lineGuide: guide, diff, offset: edge.offset, snap: edge.snap };
                    }
                }
            });
        });

        // 4. Apply snap
        if (minV) {
            node.x(minV.lineGuide - minV.offset);
        }
        if (minH) {
            node.y(minH.lineGuide - minH.offset);
        }

        // 5. Draw
        drawGuides({ minV, minH }, scale);
    };
    
    // For Anchor Snapping (Vertices)
    // currentShapeId is used to ignore the shape being edited (optional, but good practice)
    const snapPoint = (pos: {x: number, y: number}, parent: Konva.Container, currentShapeId: string, scale = 1) => {
        const guideMapV = new Set<number>();
        const guideMapH = new Set<number>();

        parent.getChildren().forEach((child: Konva.Node) => {
            // Skip the shape we are editing
            if (child.name() === currentShapeId) return;
            // Skip other things
            if (!child.name() || child.name() === 'image') return;

            const guides = getNodeGuides(child, parent);
            guides.vertical.forEach(g => guideMapV.add(g));
            guides.horizontal.forEach(g => guideMapH.add(g));
        });

        const threshold = 10 / scale;
        let minV: any = null;
        let minH: any = null;
        let snappedX = pos.x;
        let snappedY = pos.y;

        // Check Vertical (Point X vs Guides)
        guideMapV.forEach(guide => {
            const diff = Math.abs(guide - pos.x);
            if (diff < threshold) {
                if (!minV || diff < minV.diff) {
                    minV = { lineGuide: guide, diff };
                }
            }
        });

        // Check Horizontal (Point Y vs Guides)
        guideMapH.forEach(guide => {
            const diff = Math.abs(guide - pos.y);
            if (diff < threshold) {
                if (!minH || diff < minH.diff) {
                    minH = { lineGuide: guide, diff };
                }
            }
        });

        if (minV) snappedX = minV.lineGuide;
        if (minH) snappedY = minH.lineGuide;

        drawGuides({ minV, minH }, scale);

        return { x: snappedX, y: snappedY };
    };

    return {
        alignmentLines,
        snapNode,
        snapPoint,
        clearLines
    };
}
