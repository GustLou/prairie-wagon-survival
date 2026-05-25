import { CGFobject } from '../../lib/CGF.js';
import { MyTrapezoid } from './../MyTrapezoid.js'; // Adjust path as necessary

export class WagonWall extends CGFobject {
    /**
     * @param scene - Reference to CGFScene
     * @param numPlanks - Number of planks stacked to build the wall
     * @param baseWidth - The width of the very bottom plank
     * @param plankHeight - The height of each individual plank
     * @param taper - Negative value makes it wider at the top (e.g., -0.2)
     */
    constructor(scene, numPlanks = 5, baseWidth = 2, plankHeight = 0.5, taper = -0.1, plankSpace = 0.01) {
        super(scene);
        this.numPlanks = numPlanks;
        this.baseWidth = baseWidth;
        this.plankHeight = plankHeight;
        this.taper = taper;
        this.plankSpace = plankSpace;

        this.planks = [];
        this.initPlanks();
    }

    initPlanks() {
        let currentWidth = this.baseWidth;

        for (let i = 0; i < this.numPlanks; i++) {
            // Create a new trapezoid for the current layer
            let plank = new MyTrapezoid(this.scene, currentWidth, this.plankHeight, this.taper);
            this.planks.push(plank);

            // Calculate the top width of the current plank so the next plank's base matches it perfectly.
            // Using the exact logic from MyTrapezoid: topW = width * (1 - taper)
            currentWidth = currentWidth * (1 - this.taper);
        }
    }

    display() {
        for (let i = 0; i < this.numPlanks; i++) {
            this.scene.pushMatrix();
            
            // Translate each plank upwards along the Y axis.
            // Because MyTrapezoid draws from Y=0 to Y=height, we just stack them.
            this.scene.translate(0, i * (this.plankHeight + this.plankSpace), 0);
            
            this.planks[i].display();
            
            this.scene.popMatrix();
        }
    }
}