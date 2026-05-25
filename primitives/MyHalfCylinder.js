import { CGFobject } from '../../lib/CGF.js';

/**
 * MyHalfCylinder
 * A half-cylinder with its curved surface facing the positive Z axis.
 * Base is centered at the origin on y=0, and the top is at y=1.
 * * @constructor
 * @param {CGFscene} scene - Reference to MyScene object
 * @param {number} slices - Number of divisions around the half-circle
 */
export class MyHalfCylinder extends CGFobject {
    constructor(scene, slices = 16) {
        super(scene);
        this.slices = slices;
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        const radius = 0.5;
        const height = 1.0;
        
        // A full circle is 2*PI, a half-circle is just PI
        const deltaAngle = Math.PI / this.slices;

        // --- 1. Curved Front Surface ---
        for (let i = 0; i <= this.slices; i++) {
            const angle = i * deltaAngle;
            
            // Calculate coordinates along the curve
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            // The normal vector for a cylinder shell points outward from the center (0,y,0)
            const normalX = Math.cos(angle);
            const normalZ = Math.sin(angle);

            // Texture U coordinate goes from 0 to 1 along the curve
            const u = i / this.slices;

            // Bottom vertex (y = 0)
            this.vertices.push(x, 0, z);
            this.normals.push(normalX, 0, normalZ);
            this.texCoords.push(u, 1);

            // Top vertex (y = height)
            this.vertices.push(x, height, z);
            this.normals.push(normalX, 0, normalZ);
            this.texCoords.push(u, 0);
        }

        // Generate indices for the curved triangles
        for (let i = 0; i < this.slices; i++) {
            const base = i * 2;
            
            // Counter-clockwise winding for the two triangles making up one "slice"
            this.indices.push(base, base + 2, base + 1);
            this.indices.push(base + 2, base + 3, base + 1);
        }

        // --- 2. Flat Back Surface ---
        // This closes the gap at Z=0.
        const backBaseIdx = this.vertices.length / 3;

        this.vertices.push(
             0.5, 0,      0,   // Bottom-Right
             0.5, height, 0,   // Top-Right
            -0.5, 0,      0,   // Bottom-Left
            -0.5, height, 0    // Top-Left
        );


        this.texCoords.push(
            0, 1,
            0, 0,
            1, 1,
            1, 0
        );

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}