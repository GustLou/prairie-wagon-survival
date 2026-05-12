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
import { MyPlane } from "./MyPlane.js";
import { MyRock } from "./MyRock.js";
import { MyGrass } from "./MyGrass.js";

export class MyScene extends CGFscene {
  constructor() {
    super();
  }
  init(application) {
    super.init(application);

    this.grassBlades = []; // list of grass blades
    this.numGrass = 200;

    this.sunPosition = { x: 12, y: 8, z: -6 };
    this.sunScale = 0.3;

    this.initCameras();

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.BLEND);
    this.enableTextures(true);

    this.axis = new CGFaxis(this);
    this.sphere = new SkyBox(this, true);
    this.sunSphere = new SkyBox(this, false, false, 18, 8);

    // Ground controls
    this.ground = new MyPlane(this, 50);
    this.groundScale = 25;
    this.pathWidth = 0.03;

    this.numPatches = 25; // number of patches center
    this.bladesPerPatch = 15; // density of each grass patch

    for(let p = 0; p < this.numPatches; p++){
      // define the center of the patch and its general health
      let centerX = (Math.random() - 0.5) * (this.groundScale - 4.0);
      let centerZ = (Math.random() - 0.5) * (this.groundScale - 4.0);
      let patchHealth = Math.random();

      for(let b = 0; b < this.bladesPerPatch; b++){
        // natural circle 
        let angle = Math.random() * Math.PI * 2;
        let radius = 2.0 * Math.sqrt(Math.random());

        let wx = centerX + radius * Math.cos(angle);
        let wz = centerZ + radius * Math.sin(angle);

        // create the blade and inherit patch health with slight changes
        let levels = Math.floor(Math.random() * 2) + 2;
        let blade = new MyGrass(this,levels,0.1,0.3 + Math.random() * 0.3);

        blade.health = Math.max(0,Math.min(1,patchHealth + (Math.random()-0.5) * 0.2));

        this.grassBlades.push({
            object: blade,
            pos: [ wx, this.terrainHeight(wx, wz), wz ], // Correct height for rolling hills
            rot: Math.random() * Math.PI * 2,
            scale: 0.8 + Math.random() * 0.4
        });
      }
    }

    this.pathNumPoints = 12;
    this.pathSeed = 0;

    // Restore saved path from a previous session if one exists
    const savedPath = JSON.parse(localStorage.getItem('cgra_path') || 'null');
    if (savedPath) {
      this.pathNumPoints = savedPath.numPoints;
      this.pathSeed      = savedPath.seed;
      this.pathWidth     = savedPath.width ?? 0.03;
    }

    this.ground.generateMSTEdges(this.pathNumPoints, this.pathSeed);

    //Initialize Materials and lights
    this.initSunMaterial();
    this.initSkyboxMaterial();
    this.initGroundMaterial();
    this.initLights();
    this.initShader();

    // Shaders
    this.skyShader = new CGFshader(
      this.gl,
      "shaders/sky.vert",
      "shaders/sky.frag",
    );

    this.terrainShader = new CGFshader(
      this.gl,
      "shaders/terrain.vert",
      "shaders/terrain.frag",
    );
    // this.terrainShader.setUniformsValues({
    //   uColorMap: 0,
    //   uHeightMap: 1,
    //   uHeightScale: 0.09, // was 0.6 — much more subtle
    //   uAmbient: 0.6,
    //   uLightDir: [0.0, 0.8, 0.5],
    // });
    this.cloudSphere = new MyCloudSphere(this, 0.97, 40, 60);

    this.cloudAppearance = new CGFappearance(this);
    this.cloudAppearance.setAmbient(1.0, 1.0, 1.0, 1.0);
    this.cloudAppearance.setDiffuse(1.0, 1.0, 1.0, 1.0);
    this.cloudAppearance.setSpecular(0.0, 0.0, 0.0, 1.0);
    this.cloudAppearance.setShininess(1.0);

    this.cloudShader = new CGFshader(
      this.gl,
      "shaders/cloud.vert",
      "shaders/cloud.frag",
    );
    this.cloudShader.setUniformsValues({
      uTime: 0.000002,
      uDensity: 0.62,
      uScale: 12.4,
    });

    this.displayAxis = true;
    this.displaySphere = true;
    this.displayClouds = true;
    this.displayGround = true;
    this.pathWidth = 0.03;
    this.scaleFactor = 25;
    this.cloudSpeed = 0.001;
    this.cloudDensity = 0.62;
    this.cloudScale = 6.0;
    this._cloudTime = 0.0;
    this._accumulatedTime = 0;
    this.setUpdatePeriod(16);

