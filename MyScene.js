import {
  CGFscene,
  CGFcamera,
  CGFaxis,
  CGFappearance,
  CGFtexture,
  CGFshader,
} from "../lib/CGF.js";
import { SkyBox } from "./SkyBox.js";
import { MyCloudSphere } from "./MyCloudSphere.js";

export class MyScene extends CGFscene {
  constructor() {
    super();
  }
  init(application) {
    super.init(application);

    this.sunPosition = { x: 12, y: 8, z: -6 };
    this.sunScale = 0.3;

    this.initCameras();

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.BLEND);
    this.enableTextures(true);

    this.axis = new CGFaxis(this);
    this.sphere = new SkyBox(this);
    this.sunSphere = new SkyBox(this, false);

    //Initialize Materials and lights
    this.initSunMaterial();
    this.initSkyboxMaterial();
    this.initLights();
    this.initShader();

    // Shaders
    this.skyShader = new CGFshader(this.gl, "shaders/sky.vert", "shaders/sky.frag");
    this.cloudSphere = new MyCloudSphere(this, 0.97, 40, 60);

    this.cloudAppearance = new CGFappearance(this);
    this.cloudAppearance.setAmbient(1.0, 1.0, 1.0, 1.0);
    this.cloudAppearance.setDiffuse(1.0, 1.0, 1.0, 1.0);
    this.cloudAppearance.setSpecular(0.0, 0.0, 0.0, 1.0);
    this.cloudAppearance.setShininess(1.0);

    this.cloudShader = new CGFshader(
      this.gl,
      "shaders/cloud.vert",
      "shaders/cloud.frag"
    );
    this.cloudShader.setUniformsValues({
      uTime:    0.000002,
      uDensity: 0.62,
      uScale:   12.4,
    });

    this.displayAxis   = true;
    this.displaySphere = true;;
    this.displayClouds = true;
    this.scaleFactor   = 25;
    this.cloudSpeed = 0.001;
    this.cloudDensity  = 0.62;
    this.cloudScale    = 6.0;
    this._cloudTime    = 0.0;
    this._accumulatedTime = 0;
    this.setUpdatePeriod(16);
  }

  update(t) {
    this._accumulatedTime += t; 
    this._cloudTime = (this._accumulatedTime / 10e11) * this.cloudSpeed;
  }


  initShader() {
    this.sunShader = new CGFshader(
      this.gl,
      "shaders/sun.vert",
      "shaders/sun.frag",
    );
    this.sunShader.setUniformsValues({ uSampler: 0 });
  }

  updateSunShaderUniforms() {
    const camPos = [
      this.camera.position[0],
      this.camera.position[1],
      this.camera.position[2],
    ];

    // forward vector from camera position -> camera target
    const camDir = vec3.create();
    vec3.sub(camDir, this.camera.target, this.camera.position);
    vec3.normalize(camDir, camDir);

    this.sunShader.setUniformsValues({
      uCameraPosition: camPos,
      uCameraDirection: [camDir[0], camDir[1], camDir[2]],
      uSunCenter: [this.sunPosition.x, this.sunPosition.y, this.sunPosition.z],
    });
  }

  initSunMaterial() {
    this.sunMaterial = new CGFappearance(this);
    this.sunMaterial.setEmission(1, 1, 1, 1);
    this.sunMaterial.setAmbient(1, 1, 1, 1);
    this.sunMaterial.setDiffuse(0, 0, 0, 1);
    this.sunMaterial.setSpecular(0, 0, 0, 1);

    this.sunTexture = new CGFtexture(this, "textures/sun_texture_2.jpg");
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
    this.setAmbient(0.0, 0.0, 0.0, 1.0);
    this.setDiffuse(0.0, 0.0, 0.0, 1.0);
    this.setSpecular(0.0, 0.0, 0.0, 1.0);
    this.setEmission(0.4, 0.65, 1.0, 1.0);
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
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.updateProjectionMatrix();
    this.loadIdentity();
    this.applyViewMatrix();

    if (this.displayAxis) this.axis.display();

    var sca = [
      this.scaleFactor, 0.0, 0.0, 0.0,
      0.0, this.scaleFactor, 0.0, 0.0,
      0.0, 0.0, this.scaleFactor, 0.0,
      0.0, 0.0, 0.0, 1.0,
    ];

    // this.multMatrix(sca);
    // Draw sphere first so transparent sun can blend against it

    this.pushMatrix();
    this.multMatrix(sca);
    if (this.displaySphere) {
      this.skyboxMaterial.apply();

      this.setActiveShader(this.skyShader);
      
      this.sphere.display();
      this.setActiveShader(this.defaultShader);
    }

    if (this.displayClouds) {
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
      this.gl.depthMask(false);

      this.setActiveShader(this.cloudShader);

      this.cloudAppearance.apply();

      this.cloudShader.setUniformsValues({  
        uTime:    this._cloudTime,
        uDensity: this.cloudDensity,
        uScale:   this.cloudScale,
      });
      this.cloudSphere.display();
      
      this.setActiveShader(this.defaultShader);
      this.gl.depthMask(true);
      this.gl.disable(this.gl.BLEND);
    }
    this.popMatrix();

    this.pushMatrix();
    this.translate(this.sunPosition.x, this.sunPosition.y, this.sunPosition.z);
    this.scale(this.sunScale, this.sunScale, this.sunScale);
    this.sunMaterial.apply();
    this.setActiveShader(this.sunShader); // use sun glow shader
    this.updateSunShaderUniforms();
    this.sunSphere.display();
    this.setActiveShader(this.defaultShader);
    this.popMatrix();
    // ---- END Primitive drawing section
  }
}
