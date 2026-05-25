import {CGFobject} from '../../lib/CGF.js';
import {MyCylinder} from '../primitives/MyCylinder.js';
import {InnerWheel} from './InnerWheel.js';

export class MyWheel extends CGFobject {
    constructor(scene, slices, stacks, radius = 1, thickness = 0.1) {
        super(scene);
        
        this.radius = radius;
        this.thickness = thickness;

        // Initialize the base geometric shapes
        this.tread = new MyCylinder(scene, slices, stacks, thickness); 
        this.cap = new InnerWheel(scene, slices, 1); 
    }

    display() {
        // --- 1. Draw the Outer Cylinder (Tread) ---
        this.scene.pushMatrix();
        // Scale the X and Z axes to match our desired wheel radius
        this.scene.scale(this.radius, 1, this.radius); 
        this.tread.display();
        this.scene.popMatrix();

        // --- 2. Draw the Bottom Hubcap (y = 0) ---
        this.scene.pushMatrix();
        this.scene.translate(0, 0.01, 0); 
        this.scene.scale(this.radius, this.radius, this.radius);
        // Rotate 90 degrees around X so it lays flat, facing down (-Y)
        this.scene.rotate(Math.PI / 2, 1, 0, 0); 
        this.cap.display();
        this.scene.popMatrix();

        // --- 3. Draw the Top Hubcap (y = thickness) ---
        this.scene.pushMatrix();
        // Move it to the top of the cylinder
        this.scene.translate(0, this.thickness - 0.02, 0); 
        this.scene.scale(this.radius, this.radius, this.radius);
        // Rotate -90 degrees around X so it lays flat, facing up (+Y)
        this.scene.rotate(-Math.PI / 2, 1, 0, 0); 
        this.cap.display();
        this.scene.popMatrix();
    }
    
    // Pass the complexity update down to the primitive shapes
    updateBuffers(complexity){
        this.tread.updateBuffers(complexity);
        this.cap.updateBuffers(complexity);
    }
}