import { CGFobject, CGFappearance } from "../../lib/CGF.js";
import { MyQuad } from "../../tp4/MyQuad.js";
/**
 * MyDiamond
 * @constructor
 * @param scene - Reference to MyScene object
 * @param {CGFtexture} topTex - +Y (topo)
 * @param {CGFtexture} frontTex - +Z (frente)
 * @param {CGFtexture} rightTex - +X (direita)
 * @param {CGFtexture} backTex - -Z (tras)
 * @param {CGFtexture} leftTex - -X (esquerda)
 * @param {CGFtexture} bottomTex - -Y (fundo)
 */
export class MyUnitCubeQuad extends MyQuad {
  constructor(
    scene,
    topTex = null,
    frontTex = null,
    rightTex = null,
    backTex = null,
    leftTex = null,
    bottomTex = null,
  ) {
    super(scene);

    this.quad = new MyQuad(scene);

    this.faceTextures = [
      topTex,
      frontTex,
      rightTex,
      backTex,
      leftTex,
      bottomTex,
    ];

    this.faceAppearence = new CGFappearance(scene);
    this.faceAppearence.setAmbient(0.5, 0.5, 0.5, 1);
    this.faceAppearence.setDiffuse(0.9, 0.9, 0.9, 1);
    this.faceAppearence.setSpecular(0.1, 0.1, 0.1, 1);
    this.faceAppearence.setShininess(10.0);
  }

  drawFace(texture, drawTransform) {
    this.scene.pushMatrix();
    drawTransform();

    this.faceAppearence.setTexture(texture);
    this.faceAppearence.apply();

    this.quad.display();
    this.scene.popMatrix();
  }

  display() {
    // topo (+Y)
    this.drawFace(this.faceTextures[0], () => {
      this.scene.translate(0, 0.5, 0);
      this.scene.rotate(-Math.PI / 2, 1, 0, 0);
    });

    // frente (+Z)
    this.drawFace(this.faceTextures[1], () => {
      this.scene.translate(0, 0, 0.5);
    });

    // direita (+X)
    this.drawFace(this.faceTextures[2], () => {
      this.scene.translate(0.5, 0, 0);
      this.scene.rotate(Math.PI / 2, 0, 1, 0);
    });

    // tras (-Z)
    this.drawFace(this.faceTextures[3], () => {
      this.scene.translate(0, 0, -0.5);
      this.scene.rotate(Math.PI, 0, 1, 0);
    });

    // esquerda (-X)
    this.drawFace(this.faceTextures[4], () => {
      this.scene.translate(-0.5, 0, 0);
      this.scene.rotate(-Math.PI / 2, 0, 1, 0);
    });

    // fundo (-Y)
    this.drawFace(this.faceTextures[5], () => {
      this.scene.translate(0, -0.5, 0);
      this.scene.rotate(Math.PI / 2, 1, 0, 0);
    });
  }
}
