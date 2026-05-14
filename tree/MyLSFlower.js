import { MyLSystem } from "./MyLSystem.js";
import { MyBranch } from "./MyBranch.js";
import { MyLeaf } from "./MyLeaf.js";
import { TopFlower } from "./TopFlower.js";

/**
 * MyLSFlower
 * Draws a single flower: a straight stem of varying height built from
 * MyBranch segments, MyLeaf instances scattered along the stem, and a
 * TopFlower bloom at the very top.
 *
 * Constructor parameters (all optional):
 *   stemWidth   - radius of the stem cylinder        (default 0.08)
 *   minHeight   - minimum number of stem segments    (default 4)
 *   maxHeight   - maximum number of stem segments    (default 9)
 *   leafScale   - scale passed to MyLeaf             (default 0.4)
 *   leafDensity - avg leaves per stem segment (0–1)  (default 0.5)
 *   petalCount  - petals on the TopFlower            (default 6)
 *   petalLen    - length of each petal               (default 0.6)
 */
export class MyLSFlower extends MyLSystem {
    constructor(
        scene,
        stemWidth   = 0.08,
        minHeight   = 4,
        maxHeight   = 8,
        leafScale   = 0.4,
        leafDensity = 0.3,
        petalCount  = 6,
        petalLen    = 0.6
    ) {
        super(scene);
        this.stemWidth   = stemWidth;
        this.minHeight   = minHeight;
        this.maxHeight   = maxHeight;
        this.leafScale   = leafScale;
        this.leafDensity = leafDensity;
        this.petalCount  = petalCount;
        this.petalLen    = petalLen;
    }

    // ── Override MyLSystem hooks ──────────────────────────────────────────────

    iniGrammar() {
        // Not used for procedural rendering — kept empty to satisfy MyLSystem.init()
        this.grammar    = [];
        this.primitives = [];
    }

    initProductions() {
        // Not used for procedural rendering
        this.predecessor = [];
        this.successor   = [];
    }

    // ── Build flower structure ────────────────────────────────────────────────

    init() {
        // Call parent to set up this.angle, this.scale, this.iterations, etc.
        super.init();

        // Randomise stem height each construction
        this.stemSegments = this.minHeight
            + Math.floor(Math.random() * (this.maxHeight - this.minHeight + 1));

        // Decide which segments carry a leaf.
        // Density is scaled slightly with height so taller stems look fuller.
        const effectiveDensity = Math.min(
            1.0,
            this.leafDensity * (this.stemSegments / this.maxHeight) * 1.3
        );
        this.leafAtSegment = [];
        for (let i = 0; i < this.stemSegments - 1; i++) {
            this.leafAtSegment[i] = Math.random() * Math.PI * 2;
        }

        this.flowerPosition = {
            angH: Math.random() * Math.PI * 2,
            angV: Math.random() * Math.PI / 2 - Math.PI / 4, // just the top 45º, doesn't make sense for it to be facing down or sideways
        };

        // Create shared primitives
        this.branch    = new MyBranch(this.scene, this.stemWidth);
        this.leaf      = new MyLeaf(this.scene, this.leafScale);
        this.topFlower = new TopFlower(
            this.scene,
            this.petalCount,
            this.petalLen,
            this.petalLen * 0.28,  // petalWidth proportional to length
            this.petalLen * 0.28   // centre disc radius
        );
    }

    // ── Rendering ─────────────────────────────────────────────────────────────

    display() {
        const scene        = this.scene;
        const segmentScale = this.scale; // inherited scale factor from MyLSystem

        for (let i = 0; i < this.stemSegments; i++) {

            // ── Draw one stem segment ──────────────────────────────────────
            scene.pushMatrix();
                scene.scale(segmentScale, segmentScale, segmentScale);
                this.branch.setDefaultAppearance();
                this.branch.display();
            scene.popMatrix();

            // ── Optionally draw a leaf pair at this segment ────────────────
            if (this.leafAtSegment[i]) {
                const ang = this.leafAtSegment[i];
                // Right leaf — rotate outward ~70° around Z, then a gentle
                // tilt forward so it doesn't clip the stem
                scene.pushMatrix();
                    scene.translate(0, segmentScale * 0.5, 0);   // mid-segment height
                    scene.rotate( Math.PI * 0.38, 0, 0, 1);      // swing right
                    scene.rotate(-ang, 1, 0, 0);      // tilt forward
                    scene.scale(segmentScale, segmentScale, segmentScale);
                    this.leaf.setDefaultAppearance();
                    this.leaf.display();
                scene.popMatrix();

                // Left leaf — mirror around Z
                scene.pushMatrix();
                    scene.translate(0, segmentScale * 0.5, 0);
                    scene.rotate(-Math.PI * 0.38, 0, 0, 1);
                    scene.rotate(ang, 1, 0, 0);
                    scene.scale(segmentScale, segmentScale, segmentScale);
                    this.leaf.setDefaultAppearance();
                    this.leaf.display();
                scene.popMatrix();
            }

            // Move up to the top of this segment before the next iteration
            scene.translate(0, segmentScale, 0);
        }

        // ── Draw the TopFlower bloom at the tip ────────────────────────────
        // Rotate 90° around X so the flat flower faces upward (it lies in XZ)
        scene.pushMatrix();
            // scene.rotate(-Math.PI / 2, 1, 0, 0);
            scene.scale(segmentScale*2.5, segmentScale*2.5, segmentScale*2.5);
            scene.rotate(this.flowerPosition.angH, 0, 1, 0);
            scene.rotate(this.flowerPosition.angV, 1, 0, 0);
            
            // scene.translate(0, 1000, 0);
            this.topFlower.display();
        scene.popMatrix();
    }
}