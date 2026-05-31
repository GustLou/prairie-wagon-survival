import { CGFobject } from '../lib/CGF.js';

// ── 1. Sub-object for the Petals ──────────────────────────────────────────
class FlowerPetals extends CGFobject {
    constructor(scene, petals, petalLen, petalWidth, petalElevation) {
        super(scene);
        this.petals = petals;
        this.petalLen = petalLen;
        this.petalWidth = petalWidth;
        this.petalElevation = petalElevation;
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];

        const angleStep = (2 * Math.PI) / this.petals;

        for (let p = 0; p < this.petals; p++) {
            const baseAngle = p * angleStep;
            const base = this.vertices.length / 3;

            // 1. Calculate Base Points
            const lx = Math.cos(baseAngle - Math.PI / 2) * this.petalWidth;
            const lz = Math.sin(baseAngle - Math.PI / 2) * this.petalWidth;
            const rx = Math.cos(baseAngle + Math.PI / 2) * this.petalWidth;
            const rz = Math.sin(baseAngle + Math.PI / 2) * this.petalWidth;

            // 2. Calculate Raised Tip Point
            const flatLen = this.petalLen * Math.cos(this.petalElevation);
            const tx = Math.cos(baseAngle) * flatLen;
            const tz = Math.sin(baseAngle) * flatLen;
            const ty = this.petalLen * Math.sin(this.petalElevation);

            // 3. Calculate 3D Normals
            const v1x = tx - lx, v1y = ty - 0, v1z = tz - lz;
            const v2x = rx - lx, v2y = 0 - 0, v2z = rz - lz;
            
            let nx = v2y * v1z - v2z * v1y;
            let ny = v2z * v1x - v2x * v1z;
            let nz = v2x * v1y - v2y * v1x;
            const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
            nx /= len; ny /= len; nz /= len;

            // Apply Vertices and Normals using standard CGF arrays
            this.vertices.push(lx, 0, lz, tx, ty, tz, rx, 0, rz);
            this.normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);

            // Front and Back faces
            this.indices.push(base, base + 1, base + 2);
            this.indices.push(base + 2, base + 1, base);
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers(); // Let CGFlib handle the WebGL buffer creation!
    }
}

// ── 2. Sub-object for the Disc ────────────────────────────────────────────
class FlowerDisc extends CGFobject {
    constructor(scene, centreR, centreHeight, slices = 20) {
        super(scene);
        this.centreR = centreR;
        this.centreHeight = centreHeight;
        this.slices = slices;
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];

        this.vertices.push(0, this.centreHeight, 0);
        this.normals.push(0, 1, 0);

        const angleStep = (2 * Math.PI) / this.slices;
        for (let i = 0; i <= this.slices; i++) {
            const a = i * angleStep;
            
            const x = Math.cos(a) * this.centreR;
            const z = Math.sin(a) * this.centreR;
            
            this.vertices.push(x, 0, z);
            
            let nx = this.centreHeight * Math.cos(a);
            let ny = this.centreR;
            let nz = this.centreHeight * Math.sin(a);
            let len = Math.sqrt(nx * nx + ny * ny + nz * nz);
            
            this.normals.push(nx / len, ny / len, nz / len);

            if (i < this.slices) {
                this.indices.push(0, i + 1, i + 2);
                this.indices.push(0, i + 2, i + 1);
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers(); // Let CGFlib handle the WebGL buffer creation!
    }
}

// ── 3. Main Exported TopFlower Class ──────────────────────────────────────
/**
 * TopFlower (Composite 3D Version)
 */
export class TopFlower extends CGFobject {
    constructor(scene, petals = 6, petalLen = 1.0, petalWidth = 0.25, centreR = 0.3) {
        super(scene);
        
        // 3D Parameters
        this.petalElevation = Math.PI / 6; 
        this.centreHeight   = 0.15;        
        
        // Create the standard CGFobjects as children
        this.petalsObj = new FlowerPetals(scene, petals, petalLen, petalWidth, this.petalElevation);
        this.discObj   = new FlowerDisc(scene, centreR, this.centreHeight);

		this.r = 0.4 + Math.random() * 0.6;
		this.g = 0.4 + Math.random() * 0.6;
		this.b = 0.4 + Math.random() * 0.6;
    }

    setDefaultAppearance() {
		this.scene.setAmbient(this.r, this.g, this.b, 1.0);
		this.scene.setDiffuse(this.r, this.g, this.b, 1.0);
	    this.scene.setSpecular(0.1, 0.2, 0.1, 1.0); 
        // this.scene.setSpecular(0.4, 0.1, 0.2, 1.0);
        this.scene.setShininess(1.0);
	}

    setCentreAppearance() {
        this.scene.setAmbient(0.95, 0.85, 0.1, 1.0);
        this.scene.setDiffuse(0.95, 0.85, 0.1, 1.0);
        this.scene.setSpecular(0.3, 0.3, 0.0, 1.0);
        this.scene.setShininess(10.0);
    }

    display() {
        // Now calling .display() on the sub-objects will correctly apply 
        // any scene.translate() or scene.scale() matrices you set up in MyLSFlower!
        
        this.setDefaultAppearance();
        this.petalsObj.display();

        this.setCentreAppearance();
        this.discObj.display();
    }
}