    this.rockSeed      = 0.0;
    this.rockRoughness = 0.18;
    this.rockScale     = 0.5;
    this.rockTexBlend  = 0.0;
    this.displayRock   = false;
    this.rock = new MyRock(
    this, this.rockSeed, 32, 24, this.rockRoughness,'textures/white_rock_texture.jpg','textures/black_rock_texture.jpg');
  }

  update(t) {
    this._accumulatedTime += t;
    this._cloudTime = (this._accumulatedTime / 10e11) * this.cloudSpeed;

    this.windShader.setUniformsValues({ uTime: this._accumulatedTime / 1500.0 });
  }

  // CPU replicas of terrain.vert noise/fbm — used to place grass at correct height
  // we are simply replicating what was done in the vert shader to sync the poisition of the objects with the ground
  _random(x, y) {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
    return s - Math.floor(s);
  }

  _noise(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix,        fy = y - iy;
    const a = this._random(ix,     iy);
    const b = this._random(ix + 1, iy);
    const c = this._random(ix,     iy + 1);
    const d = this._random(ix + 1, iy + 1);
    // Quintic interpolation — matches terrain.vert
    const ux = fx*fx*fx*(fx*(fx*6 - 15) + 10);
    const uy = fy*fy*fy*(fy*(fy*6 - 15) + 10);
    return a + (b-a)*ux + (c-a)*uy*(1-ux) + (d-b)*ux*uy;
  }

  _fbm(x, y) {
    let v = 0, amp = 0.5, freq = 1;
    for (let i = 0; i < 3; i++) {
      v += amp * this._noise(x * freq, y * freq);
      amp *= 0.5; freq *= 2;
    }
    return v;
  }

  // Returns the world-space Y height of the terrain at world position (wx, wz).
  // Mirrors: float h = fbm(aVertexPosition.xy * 1.5); displaced.z += h * uHeightScale;
  // then scaled by groundScale via the model matrix.
  terrainHeight(wx, wz) {
    const lx =  (wx / this.groundScale) * 1.5;
    const ly = -(wz / this.groundScale) * 1.5; // local Y = -world Z (due to -90° X rotation)
    return this._fbm(lx, ly) * 0.13 * this.groundScale;
  }

  initShader() {
    this.sunShader = new CGFshader(
      this.gl,
      "shaders/sun.vert",
      "shaders/sun.frag",
    );
    this.sunShader.setUniformsValues({ uSampler: 0 });

    this.windShader = new CGFshader(
      this.gl,
      "shaders/wind.vert",
      "shaders/wind.frag",
    );
    this.windShader.setUniformsValues({ uTime: 0.0 });
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

  initGroundMaterial() {
    this.groundMaterial = new CGFappearance(this);
    this.groundMaterial.setAmbient(0.7, 0.7, 0.7, 1.0);
    this.groundMaterial.setDiffuse(1.0, 1.0, 1.0, 1.0);
    this.groundMaterial.setSpecular(0.0, 0.0, 0.0, 1.0);
    this.groundMaterial.setShininess(10.0);

    this.groundDirtTexture = new CGFtexture(this, "textures/dirt2.png");
    this.groundColorTexture = new CGFtexture(
      this,
      "textures/terrainTexture.jpg",
    );
    this.groundHeightTexture = new CGFtexture(this, "textures/terrainMap.jpg");

    this.groundPathTexture = new CGFtexture(this, "textures/pathTexture.png");
    this.groundMaterial.setTexture(this.groundColorTexture);
    this.groundMaterial.setTextureWrap("REPEAT", "REPEAT");
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
      vec3.fromValues(2, 6, 4),
      vec3.fromValues(0, 0, 0),
    );
  }

  setDefaultAppearance() {
    this.setAmbient(0.0, 0.0, 0.0, 1.0);
    this.setDiffuse(0.0, 0.0, 0.0, 1.0);
    this.setSpecular(0.0, 0.0, 0.0, 1.0);
    this.setEmission(0.4, 0.65, 1.0, 1.0);
  }

  rebuildGrass() {
    this.grassBlades = [];

    for (let p = 0; p < this.numPatches; p++) {
        let centerX = (Math.random() - 0.5) * (this.groundScale - 4.0);
        let centerZ = (Math.random() - 0.5) * (this.groundScale - 4.0);
        let patchHealth = Math.random();

        for (let b = 0; b < this.bladesPerPatch; b++) {
            let angle = Math.random() * Math.PI * 2;
            let radius = 2.0 * Math.sqrt(Math.random());
            
            let wx = centerX + radius * Math.cos(angle);
            let wz = centerZ + radius * Math.sin(angle);

            let levels = Math.floor(Math.random() * 2) + 2;
            let blade = new MyGrass(this, levels, 0.1, 0.2 + Math.random() * 0.3);
            blade.health = Math.max(0, Math.min(1, patchHealth + (Math.random() - 0.5) * 0.2));

            this.grassBlades.push({
                object: blade,
                pos: [wx, this.terrainHeight(wx, wz), wz],
                rot: Math.random() * Math.PI * 2,
                scale: 0.8 + Math.random() * 0.4
            });
        }
    }
}

  rebuildPath() {
    this.ground.generateMSTEdges(this.pathNumPoints, this.pathSeed);
  }

  newRandomPath() {
    this.pathSeed = Math.floor(Math.random() * 1000);
    this.ground.generateMSTEdges(this.pathNumPoints, this.pathSeed);
  }

  saveCurrentPath() {
    localStorage.setItem('cgra_path', JSON.stringify({
      numPoints: this.pathNumPoints,
      seed:      this.pathSeed,
      width:     this.pathWidth,
    }));
  }

  printSavedPath() {
    const raw = localStorage.getItem('cgra_path');
    if (!raw) { alert('No path saved yet.'); return; }
    const p = JSON.parse(raw);
    const msg = `Saved path\n  Nodes : ${p.numPoints}\n  Seed  : ${p.seed}\n  Width : ${p.width}`;
    console.log(msg);
    alert(msg);
  }

  rebuildRock() {
    this.rock = new MyRock(
        this, this.rockSeed, 16, 24, this.rockRoughness,
        this.rock.tex0 ? this.rock.tex0.image.src.replace(location.href, '') : null,
        this.rock.tex1 ? this.rock.tex1.image.src.replace(location.href, '') : null
    );
  }

  display() {
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.updateProjectionMatrix();
    this.loadIdentity();
    this.applyViewMatrix();
    this.syncSunLight();

    if (this.displayAxis) this.axis.display();
    if (this.displayGround) {
      this.pushMatrix();
      this.rotate(-Math.PI / 2, 1, 0, 0);
      this.scale(this.groundScale, this.groundScale, this.groundScale);

      this.groundColorTexture.bind(0);
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_WRAP_S,
        this.gl.REPEAT,
      );
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_WRAP_T,
        this.gl.REPEAT,
      );
      this.groundHeightTexture.bind(1);
      this.groundDirtTexture.bind(2);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
      this.groundPathTexture.bind(3);
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_WRAP_S,
        this.gl.REPEAT,
      );
      this.gl.texParameteri(
        this.gl.TEXTURE_2D,
        this.gl.TEXTURE_WRAP_T,
        this.gl.REPEAT,
      );

      this.setActiveShader(this.terrainShader);
      this.terrainShader.setUniformsValues({
        uColorMap: 0,
        uHeightMap: 1,
        uDirtMap: 2,
        uPathMap: 3,
        uHeightScale: 0.13,
        uAmbient: 0.6,
        uLightDir: [0.0, 0.8, 0.5],
        uPathWidth: this.pathWidth,
      });
      // Pass MST edges
      const prog = this.terrainShader.program;
      this.gl.uniform4fv(this.gl.getUniformLocation(prog, 'uPathEdges'), this.ground.pathEdges);
      this.gl.uniform1i(this.gl.getUniformLocation(prog, 'uNumEdges'), this.ground.numEdges);
      this.ground.display();
      this.setActiveShader(this.defaultShader);
      this.popMatrix();
    }

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
        uTime: this._cloudTime,
        uDensity: this.cloudDensity,
        uScale: this.cloudScale,
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

    if (this.displayRock) {
      this.pushMatrix();
      this.scale(this.rockScale, this.rockScale, this.rockScale);
      this.rock.rockShader.setUniformsValues({ uTexBlend: this.rockTexBlend });
      this.rock.display();
      this.popMatrix();
    }

    this.setActiveShader(this.windShader);

    // Example wind parameters
    this.windShader.setUniformsValues({ 
        uWindStrength: 0.2,
        uWindSpeed: 1.5 
    });

    for (let i = 0; i < this.grassBlades.length; i++) {
    let g = this.grassBlades[i];

    this.windShader.setUniformsValues({
        uHealth: g.object.health,
        uBladeWorldPos: [g.pos[0], g.pos[2]]
    });
    
    this.pushMatrix();
    this.translate(g.pos[0], g.pos[1], g.pos[2]);
    this.rotate(g.rot, 0, 1, 0);
    this.scale(g.scale, g.scale, g.scale);
    
    g.object.display();
    this.popMatrix();
}
    // ---- END Primitive drawing section
  }
}
