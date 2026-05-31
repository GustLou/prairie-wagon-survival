import { CGFobject, CGFappearance, CGFtexture } from './lib/CGF.js';

/**
 * Helper quad with custom tex coords (so we can re-orient a textured face).
 * Lies in the XY plane (z = 0), 1x1, centered at origin.
 */
class TexturedQuad extends CGFobject {
    /**
     * UVs ordered as BL, BR, TR, TL. Defaults map the geometric bottom to v=1
     * (matching the convention used by the project's MyTrapezoid), so a
     * portrait-oriented image (door, window, etc.) renders right-side-up.
     */
    constructor(scene, uvs = [0, 1, 1, 1, 1, 0, 0, 0]) {
        super(scene);
        this.uvs = uvs;
        this.initBuffers();
    }
    initBuffers() {
        this.vertices = [
            -0.5, -0.5, 0,
             0.5, -0.5, 0,
             0.5,  0.5, 0,
            -0.5,  0.5, 0,
        ];
        // Counter-clockwise + back-facing pair (so the quad is double-sided)
        this.indices = [
            0, 1, 2,
            0, 2, 3,
            2, 1, 0,
            3, 2, 0,
        ];
        this.normals = [
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
        ];
        // uvs ordered as: BL, BR, TR, TL
        this.texCoords = [
            this.uvs[0], this.uvs[1],
            this.uvs[2], this.uvs[3],
            this.uvs[4], this.uvs[5],
            this.uvs[6], this.uvs[7],
        ];
        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

/**
 * A triangular prism that forms the barn roof.
 *
 * Local frame:
 *   - length along X axis  (this.length)
 *   - width  along Z axis  (this.width)
 *   - apex   along +Y axis (this.height)
 *
 * The two long sides are the sloped roof faces, the two end caps are
 * the triangular gables.
 */
class RoofPrism extends CGFobject {
    constructor(scene, length = 1, width = 1, height = 1) {
        super(scene);
        this.length = length;
        this.width  = width;
        this.height = height;
        this.initBuffers();
    }
    initBuffers() {
        const L = this.length / 2;
        const W = this.width  / 2;
        const H = this.height;

        // 6 vertices: 4 base corners (y=0) and 2 apex points (y=H).
        // We duplicate vertices where normals differ.

        // Slope normals
        const slopeLen = Math.sqrt(W * W + H * H);
        const ny = W / slopeLen;
        const nz = H / slopeLen;

        this.vertices = [];
        this.normals  = [];
        this.texCoords = [];
        this.indices   = [];

        // --- Front sloped face (+Z side) ---
        // base front-left  (-L, 0,  W)
        // base front-right ( L, 0,  W)
        // apex front-right ( L, H,  0)
        // apex front-left  (-L, H,  0)
        this.vertices.push(
            -L, 0,  W,
             L, 0,  W,
             L, H,  0,
            -L, H,  0,
        );
        for (let i = 0; i < 4; i++) this.normals.push(0, ny, nz);
        // Tile the wood across this slope: U along length, V along the slope
        const tileU = Math.max(1, Math.round(this.length / 1.0));
        const tileV = Math.max(1, Math.round(slopeLen / 1.0));
        this.texCoords.push(
            0, tileV,
            tileU, tileV,
            tileU, 0,
            0, 0,
        );
        this.indices.push(0, 1, 2, 0, 2, 3);

        // --- Back sloped face (-Z side) ---
        // base back-right  ( L, 0, -W)
        // base back-left   (-L, 0, -W)
        // apex back-left   (-L, H,  0)
        // apex back-right  ( L, H,  0)
        const base = this.vertices.length / 3;
        this.vertices.push(
             L, 0, -W,
            -L, 0, -W,
            -L, H,  0,
             L, H,  0,
        );
        for (let i = 0; i < 4; i++) this.normals.push(0, ny, -nz);
        this.texCoords.push(
            0, tileV,
            tileU, tileV,
            tileU, 0,
            0, 0,
        );
        this.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);

        // --- Left gable (-X side, triangle) ---
        const baseL = this.vertices.length / 3;
        this.vertices.push(
            -L, 0,  W,   // bottom front
            -L, H,  0,   // apex
            -L, 0, -W,   // bottom back
        );
        for (let i = 0; i < 3; i++) this.normals.push(-1, 0, 0);
        this.texCoords.push(
            0, 1,
            0.5, 0,
            1, 1,
        );
        this.indices.push(baseL, baseL + 1, baseL + 2);

        // --- Right gable (+X side, triangle) ---
        const baseR = this.vertices.length / 3;
        this.vertices.push(
             L, 0, -W,   // bottom back
             L, H,  0,   // apex
             L, 0,  W,   // bottom front
        );
        for (let i = 0; i < 3; i++) this.normals.push(1, 0, 0);
        this.texCoords.push(
            0, 1,
            0.5, 0,
            1, 1,
        );
        this.indices.push(baseR, baseR + 1, baseR + 2);

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}


/**
 * MyBarn
 *
 * A detailed barn made out of:
 *   - a wood-plank textured "cube" body
 *   - a triangular prism roof (dark wood texture)
 *   - door, loft-door and window quads applied as decals on the front and sides
 *   - a small cupola on top of the roof (mini cube + mini prism)
 *
 * Built as a unit barn (occupies the cube [-0.5, 0.5] in X/Z and [0, 1] in Y),
 * so the caller can `scale` it freely. Origin is at the bottom-center.
 */
export class MyBarn extends CGFobject {
    constructor(scene) {
        super(scene);

        // Body proportions, relative to the unit footprint
        this.bodyLength = 1.6;   // along X
        this.bodyWidth  = 1.0;   // along Z
        this.bodyHeight = 0.9;   // along Y
        this.roofHeight = 0.55;
        this.roofOverhang = 0.08;

        // build pieces
        this._buildPrimitives();
        this._buildMaterials();
    }

    _buildPrimitives() {
        // Plank tex-coords: stretch a bit so the planks read horizontally on
        // long walls and stay legible on shorter ones.  Y values use the
        // bottom=v_max / top=v=0 convention so the wood grain reads
        // right-side up.
        const longTileU = 3, longTileV = 1;
        const shortTileU = 2, shortTileV = 1;

        // Walls (BL, BR, TR, TL)
        this.wallLong = new TexturedQuad(this.scene, [
            0, longTileV,  longTileU, longTileV,  longTileU, 0,  0, 0
        ]);
        this.wallShort = new TexturedQuad(this.scene, [
            0, shortTileV,  shortTileU, shortTileV,  shortTileU, 0,  0, 0
        ]);
        this.floor = new TexturedQuad(this.scene); // base (not normally visible)

        // Roof prism — length matches body + a small overhang on each side
        this.roof = new RoofPrism(
            this.scene,
            this.bodyLength + this.roofOverhang * 2,
            this.bodyWidth + this.roofOverhang * 2,
            this.roofHeight,
        );

        // Door and loft door quads (drawn slightly proud of the wall)
        this.doorQuad = new TexturedQuad(this.scene);
        this.loftDoorQuad = new TexturedQuad(this.scene);
        // Window quads (proud of the wall)
        this.windowQuad = new TexturedQuad(this.scene);

        // Cupola: a tiny body + mini roof, all units, ready to be scaled
        this.cupolaWall = new TexturedQuad(this.scene);
        this.cupolaRoof = new RoofPrism(this.scene, 1, 1, 0.6);
    }

    _buildMaterials() {
        // All barn materials use noticeably higher ambient than before so the
        // walls/roof that aren't facing the sun don't go almost black.

        // Wood plank body
        this.bodyMat = new CGFappearance(this.scene);
        this.bodyMat.setAmbient(0.85, 0.65, 0.50, 1.0);
        this.bodyMat.setDiffuse(0.80, 0.60, 0.45, 1.0);
        this.bodyMat.setSpecular(0.04, 0.04, 0.04, 1.0);
        this.bodyMat.setShininess(4.0);
        this.bodyTex = new CGFtexture(this.scene, 'textures/wood_plank.jpg');
        this.bodyMat.setTexture(this.bodyTex);
        this.bodyMat.setTextureWrap('REPEAT', 'REPEAT');

        // Dark wood roof
        this.roofMat = new CGFappearance(this.scene);
        this.roofMat.setAmbient(0.55, 0.42, 0.32, 1.0);
        this.roofMat.setDiffuse(0.50, 0.36, 0.28, 1.0);
        this.roofMat.setSpecular(0.04, 0.04, 0.04, 1.0);
        this.roofMat.setShininess(5.0);
        this.roofTex = new CGFtexture(this.scene, 'textures/dark_wood.jpg');
        this.roofMat.setTexture(this.roofTex);
        this.roofMat.setTextureWrap('REPEAT', 'REPEAT');

        // Door
        this.doorMat = new CGFappearance(this.scene);
        this.doorMat.setAmbient(0.80, 0.62, 0.48, 1.0);
        this.doorMat.setDiffuse(0.80, 0.62, 0.48, 1.0);
        this.doorMat.setSpecular(0.05, 0.05, 0.05, 1.0);
        this.doorMat.setShininess(5.0);
        this.doorTex = new CGFtexture(this.scene, 'textures/barn_door.jpg');
        this.doorMat.setTexture(this.doorTex);

        // Loft door
        this.loftDoorMat = new CGFappearance(this.scene);
        this.loftDoorMat.setAmbient(0.80, 0.62, 0.48, 1.0);
        this.loftDoorMat.setDiffuse(0.80, 0.62, 0.48, 1.0);
        this.loftDoorMat.setSpecular(0.05, 0.05, 0.05, 1.0);
        this.loftDoorMat.setShininess(5.0);
        this.loftDoorTex = new CGFtexture(this.scene, 'textures/barn_loft_door.jpg');
        this.loftDoorMat.setTexture(this.loftDoorTex);

        // Windows
        this.windowMat = new CGFappearance(this.scene);
        this.windowMat.setAmbient(0.75, 0.82, 0.90, 1.0);
        this.windowMat.setDiffuse(0.70, 0.78, 0.88, 1.0);
        this.windowMat.setSpecular(0.50, 0.50, 0.50, 1.0);
        this.windowMat.setShininess(60.0);
        this.windowTex = new CGFtexture(this.scene, 'textures/barn_window.jpg');
        this.windowMat.setTexture(this.windowTex);
    }

    // --- helpers --------------------------------------------------------
    _drawBody() {
        const s = this.scene;
        const Lx = this.bodyLength;
        const Lz = this.bodyWidth;
        const Ly = this.bodyHeight;

        this.bodyMat.apply();

        // Front (+Z)
        s.pushMatrix();
        s.translate(0, Ly / 2, Lz / 2);
        s.scale(Lx, Ly, 1);
        this.wallLong.display();
        s.popMatrix();

        // Back (-Z)
        s.pushMatrix();
        s.translate(0, Ly / 2, -Lz / 2);
        s.rotate(Math.PI, 0, 1, 0);
        s.scale(Lx, Ly, 1);
        this.wallLong.display();
        s.popMatrix();

        // Right (+X)
        s.pushMatrix();
        s.translate(Lx / 2, Ly / 2, 0);
        s.rotate(Math.PI / 2, 0, 1, 0);
        s.scale(Lz, Ly, 1);
        this.wallShort.display();
        s.popMatrix();

        // Left (-X)
        s.pushMatrix();
        s.translate(-Lx / 2, Ly / 2, 0);
        s.rotate(-Math.PI / 2, 0, 1, 0);
        s.scale(Lz, Ly, 1);
        this.wallShort.display();
        s.popMatrix();

        // Floor (so the inside isn't see-through if you peek under)
        s.pushMatrix();
        s.translate(0, 0.001, 0);
        s.rotate(-Math.PI / 2, 1, 0, 0);
        s.scale(Lx, Lz, 1);
        this.floor.display();
        s.popMatrix();
    }

    _drawRoof() {
        const s = this.scene;
        s.pushMatrix();
        s.translate(0, this.bodyHeight, 0);
        this.roofMat.apply();
        this.roof.display();
        s.popMatrix();
    }

    _drawDecals() {
        const s = this.scene;
        const Lz = this.bodyWidth;
        const Ly = this.bodyHeight;
        // Sit decals just in front of the wall to avoid z-fighting
        const proud = 0.005;

        // --- Big double door, centered on the front (+Z) wall ---
        const doorW = 0.55;
        const doorH = Ly * 0.6;
        s.pushMatrix();
        s.translate(0, doorH / 2, Lz / 2 + proud);
        s.scale(doorW, doorH, 1);
        this.doorMat.apply();
        this.doorQuad.display();
        s.popMatrix();

        // --- Loft door, up in the front gable triangle ---
        // Gable plane goes from (y=Ly, z=Lz/2) at the eaves to (y=Ly+rh, z=0)
        // at the apex.  We pick a center height for the door and compute the
        // z where the gable sits at the *top edge* of the door, then push it
        // slightly proud of that.
        const loftW = 0.30;
        const loftH = 0.24;
        const loftCenterY = Ly + this.roofHeight * 0.32;
        const topLocalY = loftCenterY - Ly + loftH / 2;       // 0..roofHeight
        const tFrac = Math.min(0.95, topLocalY / this.roofHeight);
        const loftZ = (Lz / 2) * (1 - tFrac) + proud;
        s.pushMatrix();
        s.translate(0, loftCenterY, loftZ);
        s.scale(loftW, loftH, 1);
        this.loftDoorMat.apply();
        this.loftDoorQuad.display();
        s.popMatrix();

        // --- Two windows on the front, flanking the door ---
        const winW = 0.22, winH = 0.22;
        for (const xOff of [-0.55, 0.55]) {
            s.pushMatrix();
            s.translate(xOff, Ly * 0.65, Lz / 2 + proud);
            s.scale(winW, winH, 1);
            this.windowMat.apply();
            this.windowQuad.display();
            s.popMatrix();
        }

        // --- Two windows on each long side (back wall) ---
        for (const xOff of [-0.45, 0.45]) {
            s.pushMatrix();
            s.translate(xOff, Ly * 0.6, -Lz / 2 - proud);
            s.rotate(Math.PI, 0, 1, 0);
            s.scale(winW, winH, 1);
            this.windowMat.apply();
            this.windowQuad.display();
            s.popMatrix();
        }

        // --- One window per short side ---
        for (const sideX of [-1, 1]) {
            s.pushMatrix();
            s.translate(sideX * (this.bodyLength / 2 + proud), Ly * 0.65, 0);
            s.rotate(sideX * Math.PI / 2, 0, 1, 0);
            s.scale(winW, winH, 1);
            this.windowMat.apply();
            this.windowQuad.display();
            s.popMatrix();
        }
    }

    _drawCupola() {
        const s = this.scene;
        const cupSize = 0.20;
        const cupHeight = 0.18;

        // Position: ride on the ridge of the main roof
        s.pushMatrix();
        s.translate(0, this.bodyHeight + this.roofHeight * 0.65, 0);

        // small body (4 walls + skipped floor/ceiling)
        this.bodyMat.apply();
        // front
        s.pushMatrix();
        s.translate(0, cupHeight / 2, cupSize / 2);
        s.scale(cupSize, cupHeight, 1);
        this.cupolaWall.display();
        s.popMatrix();
        // back
        s.pushMatrix();
        s.translate(0, cupHeight / 2, -cupSize / 2);
        s.rotate(Math.PI, 0, 1, 0);
        s.scale(cupSize, cupHeight, 1);
        this.cupolaWall.display();
        s.popMatrix();
        // sides
        for (const sx of [-1, 1]) {
            s.pushMatrix();
            s.translate(sx * cupSize / 2, cupHeight / 2, 0);
            s.rotate(sx * Math.PI / 2, 0, 1, 0);
            s.scale(cupSize, cupHeight, 1);
            this.cupolaWall.display();
            s.popMatrix();
        }

        // mini roof
        s.pushMatrix();
        s.translate(0, cupHeight, 0);
        s.scale(cupSize * 1.4, cupSize * 1.4, 1.0);
        this.roofMat.apply();
        this.cupolaRoof.display();
        s.popMatrix();

        s.popMatrix();
    }

    display() {
        this._drawBody();
        this._drawRoof();
        this._drawDecals();
        this._drawCupola();
    }
}
