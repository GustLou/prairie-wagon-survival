import { CGFobject, CGFappearance, CGFtexture } from './lib/CGF.js';

/**
 * Curved cylindrical shell drawn between two angles around the Y axis.
 * Origin is at the bottom centre, +Y is up, +X is angle = 0.
 * The shell is *double-sided*: outward-facing triangles use the outward
 * normal, and an inward-facing duplicate set with inverted normals is
 * appended so the inside is lit correctly when viewed through the gap.
 */
class SiloWallShell extends CGFobject {
    constructor(scene, slices, a0, a1, radius, height, uTile = 1, vTile = 1) {
        super(scene);
        this.slices = slices;
        this.a0 = a0;
        this.a1 = a1;
        this.radius = radius;
        this.height = height;
        this.uTile = uTile;
        this.vTile = vTile;
        this.initBuffers();
    }
    initBuffers() {
        const r = this.radius;
        const h = this.height;
        const span = this.a1 - this.a0;
        const slices = this.slices;

        this.vertices  = [];
        this.normals   = [];
        this.texCoords = [];
        this.indices   = [];

        // --- Outward ring ---
        for (let i = 0; i <= slices; i++) {
            const t = i / slices;
            const a = this.a0 + t * span;
            const cx = Math.cos(a), sz = Math.sin(a);
            // bottom
            this.vertices.push(cx * r, 0, sz * r);
            this.normals.push(cx, 0, sz);
            this.texCoords.push(t * this.uTile, this.vTile);
            // top
            this.vertices.push(cx * r, h, sz * r);
            this.normals.push(cx, 0, sz);
            this.texCoords.push(t * this.uTile, 0);
        }
        for (let i = 0; i < slices; i++) {
            const bl = i * 2 + 0,         tl = i * 2 + 1;
            const br = (i + 1) * 2 + 0,   tr = (i + 1) * 2 + 1;
            this.indices.push(bl, br, tr);
            this.indices.push(bl, tr, tl);
        }

        // --- Inward ring (same vertices, flipped normals + reversed winding) ---
        const innerBase = this.vertices.length / 3;
        for (let i = 0; i <= slices; i++) {
            const t = i / slices;
            const a = this.a0 + t * span;
            const cx = Math.cos(a), sz = Math.sin(a);
            this.vertices.push(cx * r, 0, sz * r);
            this.normals.push(-cx, 0, -sz);
            this.texCoords.push(t * this.uTile, this.vTile);
            this.vertices.push(cx * r, h, sz * r);
            this.normals.push(-cx, 0, -sz);
            this.texCoords.push(t * this.uTile, 0);
        }
        for (let i = 0; i < slices; i++) {
            const bl = innerBase + i * 2 + 0;
            const tl = innerBase + i * 2 + 1;
            const br = innerBase + (i + 1) * 2 + 0;
            const tr = innerBase + (i + 1) * 2 + 1;
            this.indices.push(bl, tr, br);
            this.indices.push(bl, tl, tr);
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

/**
 * A cone-shaped roof: ring of base vertices at y=0, single apex at y=height.
 * Outward normal pre-baked from the slope so non-uniform scaling isn't needed.
 */
class SiloConeRoof extends CGFobject {
    constructor(scene, slices, radius, height) {
        super(scene);
        this.slices = slices;
        this.radius = radius;
        this.height = height;
        this.initBuffers();
    }
    initBuffers() {
        const r = this.radius;
        const h = this.height;
        const slices = this.slices;

        // Outward normal on the slope: (h*cos a, r, h*sin a) / sqrt(h^2 + r^2)
        const norm = Math.sqrt(h * h + r * r);
        const hFactor = h / norm;
        const vFactor = r / norm;

        this.vertices  = [];
        this.normals   = [];
        this.texCoords = [];
        this.indices   = [];

        for (let i = 0; i <= slices; i++) {
            const t = i / slices;
            const a = t * Math.PI * 2;
            const cx = Math.cos(a), sz = Math.sin(a);
            // base
            this.vertices.push(cx * r, 0, sz * r);
            this.normals.push(cx * hFactor, vFactor, sz * hFactor);
            this.texCoords.push(t, 1);
            // apex (duplicated per slice so each side gets its own normal)
            this.vertices.push(0, h, 0);
            this.normals.push(cx * hFactor, vFactor, sz * hFactor);
            this.texCoords.push(t, 0);
        }
        for (let i = 0; i < slices; i++) {
            const b0 = i * 2 + 0;
            const ap = i * 2 + 1;
            const b1 = (i + 1) * 2 + 0;
            this.indices.push(b0, b1, ap);
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

/**
 * Solid floor disc at y=0, normal +Y (visible only from above).
 */
class SiloFloorDisc extends CGFobject {
    constructor(scene, slices, radius) {
        super(scene);
        this.slices = slices;
        this.radius = radius;
        this.initBuffers();
    }
    initBuffers() {
        const r = this.radius;
        const slices = this.slices;
        this.vertices  = [0, 0, 0];
        this.normals   = [0, 1, 0];
        this.texCoords = [0.5, 0.5];
        for (let i = 0; i <= slices; i++) {
            const t = i / slices;
            const a = t * Math.PI * 2;
            this.vertices.push(Math.cos(a) * r, 0, Math.sin(a) * r);
            this.normals.push(0, 1, 0);
            this.texCoords.push(0.5 + 0.5 * Math.cos(a), 0.5 + 0.5 * Math.sin(a));
        }
        this.indices = [];
        for (let i = 0; i < slices; i++) {
            this.indices.push(0, 1 + i, 1 + i + 1);
        }
        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

/**
 * Inner hay "plug": a unit-height cylinder + top disc, baked at a fixed
 * radius.  In display() we scale Y to match the desired fill level so the
 * geometry doesn't need to be rebuilt when the level changes.
 */
class HayPlug extends CGFobject {
    constructor(scene, slices, radius, uTile = 4) {
        super(scene);
        this.slices = slices;
        this.radius = radius;
        this.uTile = uTile;
        this.initBuffers();
    }
    initBuffers() {
        const r = this.radius;
        const slices = this.slices;
        this.vertices  = [];
        this.normals   = [];
        this.texCoords = [];
        this.indices   = [];

        // --- Side wall ---
        for (let i = 0; i <= slices; i++) {
            const t = i / slices;
            const a = t * Math.PI * 2;
            const cx = Math.cos(a), sz = Math.sin(a);
            this.vertices.push(cx * r, 0, sz * r);
            this.normals.push(cx, 0, sz);
            this.texCoords.push(t * this.uTile, 1);
            this.vertices.push(cx * r, 1, sz * r);
            this.normals.push(cx, 0, sz);
            this.texCoords.push(t * this.uTile, 0);
        }
        for (let i = 0; i < slices; i++) {
            const bl = i * 2 + 0,        tl = i * 2 + 1;
            const br = (i + 1) * 2 + 0,  tr = (i + 1) * 2 + 1;
            this.indices.push(bl, br, tr);
            this.indices.push(bl, tr, tl);
        }

        // --- Top disc (so the top of the hay reads as a solid surface) ---
        const baseTop = this.vertices.length / 3;
        this.vertices.push(0, 1, 0);
        this.normals.push(0, 1, 0);
        this.texCoords.push(0.5, 0.5);
        for (let i = 0; i <= slices; i++) {
            const t = i / slices;
            const a = t * Math.PI * 2;
            this.vertices.push(Math.cos(a) * r, 1, Math.sin(a) * r);
            this.normals.push(0, 1, 0);
            this.texCoords.push(0.5 + 0.5 * Math.cos(a), 0.5 + 0.5 * Math.sin(a));
        }
        for (let i = 0; i < slices; i++) {
            this.indices.push(baseTop, baseTop + 1 + i, baseTop + 1 + i + 1);
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

/**
 * MyHaySilo
 *
 * A cylindrical hay silo with a vertical opening (gap) cut from the wall so
 * the hay inside is visible from top to bottom.  Pieces:
 *
 *   - SiloWallShell : the curved wall, drawn from gapAngle/2 around to
 *                     2π − gapAngle/2 so a wedge centered on +X is missing.
 *                     Drawn double-sided so the inside reads correctly
 *                     when looking through the gap.
 *   - SiloConeRoof  : a cone sitting on top.
 *   - SiloFloorDisc : a disc at y=0 (silo floor).
 *   - HayPlug       : a slightly-smaller inner cylinder filled with hay
 *                     texture; its height is scaled by the 0..1 hayLevel
 *                     each frame to mimic varying fill.
 *
 * Origin is at the bottom centre; the gap is centered on local +X.  The
 * scene can rotate the silo around Y to aim the opening anywhere.
 */
export class MyHaySilo extends CGFobject {
    constructor(scene, radius = 0.55, height = 2.0, slices = 40, gapAngle = Math.PI / 3) {
        super(scene);
        this.radius   = radius;
        this.height   = height;
        this.slices   = slices;
        this.gapAngle = gapAngle;
        this.coneHeight = radius * 0.8;
        this.hayLevel = 0.55;
        this.hayRadius = radius * 0.93;

        // Wall spans angles outside the gap.  Gap is centered on +X (angle 0),
        // so the visible wall runs from +gapAngle/2 around to 2π − gapAngle/2.
        this.wall = new SiloWallShell(
            scene,
            Math.max(8, Math.round(slices * (1 - gapAngle / (Math.PI * 2)))),
            gapAngle / 3.5,
            Math.PI * 2 - gapAngle / 2,
            radius,
            height,
            6,    // uTile — repeats the metal corrugation around the wall
            1,
        );
        this.roof  = new SiloConeRoof(scene, slices, radius * 1.08, this.coneHeight);
        this.floor = new SiloFloorDisc(scene, slices, radius * 0.98);
        this.hay   = new HayPlug(scene, slices, this.hayRadius);

        this._buildMaterials();
    }

    _buildMaterials() {
        // Same ambient-heavy style we now use elsewhere so faces away from
        // the sun stay readable.

        // Corrugated metal silo wall
        this.wallMat = new CGFappearance(this.scene);
        this.wallMat.setAmbient(0.85, 0.87, 0.90, 1.0);
        this.wallMat.setDiffuse(0.65, 0.67, 0.70, 1.0);
        this.wallMat.setSpecular(0.15, 0.15, 0.18, 1.0);
        this.wallMat.setShininess(14.0);
        this.wallTex = new CGFtexture(this.scene, 'textures/silo_metal.jpg');
        this.wallMat.setTexture(this.wallTex);
        this.wallMat.setTextureWrap('REPEAT', 'REPEAT');

        // Dark wood roof (reuses the barn's dark wood texture)
        this.roofMat = new CGFappearance(this.scene);
        this.roofMat.setAmbient(0.55, 0.42, 0.32, 1.0);
        this.roofMat.setDiffuse(0.50, 0.36, 0.28, 1.0);
        this.roofMat.setSpecular(0.05, 0.05, 0.05, 1.0);
        this.roofMat.setShininess(5.0);
        this.roofTex = new CGFtexture(this.scene, 'textures/dark_wood.jpg');
        this.roofMat.setTexture(this.roofTex);

        // Floor: simple dirt-brown (no texture)
        this.floorMat = new CGFappearance(this.scene);
        this.floorMat.setAmbient(0.50, 0.38, 0.28, 1.0);
        this.floorMat.setDiffuse(0.45, 0.32, 0.22, 1.0);
        this.floorMat.setSpecular(0.0, 0.0, 0.0, 1.0);
        this.floorMat.setShininess(1.0);

        // Hay: warm golden, mostly ambient so it stays bright inside the silo
        // (where the directional sun barely reaches).
        this.hayMat = new CGFappearance(this.scene);
        this.hayMat.setAmbient(1.0, 0.85, 0.50, 1.0);
        this.hayMat.setDiffuse(0.85, 0.70, 0.38, 1.0);
        this.hayMat.setSpecular(0.05, 0.05, 0.05, 1.0);
        this.hayMat.setShininess(2.0);
        this.hayMat.setEmission(0.10, 0.08, 0.04, 1.0); // tiny glow so it reads through the gap
        this.hayTex = new CGFtexture(this.scene, 'textures/hay.jpg');
        this.hayMat.setTexture(this.hayTex);
        this.hayMat.setTextureWrap('REPEAT', 'REPEAT');
    }

    setHayLevel(level) {
        this.hayLevel = Math.max(0, Math.min(1, level));
    }

    display() {
        const s = this.scene;

        // Floor
        this.floorMat.apply();
        this.floor.display();

        // Hay plug (scaled to the desired fill level).  Pull it just barely
        // off the floor so its base doesn't z-fight with the floor disc.
        if (this.hayLevel > 0.001) {
            const hayH = this.hayLevel * (this.height - 0.08);
            this.hayMat.apply();
            s.pushMatrix();
            s.translate(0, 0.002, 0);
            s.scale(1, hayH, 1);
            this.hay.display();
            s.popMatrix();
        }

        // Wall
        this.wallMat.apply();
        this.wall.display();

        // Cone roof
        this.roofMat.apply();
        s.pushMatrix();
        s.translate(0, this.height, 0);
        this.roof.display();
        s.popMatrix();
    }
}
