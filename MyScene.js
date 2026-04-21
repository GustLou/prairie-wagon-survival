import { CGFscene, CGFcamera, CGFaxis, CGFappearance, CGFtexture } from "../lib/CGF.js";
import { MyQuad } from "./MyQuad.js";
import { MySphere } from "./Sphere.js";

/**
 * MyScene
 * @constructor
 */
export class MyScene extends CGFscene {
  constructor() {
    super();
  }
  init(application) {
    super.init(application);

    this.sunPosition = { x: 12, y: 8, z: -6 };
    this.sunScale = 8.0;


    this.initCameras();


    //Background color
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.BLEND);
    this.enableTextures(true);

    //Initialize scene objects
    this.axis = new CGFaxis(this);
    this.sphere = new MySphere(this);
    this.sunQuad = new MyQuad(this);

    //Initialize Materials and lights
    this.initSunMaterial();
    this.initSkyboxMaterial();
    this.initLights();

    //Objects connected to MyInterface
    this.displayAxis = true;
    this.displaySphere = true;
    this.scaleFactor = 25;
  }

  initSunMaterial() {
    this.sunMaterial = new CGFappearance(this);
    this.sunMaterial.setEmission(1, 1, 1, 1); 
    this.sunMaterial.setAmbient(1, 1, 1, 1);
    this.sunMaterial.setDiffuse(0, 0, 0, 1);
    this.sunMaterial.setSpecular(0, 0, 0, 1);

    this.sunTexture = new CGFtexture(this, "textures/sun_texture.png");
    this.sunMaterial.setTexture(this.sunTexture);
  }

  initSkyboxMaterial() {
    this.skyboxMaterial = new CGFappearance(this);
    this.skyboxMaterial.setAmbient(0.1, 0.2, 0.4, 1.0); // Dark blue "base" color
    this.skyboxMaterial.setDiffuse(0.1, 0.2, 0.4, 1.0);
    this.skyboxMaterial.setSpecular(0, 0, 0, 1);
  }

  initLights() {
    this.lights[0].setPosition(
      this.sunPosition.x,
      this.sunPosition.y,
      this.sunPosition.z,
      0.0, // 0 because of directional
    );
    this.lights[0].setDiffuse(1.0, 0.95, 0.7, 1.0);
    this.lights[0].setSpecular(1.0, 0.95, 0.7, 1.0);
    this.lights[0].enable();
    this.lights[0].update();
  }

  syncSunLight() {
    // sync light[0] with current sunPosition
    this.lights[0].setPosition(
      this.sunPosition.x,
      this.sunPosition.y,
      this.sunPosition.z,
      0.0,
    );
    this.lights[0].update();
  }
  initCameras() {
    this.camera = new CGFcamera(
      0.4,
      0.1,
      500,
      vec3.fromValues(3, 3, 3),
      vec3.fromValues(0, 0, 0),
    );
  }
  setDefaultAppearance() {
    this.setAmbient(0.2, 0.4, 0.8, 1.0);
    this.setDiffuse(0.2, 0.4, 0.8, 1.0);
    this.setSpecular(0.2, 0.4, 0.8, 1.0);
    this.setShininess(10.0);
  }
  display() {
    // ---- BEGIN Background, camera and axis setup
    // Clear image and depth buffer everytime we update the scene
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    // Initialize Model-View matrix as identity (no transformation
    this.updateProjectionMatrix();
    this.loadIdentity();
    // Apply transformations corresponding to the camera position relative to the origin
    this.applyViewMatrix();

    // Draw axis
    if (this.displayAxis) this.axis.display();

    var sca = [
      this.scaleFactor,
      0.0,
      0.0,
      0.0,
      0.0,
      this.scaleFactor,
      0.0,
      0.0,
      0.0,
      0.0,
      this.scaleFactor,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
    ];

    // Draw sphere first so transparent sun can blend against it
    this.pushMatrix();
    this.multMatrix(sca);
    this.skyboxMaterial.apply();
    if (this.displaySphere) this.sphere.display();
    this.popMatrix();

    // Draw sun quad with alpha blending (depthMask off so transparent pixels don't occlude sphere)
    this.gl.depthMask(false);
    this.pushMatrix();
    this.translate(this.sunPosition.x, this.sunPosition.y, this.sunPosition.z);
    this.scale(this.sunScale, this.sunScale, this.sunScale);
    this.sunMaterial.apply();
    this.sunQuad.display();
    this.popMatrix();
    this.gl.depthMask(true);

    // ---- END Primitive drawing section
  }
}
