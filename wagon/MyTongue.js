import { CGFobject } from '../../lib/CGF.js';

export class MyTongue extends CGFobject {
    constructor(scene, w = 0.1, h = 0.1, l = 4.0) {
        super(scene);
        this.w = w;
        this.h = h;
        this.l = l;
        this.initBuffers();
    }

    initBuffers() {
        // Dimensions for the wagon tongue
        // const w = 0.1;
        // const h = 0.1;
        // const l = 4.0;
        const w = this.w;  // Half-width (X-axis)
        const h = this.h;  // Half-height (Y-axis)
        const l = this.l;  // Total length (Z-axis)

        // Notice that the Y-coordinates (-h and h) remain exactly the same 
        // at Z=0 and Z=l. This ensures the pole stays perfectly horizontal.
        this.vertices = [
            // Back face (Attached to the wagon, Z = 0)
            -w, -h, 0,
            -w,  h, 0,
             w,  h, 0,
             w, -h, 0,

            // Front face (The tip of the tongue, Z = l)
            -w, -h, l,
             w, -h, l,
             w,  h, l,
            -w,  h, l,

            // Top face (Looking down, Y = h)
            -w,  h, 0,
            -w,  h, l,
             w,  h, l,
             w,  h, 0,

            // Bottom face (Looking up, Y = -h)
            -w, -h, 0,
             w, -h, 0,
             w, -h, l,
            -w, -h, l,

            // Right face (Looking from the right, X = w)
             w, -h, 0,
             w,  h, 0,
             w,  h, l,
             w, -h, l,

            // Left face (Looking from the left, X = -w)
            -w, -h, 0,
            -w, -h, l,
            -w,  h, l,
            -w,  h, 0
        ];

        // Indices to form the triangles. Mapped counter-clockwise.
        this.indices = [
            0, 1, 2, 0, 2, 3,       // Back
            4, 5, 6, 4, 6, 7,       // Front
            8, 9, 10, 8, 10, 11,    // Top
            12, 13, 14, 12, 14, 15, // Bottom
            16, 17, 18, 16, 18, 19, // Right
            20, 21, 22, 20, 22, 23  // Left
        ];

        // Normals define how light hits the object. 
        // We use 4 identical normals per face for flat shading.
        this.normals = [
            0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1, // Back
            0, 0,  1,  0, 0,  1,  0, 0,  1,  0, 0,  1, // Front
            0, 1,  0,  0, 1,  0,  0, 1,  0,  0, 1,  0, // Top
            0,-1,  0,  0,-1,  0,  0,-1,  0,  0,-1,  0, // Bottom
            1, 0,  0,  1, 0,  0,  1, 0,  0,  1, 0,  0, // Right
           -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,  0  // Left
        ];

        // Standard 0-to-1 texture coordinates.
        this.texCoords = [
            0, 1,  0, 0,  1, 0,  1, 1, // Back
            0, 1,  1, 1,  1, 0,  0, 0, // Front
            0, 1,  0, 0,  1, 0,  1, 1, // Top
            0, 0,  1, 0,  1, 1,  0, 1, // Bottom
            0, 1,  0, 0,  1, 0,  1, 1, // Right
            1, 1,  0, 1,  0, 0,  1, 0  // Left
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}