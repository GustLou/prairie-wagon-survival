import {CGFobject} from '../../lib/CGF.js';

export class MyCylinder extends CGFobject {
    constructor(scene, slices, stacks, height) {
        super(scene);
        this.slices = slices || 8;
        this.stacks = stacks || 2;
        this.height = height || 1;
        this.initBuffers();
    }
    
    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = []; // Added to hold texture coordinates

        var alphaAng = 2 * Math.PI / this.slices;

        // Create vertices, normals, and texCoords
        for (var j = 0; j <= this.stacks; j++) {
            var z = (j / this.stacks) * this.height;
            var v = 1 - (j / this.stacks); // v ranges from 0 to 1 along the height

            // Notice: i <= this.slices to duplicate the seam vertices for texture wrapping
            for (var i = 0; i <= this.slices; i++) { 
                var ang = i * alphaAng;
                var sa = Math.sin(ang);
                var ca = Math.cos(ang);

                // Vertices
                this.vertices.push(ca, z, -sa);
                
                // Normals
                this.normals.push(ca, 0, -sa);

                // Texture Coordinates
                var u = i / this.slices; // u ranges from 0 to 1 around the circumference
                this.texCoords.push(u, v);
            }
        }

        // Create indices to draw the triangles
        for (var j = 0; j < this.stacks; j++) {
            for (var i = 0; i < this.slices; i++) {
                // We use (this.slices + 1) because of the duplicated seam vertex
                var v1 = j * (this.slices + 1) + i;
                var v2 = j * (this.slices + 1) + (i + 1);
                var v3 = (j + 1) * (this.slices + 1) + i;
                var v4 = (j + 1) * (this.slices + 1) + (i + 1);

                // Draw the two triangles that make up each rectangular segment
                this.indices.push(v1, v2, v4);
                this.indices.push(v1, v4, v3);
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    updateBuffers(complexity){
        this.slices = 3 + Math.round(9 * complexity);
        this.initBuffers();
        this.initNormalVizBuffers();
    }
}