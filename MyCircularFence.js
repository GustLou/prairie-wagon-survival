import { CGFobject, CGFappearance } from '../lib/CGF.js';

/**
 * A simple vertical, double-sided 2D plank used as a fence post / rail.
 *
 *   x in [-0.5, 0.5]  (width)
 *   y in [ 0,    1 ]  (height)
 *   z = 0             (flat)
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
 * MyCircularFence
 *
 * A simple 2D circular fence drawn as a ring of vertical posts at evenly
 * spaced angles around (centerX, centerZ).  Each post is sampled against
 * the scene's terrain height so the fence visually follows the ground.
 *
 * Public methods:
 *   setCenter(x, z)
 *   setRadius(r)
 *   setIntersected(bool)   // toggles visual feedback
 *   display()
 */
export class MyCircularFence extends CGFobject {
    constructor(scene, centerX = 0, centerZ = 0, radius = 3.0, numPosts = 48) {
        super(scene);

        this.centerX  = centerX;
        this.centerZ  = centerZ;
        this.radius   = radius;
        this.numPosts = numPosts;

        // Post visual size (world units, before applying any global scale)
        this.postWidth  = 0.10;
        this.postHeight = 0.65;
        this.railHeight = 0.06;
        this.railOffset = 0.40;   // y from terrain to center of upper rail

        // Entrance gap: a wedge of the circle (centered on entranceAngle,
        // spanning entranceArc radians) where no posts/rails are drawn.
        // Angles use the same convention as the post-placement loop:
        // angle 0 = +X direction, angle = atan2(z, x).
        this.entranceAngle = 0;            // overridden each frame by the scene
        this.entranceArc   = Math.PI / 5;  // ~36° default

        this.intersected = false;

        this._plank = new FencePlank(scene);

        // --- Materials ---
        // "Normal" fence: warm wood brown. We use a high ambient-to-diffuse
        // ratio (and zero specular) so the fence keeps a consistent brown
        // color across faces, instead of going dramatically dark on the
        // posts facing away from the sun.
        this.matNormal = new CGFappearance(scene);
        this.matNormal.setAmbient(0.55, 0.36, 0.22, 1.0);
        this.matNormal.setDiffuse(0.45, 0.28, 0.16, 1.0);
        this.matNormal.setSpecular(0.0, 0.0, 0.0, 1.0);
        this.matNormal.setShininess(1.0);
        this.matNormal.setEmission(0.0, 0.0, 0.0, 1.0);

        // "Intersected" fence: vivid red-orange with mild emission so the
        // visual cue is unmistakable regardless of lighting.
        this.matIntersected = new CGFappearance(scene);
        this.matIntersected.setAmbient(0.7, 0.25, 0.18, 1.0);
        this.matIntersected.setDiffuse(0.6, 0.18, 0.10, 1.0);
        this.matIntersected.setSpecular(0.05, 0.02, 0.02, 1.0);
        this.matIntersected.setShininess(4.0);
        this.matIntersected.setEmission(0.40, 0.08, 0.03, 1.0);
    }

    setCenter(x, z) { this.centerX = x; this.centerZ = z; }
    setRadius(r)    { this.radius = r; }
    setIntersected(v) { this.intersected = !!v; }
    setEntrance(angle, arc) {
        if (typeof angle === 'number') this.entranceAngle = angle;
        if (typeof arc   === 'number') this.entranceArc   = Math.max(0, arc);
    }

    /**
     * Returns true if the given angle (radians, measured from +X) falls
     * inside the entrance gap.  Handles wrap-around at ±π gracefully.
     */
    _isInEntrance(angle) {
        if (this.entranceArc <= 0) return false;
        let d = angle - this.entranceAngle;
        // wrap d into [-π, π]
        d = Math.atan2(Math.sin(d), Math.cos(d));
        return Math.abs(d) <= this.entranceArc / 2;
    }

    /**
     * Convenience: test whether a world-space point (wx, wz) is inside the
     * circle (ignoring the post thickness).  Useful for the wagon-intersect
     * check the scene will eventually wire up.
     */
    containsPoint(wx, wz) {
        const dx = wx - this.centerX;
        const dz = wz - this.centerZ;
        return (dx * dx + dz * dz) <= this.radius * this.radius;
    }

    display() {
        const s = this.scene;
        const mat = this.intersected ? this.matIntersected : this.matNormal;
        mat.apply();

        const TAU = Math.PI * 2;
        const angleStep = TAU / this.numPosts;

        for (let i = 0; i < this.numPosts; i++) {
            const a = i * angleStep;
            const skipPost = this._isInEntrance(a);

            const px = this.centerX + this.radius * Math.cos(a);
            const pz = this.centerZ + this.radius * Math.sin(a);

            // Sample terrain so the fence follows the elevation. The scene
            // exposes terrainHeight(wx, wz); if it's missing we fall back to 0.
            const py = (typeof s.terrainHeight === 'function')
                ? s.terrainHeight(px, pz)
                : 0;

            // --- Vertical post, oriented tangent to the circle so its face
            //     looks "outward" (orientation only matters visually because
            //     the plank is double-sided) ---
            if (!skipPost) {
                s.pushMatrix();
                s.translate(px, py, pz);
                // Rotate so the plank's width axis (local X) runs tangent to
                // the circle. The tangent direction at angle a is
                // (-sin a, 0, cos a), i.e. rotate around Y by (-a - π/2).
                s.rotate(-a - Math.PI / 2, 0, 1, 0);
                s.scale(this.postWidth, this.postHeight, 1);
                this._plank.display();
                s.popMatrix();
            }

            // --- Upper "rail" segment connecting this post to the next.
            //     Skip the rail when either endpoint is inside the gap, so
            //     the entrance reads as a clean opening.
            const a2 = ((i + 1) % this.numPosts) * angleStep;
            if (skipPost || this._isInEntrance(a2)) continue;

            const px2 = this.centerX + this.radius * Math.cos(a2);
            const pz2 = this.centerZ + this.radius * Math.sin(a2);
            const py2 = (typeof s.terrainHeight === 'function')
                ? s.terrainHeight(px2, pz2)
                : 0;

            const mx = 0.5 * (px + px2);
            const mz = 0.5 * (pz + pz2);
            const my = 0.5 * (py + py2) + this.railOffset;

            const dx = px2 - px;
            const dz = pz2 - pz;
            const segLen = Math.sqrt(dx * dx + dz * dz);
            // angle around Y that aligns the plank's local +X with (dx, dz)
            const railAngle = Math.atan2(dz, dx);

            s.pushMatrix();
            s.translate(mx, my, mz);
            s.rotate(-railAngle, 0, 1, 0);
            // The plank's local space has y going up from 0..1 and x from
            // -0.5..0.5, so we scale: length along x, railHeight along y.
            s.scale(segLen, this.railHeight, 1);
            this._plank.display();
            s.popMatrix();
        }
    }
}
