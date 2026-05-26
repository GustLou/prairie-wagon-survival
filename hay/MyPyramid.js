import { CGFobject } from '../../lib/CGF.js';

/**
 * MyPyramid
 * A square-base pyramid with apex at y=1 and base centered at origin on y=0.
 * 
 * To use as a downward-pointing arrow (like the hay bale indicator),
 * rotate 180° around the X axis in the parent object's display().
 * 
 * @constructor
 * @param {CGFscene} scene - Reference to MyScene object
 */
export class MyPyramid extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }

    initBuffers() {
        // --- Base corner vertices (for reference) ---
        // v0 = (-0.5, 0, -0.5)  back-left
        // v1 = ( 0.5, 0, -0.5)  back-right
        // v2 = ( 0.5, 0,  0.5)  front-right
        // v3 = (-0.5, 0,  0.5)  front-left
        // v4 = ( 0,   1,  0  )  apex
        //
        // Vertices are duplicated per face so each face can have its own flat normal.

        this.vertices = [
            // Front face  (v3, v2, v4)
            -0.5, 0,  0.5,   //  0
             0.5, 0,  0.5,   //  1
             0,   1,  0,     //  2

            // Right face  (v2, v1, v4)
             0.5, 0,  0.5,   //  3
             0.5, 0, -0.5,   //  4
             0,   1,  0,     //  5

            // Back face   (v1, v0, v4)
             0.5, 0, -0.5,   //  6
            -0.5, 0, -0.5,   //  7
             0,   1,  0,     //  8

            // Left face   (v0, v3, v4)
            -0.5, 0, -0.5,   //  9
            -0.5, 0,  0.5,   // 10
             0,   1,  0,     // 11

            // Base (two triangles, normal pointing down)
            -0.5, 0, -0.5,   // 12
             0.5, 0, -0.5,   // 13
             0.5, 0,  0.5,   // 14
            -0.5, 0,  0.5,   // 15
        ];

        this.indices = [
            // Front
            0,  1,  2,
            // Right
            3,  4,  5,
            // Back
            6,  7,  8,
            // Left
            9,  10, 11,
            // Base (two triangles, wound CW from below so normal faces down)
            12, 14, 13,
            12, 15, 14,
        ];

        // Flat normals — computed as cross product of face edges, then normalised.
        // ||(0, 0.5, 1)|| = sqrt(1.25) ≈ 1.118  → scale = 1/1.118
        const s  =  1 / Math.sqrt(1.25); // ≈ 0.8944
        const sy =  0.5 * s;             // ≈ 0.4472

        this.normals = [
            // Front   (0, 0.5, 1) normalised
             0,  sy,  s,
             0,  sy,  s,
             0,  sy,  s,

            // Right   (1, 0.5, 0) normalised
             s,  sy,  0,
             s,  sy,  0,
             s,  sy,  0,

            // Back    (0, 0.5, -1) normalised
             0,  sy, -s,
             0,  sy, -s,
             0,  sy, -s,

            // Left    (-1, 0.5, 0) normalised
            -s,  sy,  0,
            -s,  sy,  0,
            -s,  sy,  0,

            // Base    pointing down
             0, -1,  0,
             0, -1,  0,
             0, -1,  0,
             0, -1,  0,
        ];

        // Texture coordinates
        this.texCoords = [
            // Front
            0.0, 1.0,
            1.0, 1.0,
            0.5, 0.0,

            // Right
            0.0, 1.0,
            1.0, 1.0,
            0.5, 0.0,

            // Back
            0.0, 1.0,
            1.0, 1.0,
            0.5, 0.0,

            // Left
            0.0, 1.0,
            1.0, 1.0,
            0.5, 0.0,

            // Base
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}