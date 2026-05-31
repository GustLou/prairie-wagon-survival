import { CGFobject } from './lib/CGF.js';

export class SkyBox extends CGFobject {
    constructor(scene, isHalf = false, inverted = true, slices = 18, stacks = 10) { // if the slices and/or stacks are too low, they may start clipping the clouds
        super(scene);
        this.slices = slices;
        this.stacks = stacks;
        this.inverted = inverted;
		this.isHalf = isHalf;
        this.initBuffers();
    }
    
    initBuffers() {
        this.vertices = [];
        this.normals = [];
        this.indices = [];
        this.texCoords = [];

        let radius = 1;

		let stackLimit = this.isHalf ? Math.ceil(this.stacks / 2) : this.stacks;

        for (let stack = 0; stack <= stackLimit; stack++) {
            let phi = (stack * Math.PI) / this.stacks;
            let sinPhi = Math.sin(phi);
            let cosPhi = Math.cos(phi);

            for (let slice = 0; slice <= this.slices; slice++) {
                let theta = (slice * 2 * Math.PI) / this.slices;
                let sinTheta = Math.sin(theta);
                let cosTheta = Math.cos(theta);

                let x = radius * sinPhi * cosTheta;
                let y = radius * cosPhi;
                let z = radius * sinPhi * sinTheta;

                this.vertices.push(x, y, z);

                let nx = this.inverted ? -x : x;
                let ny = this.inverted ? -y : y;
                let nz = this.inverted ? -z : z;
                this.normals.push(nx, ny, nz);

                this.texCoords.push(slice / this.slices, stack / this.stacks);
            }
        }

        for (let stack = 0; stack < stackLimit; stack++) {
            for (let slice = 0; slice < this.slices; slice++) {
                let v1 = stack * (this.slices + 1) + slice;
                let v2 = v1 + 1;
                let v3 = (stack + 1) * (this.slices + 1) + slice;
                let v4 = v3 + 1;

                if (this.inverted) {
                    this.indices.push(v1, v3, v2);
                    this.indices.push(v2, v3, v4);
                } else {
                    this.indices.push(v1, v2, v3);
                    this.indices.push(v2, v4, v3);
                }
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}