import { CGFscene, CGFcamera, CGFaxis, CGFshader, CGFappearance } from "../lib/CGF.js";
import { MySphere } from "./Sphere.js";
import { MyCloudSphere } from "./MyCloudSphere.js";

export class MyScene extends CGFscene {
  constructor() {
    super();
  }
  init(application) {
    super.init(application);
    
    this.initCameras();
    this.initLights();

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clearDepth(100.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.depthFunc(this.gl.LEQUAL);

    this.axis = new CGFaxis(this);
    this.sphere = new MySphere(this);
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
    this.displaySphere = true;
    this.displayClouds = true;
    this.scaleFactor   = 25;
    this.cloudSpeed = 0.004;
    this.cloudDensity  = 0.62;
    this.cloudScale    = 12.4;
    this._cloudTime    = 0.0;
    this._accumulatedTime = 0;
    this.setUpdatePeriod(16);
  }

  update(t) {
    this._accumulatedTime += t; 
    this._cloudTime = (this._accumulatedTime / 1000000000000.0) * this.cloudSpeed;
  }

  initLights() {
    this.lights[0].setPosition(15, 2, 5, 1);
    this.lights[0].setDiffuse(1.0, 1.0, 1.0, 1.0);
    this.lights[0].enable();
    this.lights[0].update();
  }

  initCameras() {
    this.camera = new CGFcamera(
      0.4, 0.1, 500,
      vec3.fromValues(15, 15, 15),
      vec3.fromValues(0, 0, 0)
    );
  }

  setDefaultAppearance() {
    this.setAmbient(0.0, 0.0, 0.0, 1.0);
    this.setDiffuse(0.0, 0.0, 0.0, 1.0);
    this.setSpecular(0.0, 0.0, 0.0, 1.0);
    this.setEmission(0.4, 0.65, 1.0, 1.0);
  }

  display() {
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.updateProjectionMatrix();
    this.loadIdentity();
    this.applyViewMatrix();

    if (this.displayAxis) this.axis.display();

    this.setDefaultAppearance();

    var sca = [
      this.scaleFactor, 0.0, 0.0, 0.0,
      0.0, this.scaleFactor, 0.0, 0.0,
      0.0, 0.0, this.scaleFactor, 0.0,
      0.0, 0.0, 0.0, 1.0,
    ];
    this.multMatrix(sca);

    if (this.displaySphere) {
      this.setActiveShader(this.defaultShader);

      this.sphere.display();
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
      
      this.setDefaultShader();
      this.gl.depthMask(true);
      this.gl.disable(this.gl.BLEND);
    }
  }
}