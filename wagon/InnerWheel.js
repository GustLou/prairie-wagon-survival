import {CGFobject} from '../lib/CGF.js';

export class InnerWheel extends CGFobject {
    constructor(scene, slices) {
        super(scene);
        this.slices = slices || 8;
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        var alphaAng = 2 * Math.PI / this.slices;
        
        // Define how thick you want the rectangular sticks to be
        var stickWidth = 0.1; 
        var halfWidth = stickWidth / 2;

        // For each slice, generate a separate rectangle (4 vertices, 2 triangles)
        for (var i = 0; i < this.slices; i++) {
            var ang = i * alphaAng;
            var ca = Math.cos(ang);
            var sa = Math.sin(ang);

            // 1. The outward direction of the stick
            var dirX = ca;
            var dirY = sa;

            // 2. The perpendicular direction (used to give the stick its width)
            var perpX = -sa;
            var perpY = ca;

            // 3. Calculate the 4 corners of the rectangle
            // Inner right (Bottom-Left of the quad)
            var x0 = -perpX * halfWidth;
            var y0 = -perpY * halfWidth;
            
            // Outer right (Bottom-Right of the quad)
            var x1 = dirX  - perpX * halfWidth;
            var y1 = dirY  - perpY * halfWidth;
            
            // Inner left (Top-Left of the quad)
            var x2 = perpX * halfWidth;
            var y2 = perpY * halfWidth;
            
            // Outer left (Top-Right of the quad)
            var x3 = dirX  + perpX * halfWidth;
            var y3 = dirY  + perpY * halfWidth;

            // Base index for the current rectangle's vertices
            var baseIndex = i * 4;

            // Push the 4 vertices
            this.vertices.push(x0, y0, 0); // Vertex 0
            this.vertices.push(x1, y1, 0); // Vertex 1
            this.vertices.push(x2, y2, 0); // Vertex 2
            this.vertices.push(x3, y3, 0); // Vertex 3

            // Push normals (all facing outwards on the Z axis)
            this.normals.push(
                0, 0, 1,   
                0, 0, 1,   
                0, 0, 1,   
                0, 0, 1
            );

            // Push texture coordinates (Standard 0-1 mapping for a quad)
            this.texCoords.push(
                0, 1,  // Bottom-Left
                1, 1,  // Bottom-Right
                0, 0,  // Top-Left
                1, 0   // Top-Right
            );

            // 4. Draw the 2 triangles (Counter-Clockwise winding order)
            // First triangle: Bottom-Left, Bottom-Right, Top-Left
            this.indices.push(baseIndex + 0, baseIndex + 1, baseIndex + 2);
            
            // Second triangle: Top-Left, Bottom-Right, Top-Right
            this.indices.push(baseIndex + 2, baseIndex + 1, baseIndex + 3);
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}