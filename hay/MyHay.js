import { CGFobject, CGFshader, CGFtexture } from "../lib/CGF.js";
import { MyUnitCubeQuad } from "./MyUnitQuad.js";

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
  }

  display(arrow = true) {
    // ---- Bale body ----
    this.scene.pushMatrix();
    this.scene.translate(0, 0.5, 0);
    this.scene.scale(1.5, 1.0, 1.0);
    this.bale.display();
    this.scene.popMatrix();
  }
}
