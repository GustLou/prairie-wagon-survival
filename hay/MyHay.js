import { CGFobject, CGFshader, CGFtexture } from "../../lib/CGF.js";
import { MyUnitCubeQuad } from "./MyUnitQuad.js";
import { MyPyramid } from "./MyPyramid.js";

export class MyHay extends CGFobject {
  constructor(scene, hayTex = null) {
    super(scene);

    if (typeof hayTex === "string") hayTex = new CGFtexture(scene, hayTex);

    // ---- Bale body ----
    this.bale = new MyUnitCubeQuad(
      scene,
      hayTex, // top    (+Y)
      hayTex, // front  (+Z)
      hayTex, // right  (+X)
      hayTex, // back   (-Z)
      hayTex, // left   (-X)
      hayTex, // bottom (-Y)
    );

    // ---- Arrow indicator ----
    this.arrow = new MyPyramid(scene);

    this.arrowShader = new CGFshader(
      scene.gl,
      "shaders/arrow.vert",
      "shaders/arrow.frag",
    );
  }

  /**
   * Call every frame from MyScene.update(t).
   * @param {number} t - elapsed time in milliseconds
   */
  update(t) {
    // 1. Set the duration for a full up-and-down loop (e.g., 4000ms = 4 seconds)
    // This creates a linear timer value running from 0.0 to 2.0
    const cycle = (t % 3000) / 2000;

    // 2. Turn it into a straight-lined triangle bounce between 0.0 and 1.0
    const triangle = Math.abs(cycle - 1.0);

    // 3. Scale it to your original [-0.2, 0.2] bounce range
    // Because this uses absolute linear values instead of trigonometry,
    // the speed is 100% constant throughout the entire movement.
    const bob = (triangle * 2.0 - 1.0) * 0.2;

    this.arrowShader.setUniformsValues({ uBob: bob });
  }

  display(arrow = true) {
    // ---- Bale body ----
    this.scene.pushMatrix();
    this.scene.translate(0, 0.5, 0);
    this.scene.scale(1.5, 1.0, 1.0);
    this.bale.display();
    this.scene.popMatrix();

    if (!arrow) return;
    // ---- Arrow indicator ----
    // Rotate 180° around X so the apex points downward.
    // The bob translation is handled inside the vertex shader.
    this.scene.pushMatrix();
    this.scene.translate(0, 2.3, 0);
    this.scene.rotate(Math.PI, 1, 0, 0);
    this.scene.scale(0.6, 0.8, 0.6);

    this.scene.setActiveShader(this.arrowShader);
    this.arrow.display();
    this.scene.setActiveShader(this.scene.defaultShader);
    this.scene.popMatrix();
  }
}
