import { CGFobject } from "../lib/CGF.js";
import { MyPyramid } from "./MyPyramid.js";

export class MyArrow extends CGFobject {
  constructor(scene) {
    super(scene);

    this.arrow = new MyPyramid(scene);
  }

  display(arrow = true) {
    // Rotate 180° around X so the apex points downward.
    // The bob translation is handled inside the vertex shader.
    this.scene.pushMatrix();
    this.scene.translate(0, 2.3, 0);
    this.scene.rotate(Math.PI, 1, 0, 0);
    this.scene.scale(0.6, 0.8, 0.6);

    this.arrow.display();
    this.scene.popMatrix();
  }
}
