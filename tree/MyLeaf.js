import {CGFobject} from '../lib/CGF.js';

/**
* MyLeaf
* @constructor
* @param scene - MyLeaf reference
* @param scale - scale of the leaf
*/

export class MyLeaf extends CGFobject {
	constructor(scene, scale) {
		super(scene);
		this.scale = scale;

		this.r = 0.1 + Math.random() * 0.4;
		this.g = 0.5 + Math.random() * 0.5;
		this.b = 0.1 + Math.random() * 0.3;

		this.initBuffers();
	}

	setDefaultAppearance() {
		this.scene.setAmbient(this.r, this.g, this.b, 1.0);
		this.scene.setDiffuse(this.r, this.g, this.b, 1.0);
	    this.scene.setSpecular(0.1, 0.2, 0.1, 1.0); 
        this.scene.setShininess(10.0);
	}

	initBuffers() {
		var i;

		this.vertices = [
			0, 0, 0, 
			0.5, 0.35, 0,
			0, 1, 0,
			-0.5, 0.35, 0
		];

		this.indices = [];
		this.normals = [];
		for (i=0; i<this.vertices.length/3; ++i){
			this.vertices[i] = this.vertices[i] * this.scale;
			this.indices.push(i);
			this.normals.push(0, 0, 1);
		}

		this.primitiveType = this.scene.gl.TRIANGLE_FAN;
		this.initGLBuffers();
	}
}
