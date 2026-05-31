import { CGFobject, CGFappearance } from './lib/CGF.js';

/**
 * A simple vertical, double-sided 2D plank used as a fence post / rail.
 *
 * x in [-0.5, 0.5]  (width)
 * y in [ 0,    1 ]  (height)
 * z = 0             (flat)
 */
class FencePlank extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }
    initBuffers() {
        this.vertices = [
            -0.5, 0, 0,
             0.5, 0, 0,
             0.5, 1, 0,
            -0.5, 1, 0,
        ];
        this.indices = [
            0, 1, 2,  0, 2, 3,
            2, 1, 0,  3, 2, 0, // back faces (visible from either side)
        ];
        this.normals = [
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
        ];
        this.texCoords = [0, 1, 1, 1, 1, 0, 0, 0];
        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

/**
 * MySquareFence
 *
 * A simple 2D square fence drawn as a perimeter of vertical posts at evenly
 * spaced intervals around (centerX, centerZ). Each post is sampled against
 * the scene's terrain height so the fence visually follows the ground.
 *
 * Public methods:
 * display()
 * containsPoint(wx, wz)
 */
export class MySquareFence extends CGFobject {
    // Replaced 'radius' with 'size', and 'numPosts' with 'postsPerSide' to make square generation easier.
    // A radius of 3.0 equates to a full size of 6.0. 12 posts per side maintains the original 48 total posts.
    constructor(scene, centerX = 0, centerZ = 0, size = 6.0, postsPerSide = 12) {
        super(scene);

        this.centerX      = centerX;
        this.centerZ      = centerZ;
        this.size         = size;
        this.postsPerSide = postsPerSide;
        this.numPosts     = postsPerSide * 4;

        // Post visual size (world units, before applying any global scale)
        this.postWidth  = 0.10;
        this.postHeight = 0.65;
        this.railHeight = 0.06;
        this.railOffset = 0.40;   // y from terrain to center of upper rail

        this._plank = new FencePlank(scene);

        // --- Materials ---
        this.matNormal = new CGFappearance(scene);
        this.matNormal.setAmbient(0.55, 0.36, 0.22, 1.0);
        this.matNormal.setDiffuse(0.45, 0.28, 0.16, 1.0);
        this.matNormal.setSpecular(0.0, 0.0, 0.0, 1.0);
        this.matNormal.setShininess(1.0);
        this.matNormal.setEmission(0.0, 0.0, 0.0, 1.0);
    }

    /**
     * Test whether a world-space point (wx, wz) is inside the
     * square (ignoring the post thickness). 
     */
    containsPoint(wx, wz) {
        const half = this.size / 2;
        // Bounding box bounds check instead of radial distance
        return (
            wx >= this.centerX - half &&
            wx <= this.centerX + half &&
            wz >= this.centerZ - half &&
            wz <= this.centerZ + half
        );
    }

    /**
     * Helper to compute the exact world position and orientation of a post given its index.
     */
    _getPostData(index) {
        const half = this.size / 2;
        const side = Math.floor(index / this.postsPerSide) % 4;
        const step = (index % this.postsPerSide) / this.postsPerSide;

        let x = 0, z = 0, edgeAngle = 0;

        switch (side) {
            case 0: // Bottom edge: moving right (+X)
                x = -half + step * this.size;
                z = -half;
                edgeAngle = 0;
                break;
            case 1: // Right edge: moving up (+Z)
                x = half;
                z = -half + step * this.size;
                edgeAngle = Math.PI / 2;
                break;
            case 2: // Top edge: moving left (-X)
                x = half - step * this.size;
                z = half;
                edgeAngle = Math.PI;
                break;
            case 3: // Left edge: moving down (-Z)
                x = -half;
                z = half - step * this.size;
                edgeAngle = Math.PI * 1.5;
                break;
        }

        return {
            x: this.centerX + x,
            z: this.centerZ + z,
            angle: edgeAngle
        };
    }

    display() {
        const s = this.scene;
        this.matNormal.apply();

        for (let i = 0; i < this.numPosts; i++) {
            // Get coordinates for the current post and the next post
            const currentPost = this._getPostData(i);
            const nextPost = this._getPostData((i + 1) % this.numPosts);

            const px = currentPost.x;
            const pz = currentPost.z;
            
            // Sample terrain
            const py = (typeof s.terrainHeight === 'function')
                ? s.terrainHeight(px, pz)
                : 0;

            // --- Vertical post ---
            s.pushMatrix();
            s.translate(px, py, pz);
            // Rotate the post so its face aligns with the edge it sits on
            s.rotate(-currentPost.angle, 0, 1, 0);
            s.scale(this.postWidth, this.postHeight, 1);
            this._plank.display();
            s.popMatrix();

            // --- Upper "rail" segment ---
            const px2 = nextPost.x;
            const pz2 = nextPost.z;
            const py2 = (typeof s.terrainHeight === 'function')
                ? s.terrainHeight(px2, pz2)
                : 0;

            const mx = 0.5 * (px + px2);
            const mz = 0.5 * (pz + pz2);
            const my = 0.5 * (py + py2) + this.railOffset;

            const dx = px2 - px;
            const dz = pz2 - pz;
            const segLen = Math.sqrt(dx * dx + dz * dz);
            
            // Math.atan2 cleanly handles corner wrapping automatically
            const railAngle = Math.atan2(dz, dx);

            s.pushMatrix();
            s.translate(mx, my, mz);
            s.rotate(-railAngle, 0, 1, 0);
            s.scale(segLen, this.railHeight, 1);
            this._plank.display();
            s.popMatrix();
        }
    }
}