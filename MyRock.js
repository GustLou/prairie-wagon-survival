import { CGFobject, CGFappearance, CGFshader, CGFtexture } from '../lib/CGF.js';

export class MyRock extends CGFobject {
    constructor(scene, seed = 0.0, stacks = 32, slices = 24, roughness = 0.18,
                texturePath0 = null, texturePath1 = null) {
        super(scene);
        this.seed      = seed;
        this.stacks    = stacks;
        this.slices    = slices;
        this.roughness = roughness;

        this.initBuffers();
        this.initShader();
        this.initMaterial(texturePath0, texturePath1);
    }

    initBuffers() {
        this.vertices  = [];
        this.normals   = [];
        this.texCoords = [];
        this.indices   = [];

        for (let stack = 0; stack <= this.stacks; stack++) {
            const phi    = (stack / this.stacks) * Math.PI;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            for (let slice = 0; slice <= this.slices; slice++) {
                const theta = (slice / this.slices) * 2.0 * Math.PI;
                const x = Math.cos(theta) * sinPhi;
                const y = cosPhi;
                const z = Math.sin(theta) * sinPhi;

                this.vertices.push(x, y, z);
                this.normals.push(x, y, z);
                this.texCoords.push(slice / this.slices, stack / this.stacks);
            }
        }

        for (let stack = 0; stack < this.stacks; stack++) {
            for (let slice = 0; slice < this.slices; slice++) {
                const a = stack       * (this.slices + 1) + slice;
                const b = (stack + 1) * (this.slices + 1) + slice;
                this.indices.push(a, b, a + 1);
                this.indices.push(b, b + 1, a + 1);
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    initShader() {
        this.rockShader = new CGFshader(
            this.scene.gl,
            'shaders/rock.vert',
            'shaders/rock.frag'
        );
        this.rockShader.setUniformsValues({
            uSeed:      this.seed,
            uRoughness: this.roughness,
            uTexBlend:  0.0,
            uSampler0:  0,
            uSampler1:  1,
        });
    }

    initMaterial(texturePath0, texturePath1) {
        this.rockAppearance = new CGFappearance(this.scene);
        this.rockAppearance.setAmbient(0.3, 0.28, 0.25, 1.0);
        this.rockAppearance.setDiffuse(0.6, 0.55, 0.50, 1.0);
        this.rockAppearance.setSpecular(0.1, 0.10, 0.10, 1.0);
        this.rockAppearance.setShininess(8.0);

        this.tex0 = null;
        this.tex1 = null;

        if (texturePath0) {
            this.tex0 = new CGFtexture(this.scene, texturePath0);
            this.rockAppearance.setTexture(this.tex0);
            this.rockAppearance.setTextureWrap('REPEAT', 'REPEAT');
        }
        if (texturePath1) {
            this.tex1 = new CGFtexture(this.scene, texturePath1);
        }
    }

    display() {
        this.rockAppearance.apply();
        this.scene.setActiveShader(this.rockShader);
        this.rockShader.setUniformsValues({ uSeed: this.seed });

        if (this.tex1) {
            this.scene.gl.activeTexture(this.scene.gl.TEXTURE1);
            this.scene.gl.bindTexture(this.scene.gl.TEXTURE_2D, this.tex1.texture);
            this.scene.gl.activeTexture(this.scene.gl.TEXTURE0);
        }

        super.display();
        this.scene.setActiveShader(this.scene.defaultShader);
    }
}