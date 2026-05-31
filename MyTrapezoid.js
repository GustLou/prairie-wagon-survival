import {CGFobject} from './lib/CGF.js';
export class MyTrapezoid extends CGFobject{
    /**
     * 
     * @param scene - Referende to CGFScene
     * @param width - The width of the base
     * @param height - The total height of the layer
     * @param taper - How much the top narrows! value of 1.0 is a triangle
     */
    constructor(scene, width = 1, height = 1, taper = 0.5) {
        super(scene);
        this.width = width;
        this.height = height;
        this.taper = taper; // Controls the top width relative to the base
        this.initBuffers();
    }

    initBuffers(){
        const w2 = this.width / 2;
        const topW2 = (this.width * (1 - this.taper)) / 2;

        this.vertices = [
            -w2,0,0, // 0
            0,0,0, // 1
            w2,0,0, // 2
            topW2,this.height,0, // 3
            -topW2,this.height,0 // 4
        ];

        this.indices = [
            0,1,4,
            1,3,4,
            1,2,3
        ];

        this.normals = [
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1
        ];

        this.texCoords = [
            0,1,
            0.5,1,
            1,1,
            0.75,0,
            0.25,0,
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}