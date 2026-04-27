import { CGFscene, CGFcamera, CGFaxis, CGFshader } from "../lib/CGF.js";
import { SkyBox } from "./SkyBox.js";

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
    
    this.initCameras();
    this.initLights();

    //Background color
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);

    this.gl.clearDepth(100.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.depthFunc(this.gl.LEQUAL);

    //Initialize scene objects
    this.axis = new CGFaxis(this);
    this.sphere = new SkyBox(this);

    // Shaders
    this.skyShader = new CGFshader(this.gl, "shaders/sky.vert", "shaders/sky.frag");

    //Objects connected to MyInterface
    this.displayAxis = true;
    this.displaySphere = true
    this.scaleFactor = 25;

    // // Azimuth = horizontal rotation (0 to 360)
    // // Elevation = vertical height (-90 to 90, 0 is horizon)
    // this.sunAzimuth = 180;
    // this.sunElevation = 15;
  }
  initLights() {
    this.lights[0].setPosition(15, 2, 5, 1);
    this.lights[0].setDiffuse(1.0, 1.0, 1.0, 1.0);
    this.lights[0].enable();
    this.lights[0].update();
  }
  initCameras() {
    this.camera = new CGFcamera(
      0.4,
      0.1,
      500,
      vec3.fromValues(15, 15, 15),
      vec3.fromValues(0, 0, 0)
    );
  }
  setDefaultAppearance() {
    this.setAmbient(0.2, 0.4, 0.8, 1.0);
    this.setDiffuse(0.2, 0.4, 0.8, 1.0);
    this.setSpecular(0.2, 0.4, 0.8, 1.0);
    this.setShininess(10.0);
  }

  // updateSunPosition() {
  //   // Convert degrees to radians
  //   let az = this.sunAzimuth * Math.PI / 180;
  //   let el = this.sunElevation * Math.PI / 180;

  //   // Calculate X, Y, Z based on spherical coordinates
  //   let sunX = Math.cos(el) * Math.sin(az);
  //   let sunY = Math.sin(el);
  //   let sunZ = Math.cos(el) * Math.cos(az);

  //   // Send the values to the fragment shader
  //   this.skyShader.setUniformsValues({ uSunPosition: [sunX, sunY, sunZ] });
  // }

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

    this.setDefaultAppearance();

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

    this.multMatrix(sca);

    // ---- BEGIN Primitive drawing section

    if (this.displaySphere) {
      // 1. Update sun position based on interface
      // this.updateSunPosition();
      
      // 2. Activate custom shader
      this.setActiveShader(this.skyShader);
      
      // 3. Draw sphere
      this.sphere.display();
      
      // 4. Restore default shader for any other objects you draw later
      this.setActiveShader(this.defaultShader); 
  }

    // ---- END Primitive drawing section
  }
}
