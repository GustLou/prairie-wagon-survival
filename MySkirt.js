import { CGFobject } from "../lib/CGF.js";

/**
 * MySkirt — flat annular apron drawn around the playable terrain tile.
 * Geometry sits in the XZ plane (Y=0); the vertex shader slopes it downward.
 *
 * @param {MyScene} scene
 * @param {number}  innerRadius - world-space inner edge (should match groundScale/2)
 * @param {number}  outerRadius - world-space outer edge (should reach the sky sphere)
 * @param {number}  nSegments   - angular subdivisions (64 is plenty)
 * @param {number}  nRings      - radial subdivisions (8 gives a smooth slope)
 */
export class MySkirt extends CGFobject {
    constructor(scene, innerRadius, outerRadius, nSegments = 64, nRings = 8) {
        super(scene);
        this.innerRadius = innerRadius;
        this.outerRadius = outerRadius;
        this.nSegments   = nSegments;
        this.nRings      = nRings;
        this.initBuffers();
    }

    initBuffers() {
        this.vertices  = [];
        this.normals   = [];
        this.texCoords = [];
        this.indices   = [];

        const { innerRadius: r0, outerRadius: r1, nSegments: nS, nRings: nR } = this;

        for (let ring = 0; ring <= nR; ring++) {
            const t   = ring / nR;                          // 0 inner → 1 outer
            const rad = r0 + t * (r1 - r0);

            for (let seg = 0; seg <= nS; seg++) {
                const angle = (seg / nS) * 2.0 * Math.PI;
                const x = Math.cos(angle) * rad;
                const z = Math.sin(angle) * rad;

                this.vertices.push(x, 0, z);
                this.normals.push(0, 1, 0);
                // s wraps angularly, t = radial distance (0→1) used by shader for fade
                this.texCoords.push(seg / nS, t);
            }
        }

        // Quad strip per ring band
        const stride = nS + 1;
        for (let ring = 0; ring < nR; ring++) {
            for (let seg = 0; seg < nS; seg++) {
                const a = ring * stride + seg;
                const b = a + 1;
                const c = a + stride;
                const d = c + 1;
                // Two triangles per quad
                this.indices.push(a, c, b);
                this.indices.push(b, c, d);
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}