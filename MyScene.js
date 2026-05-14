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
import { MyLSTree } from "./tree/MyLSTree.js";
import { MyLSFlower } from "./tree/MyLSFlower.js";

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
    this.initTrees();

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
    this.uHeightScale = 0.13;

    this.numPatches = 25; // number of patches center
    this.bladesPerPatch = 15; // density of each grass patch
    this.grassScaleFactor = 1.0;

    this.pathNumPoints = 12;
    this.pathSeed = 0;

    // Restore saved path from a previous session if one exists
    const savedPath = JSON.parse(localStorage.getItem('cgra_path') || 'null');
    if (savedPath) {
      this.pathNumPoints = savedPath.numPoints;
      this.pathSeed      = savedPath.seed;
      this.pathWidth     = savedPath.width ?? 0.03;
    }

    // Path edges must exist before grass is generated so isOnPath works
    this.edges = this.ground.generateMSTEdges(this.pathNumPoints, this.pathSeed);

    this.rebuildGrass();

    // rock controls
    this.rocks = [];
    this.numRocks = 8;
    this.rockSpawnSeed  = 27.1;
    this.rockScaleFactor = 0.25;
    this.rockTexBlend = 0.5;
    this.rockMinDistanceToPath = 0.075;

    // tree contols
    this.treeMinDistanceToPath = 0.03;
    this.flowerMinDistanceToPath = 0.03;
    this.flowerDensity = 0.1; // amount of flwoers per unit squared
    this.treeDensity = 0.1; // amount of trees per unit squared
    this.grassMinDistanceToPath = 0.03;

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
    
    // change this variable to start with everything displayed or not by default
    // TODO: remove this debug logic before final submission
    this.displayAll      = false;
    this.displayAxis      = this.displayAll;
    this.displaySky       = this.displayAll;
    this.displaySun       = this.displayAll;
    this.displayClouds    = this.displayAll;
    this.displayGround    = this.displayAll;
    this.displayTree      = this.displayAll;
    this.displayFlower    = this.displayAll;
    this.displayGrass     = this.displayAll;
    this.displayRock      = this.displayAll;

    this.pathWidth = 0.03;

    this.globalScaleFactor = 1;
    this.skyScaleFactor    = 25;
    this.treeScaleFactor   = 0.5;
    this.flowerScaleFactor = 0.5;

    this.cloudSpeed        = 0.001;
    this.cloudDensity      = 0.62;
    this.cloudSize        = 6.0; // as in how small the clouds are, the half-sphere radius is defined with skyScaleFactor
    this._cloudTime        = 0.0;
    this._accumulatedTime  = 0;
    this.setUpdatePeriod(16);

    this.rock = new MyRock(
      this,
      this.rockSeed,
      8,
      6,
      0.08,
      'textures/white_rock_texture.jpg',
      'textures/black_rock_texture.jpg',
    );

    this.generateTrees();
    this.generateFlowers();
    this.generateRocks();
  }

  toggleDisplayAll() {
    const newValue = !this.displayAll;

    this.displayAll       = newValue;
    this.displayAxis      = newValue;
    this.displaySky       = newValue;
    this.displaySun       = newValue;
    this.displayClouds    = newValue;
    this.displayGround    = newValue;
    this.displayTree      = newValue;
    this.displayFlower    = newValue;
    this.displayGrass     = newValue;
    this.displayRock      = newValue;
  }

  // Shortest distance from point (px, pz) to segment (x1, z1) -> (x2, z2)
  _distToSegment(px, pz, x1, z1, x2, z2) {
      const l2 = (x2 - x1) ** 2 + (z2 - z1) ** 2;
      if (l2 === 0) return Math.sqrt((px - x1) ** 2 + (pz - z1) ** 2);
      let t = ((px - x1) * (x2 - x1) + (pz - z1) * (z2 - z1)) / l2;
      t = Math.max(0, Math.min(1, t));
      return Math.sqrt((px - (x1 + t * (x2 - x1))) ** 2 + (pz - (z1 + t * (z2 - z1))) ** 2);
  }

  isOnPath(wx, wz) {
    // Map world coordinates [-12.5, 12.5] to UV space [0, 1]
    const u = (wx / this.groundScale) + 0.5;
    const v = (wz / this.groundScale) + 0.5;
    
    const edges = this.ground.pathEdges;
    const threshold = this.pathWidth * 1.5; // Added 1.5x buffer for a cleaner "mowed" edge

    for (let i = 0; i < this.ground.numEdges * 4; i += 4) {
        const x1 = edges[i];   const y1 = edges[i+1];
        const x2 = edges[i+2]; const y2 = edges[i+3];

        if (this._distToSegment(u, v, x1, y1, x2, y2) < threshold) {
            return true;
        }
    }
    return false;
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
    return this._fbm(lx, ly) * this.uHeightScale * this.groundScale;
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

  initTrees() {
    this.axiom = "X";
    this.angle = 30.0;
    this.iterations = 5;
    this.treeScaleFactor= 0.5;
  }

  rebuildGrass() {
    this.grassBlades = [];

    for (let p = 0; p < this.numPatches; p++) {
        let normCenterX = Math.random() - 0.5;
        let normCenterZ = Math.random() - 0.5;
        let patchHealth = Math.random();

        for (let b = 0; b < this.bladesPerPatch; b++) {
            let angle = Math.random() * Math.PI * 2;
            let radius = 2.0 * Math.sqrt(Math.random());
            
            let offsetX = radius * Math.cos(angle);
            let offsetZ = radius * Math.sin(angle);

            let tempWx = (normCenterX * (this.groundScale - 4.0)) + offsetX;
            let tempWz = (normCenterZ * (this.groundScale - 4.0)) + offsetZ;

            if (this.isOnPath(tempWx, tempWz)) continue;

            let levels = Math.floor(Math.random() * 2) + 2;
            let blade = new MyGrass(this, levels, 0.1, 0.1 + Math.random() * 0.2);
            blade.health = Math.max(0, Math.min(1, patchHealth + (Math.random() - 0.5) * 0.2));

            this.grassBlades.push({
                object: blade,
                normCenterX: normCenterX,
                normCenterZ: normCenterZ,
                offsetX: offsetX,
                offsetZ: offsetZ,
                rot: Math.random() * Math.PI * 2,
                scale: 0.8 + Math.random() * 0.4
            });
        }
    }
  }

makeRng(seed) {
    let s = (seed * 9301 + 1) >>> 0 || 1;
    return () => {
        s += 0x6D2B79F5;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

  rebuildPath() {
    this.ground.generateMSTEdges(this.pathNumPoints, this.pathSeed);
    this.rebuildGrass();
  }

  newRandomPath() {
    this.pathSeed = Math.floor(Math.random() * 1000);
    this.edges = this.ground.generateMSTEdges(this.pathNumPoints, this.pathSeed);
    this.rebuildGrass();
    this.scene.generateTrees();
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


  display() {
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.updateProjectionMatrix();
    this.loadIdentity();
    this.applyViewMatrix();
    this.syncSunLight();

    if (this.displayAxis) this.axis.display();

    // to be applied to everything (must be added manually inside each pushMatrix-popMatrix codeblock)
    var sca = [
      this.globalScaleFactor,
      0.0,
      0.0,
      0.0,
      0.0,
      this.globalScaleFactor,
      0.0,
      0.0,
      0.0,
      0.0,
      this.globalScaleFactor,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
    ];

    if (this.displayGround) {
      this.pushMatrix();
        this.multMatrix(sca);

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
          uHeightScale: this.uHeightScale,
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

    this.pushMatrix();
      this.multMatrix(sca);
      this.scale(this.skyScaleFactor, this.skyScaleFactor, this.skyScaleFactor);

      if (this.displaySky) {
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
          uScale: this.cloudSize,
        });
        this.cloudSphere.display();

        this.setActiveShader(this.defaultShader);
        this.gl.depthMask(true);
        this.gl.disable(this.gl.BLEND);
      }
    this.popMatrix();

    if (this.displaySun && this.sunPosition) {
      this.pushMatrix();
        this.multMatrix(sca);
        this.translate(this.sunPosition.x, this.sunPosition.y, this.sunPosition.z);
        this.scale(this.sunScale, this.sunScale, this.sunScale);
        this.sunMaterial.apply();
        this.setActiveShader(this.sunShader); // use sun glow shader
        this.updateSunShaderUniforms();
        this.sunSphere.display();
        this.setActiveShader(this.defaultShader);
      this.popMatrix();
    }

    if (this.displayRock && this.rockPositions) {
      // Set the uniform once for all rocks
      this.rock.rockShader.setUniformsValues({ uTexBlend: this.rockTexBlend });

      for (let i = 0; i < this.rockPositions.length; i++) {
        let pos = this.rockPositions[i];

        // 1. Calculate dynamic world positions based on current ground scale
        let wx = pos.normX * this.groundScale;
        let wz = pos.normZ * this.groundScale;
        
        // 2. Fetch the terrain height so the rock sits on the ground
        let wy = this.terrainHeight(wx, wz);

        this.pushMatrix();
          this.multMatrix(sca);
          this.translate(wx, wy, wz); // Move rock to its spot on the terrain
          
          // Apply random rotations so rocks don't all look identical
          this.rotate(pos.rotY, 0, 1, 0); 
          this.rotate(pos.rotX, 1, 0, 0);
          this.rotate(pos.rotZ, 0, 0, 1);
          
          const finalScale = pos.scale * this.rockScaleFactor;
          this.scale(finalScale, finalScale, finalScale);
          
          this.rock.display();
        this.popMatrix();
      }
    }

    this.setActiveShader(this.windShader);

    // Example wind parameters
    this.windShader.setUniformsValues({ 
        uWindStrength: 0.2,
        uWindSpeed: 1.5 
    });

    if (this.displayGrass) {
      for (let i = 0; i < this.grassBlades.length; i++) {
        let g = this.grassBlades[i];
  
        // 1. Calculate the real world position dynamically 
        let wx = (g.normCenterX * (this.groundScale - 4.0)) + g.offsetX;
        let wz = (g.normCenterZ * (this.groundScale - 4.0)) + g.offsetZ;
        
        // 2. Fetch the terrain height at the new scaled position
        let wy = this.terrainHeight(wx, wz);
  
        this.windShader.setUniformsValues({
            uHealth: g.object.health,
            uBladeWorldPos: [wx, wz]
        });
        
        this.pushMatrix();
          this.multMatrix(sca);
          this.translate(wx, wy, wz); // Use dynamically calculated pos
          this.rotate(g.rot, 0, 1, 0);
          const finalScale = g.scale * this.grassScaleFactor;
          this.scale(finalScale, finalScale, finalScale);
          
          g.object.display();
        this.popMatrix();
      }
    }
    this.setActiveShader(this.defaultShader);
    
    this.setAmbient(0.2, 0.4, 0.8, 1.0);
    this.setDiffuse(0.2, 0.4, 0.8, 1.0);
    this.setSpecular(0.2, 0.4, 0.8, 1.0);
    this.setEmission(0.0, 0.0, 0.0, 1.0);
    this.setShininess(10.0);

    if (this.displayTree && this.treePositions) {
      for (let i = 0; i < this.treePositions.length; i++) {
        let pos = this.treePositions[i];

        const finalX = pos.x * this.groundScale + pos.randomOffset;
        const finalZ = pos.z * this.groundScale + pos.randomOffset;
        const finalY = this.terrainHeight(finalX, finalZ);
        
        this.pushMatrix();
          this.multMatrix(sca);

          this.translate(finalX, finalY, finalZ);
          this.rotate(pos.rotation, 0, 1, 0);
          const finalScale = pos.scale * this.treeScaleFactor;
          this.scale(finalScale, finalScale, finalScale);
          
          pos.obj.display();
        
        this.popMatrix();
      }
    }

    if (this.displayFlower && this.flowerPositions) {
      for (let i = 0; i < this.flowerPositions.length; i++) {
        let pos = this.flowerPositions[i];

        const finalX = pos.x * this.groundScale + pos.randomOffset;
        const finalZ = pos.z * this.groundScale + pos.randomOffset;
        const finalY = this.terrainHeight(finalX, finalZ);
        
        this.pushMatrix();
          this.multMatrix(sca);
          
          this.translate(finalX, finalY, finalZ);
          this.rotate(pos.rotation, 0, 1, 0);
          const finalScale = pos.scale * this.flowerScaleFactor;
          this.scale(finalScale, finalScale, finalScale);
          
          pos.obj.display();
        this.popMatrix();
      }
    }
  }

  generateTrees() {
    this.treePositions = [];
    const area = this.groundScale * this.groundScale;
    const numTrees = Math.round(area * this.treeDensity);

    let failedAttempts = 0;
    for (let i = 0; i < numTrees; i++) {
      const randomX = (Math.random() - 0.5);
      const randomZ = (Math.random() - 0.5);
      const randomW = Math.random() * 0.5 + 0.25;
      const randomL = Math.random() * 20 + Math.random() * randomW * 30 + 10;
      
      const obj = new MyLSTree(this, randomW, randomL);
      obj.init();
      
      if (this.checkOutsideAllEdges({ x: randomX, z: randomZ }, this.treeMinDistanceToPath)) {
        this.treePositions.push({
          obj: obj,
          x: randomX,
          z: randomZ,
          randomOffset: 0,
          scale: 0.6 + Math.random() * 0.8,
          rotation: Math.random() * Math.PI * 2,
        });
      } else if (failedAttempts < numTrees) {
        failedAttempts++;
        i--;
      } else {
        // the tree density is calculated based on the total area of the ground, so if we're failing so much,
        // it means the available area is too small and shouldn't have too many trees
        break;
      }
    }
  }

  generateFlowers() {
    this.flowerPositions = [];
    const area = this.groundScale * this.groundScale;
    const numFlowers = Math.round(area * this.flowerDensity);

    let failedAttempts = 0;
    for (let i = 0; i < numFlowers; i++) {
      const randomX = (Math.random() - 0.5);
      const randomZ = (Math.random() - 0.5);
      const randomW = Math.random() * 0.2 + 0.1;
      const randomLL = Math.random()*0.6 + 0.2;
      const randomP = Math.round(Math.random() * 6) + 4;
      const randomPL = Math.random()+0.6;
      
      const obj = new MyLSFlower(this, randomW, 3,8, randomLL, 0.3, randomP, randomPL);
      obj.init();
      
      if (this.checkOutsideAllEdges({ x: randomX, z: randomZ }, this.flowerMinDistanceToPath)) {
        this.flowerPositions.push({
          obj: obj,
          x: randomX,
          z: randomZ,
          randomOffset: 0,
          scale: 0.6 + Math.random() * 0.8,
          rotation: Math.random() * Math.PI * 2,
        });
      } else if (failedAttempts < numFlowers) {
        failedAttempts++;
        i--;
      } else {
        // the flower density is calculated based on the total area of the ground, so if we're failing so much,
        // it means the available area is too small and shouldn't have too many flowers
        break;
      }
    }
  }

  generateRocks() {
    this.rockPositions = [];
    let failedAttempts = 0;

    for (let i = 0; i < this.numRocks; i++) {
      let normX = (Math.random() - 0.5);
      let normZ = (Math.random() - 0.5);
      
      if (this.checkOutsideAllEdges({ x: normX, z: normZ }, this.rockMinDistanceToPath)) {
        this.rockPositions.push({
          normX: normX,
          normZ: normZ,
          scale: 0.5 + Math.random() * 1.0, // Randomize size a bit
          rotX: Math.random() * Math.PI * 2, // Rocks look better with random 3D rotations
          rotY: Math.random() * Math.PI * 2,
          rotZ: Math.random() * Math.PI * 2
        });
      } else if (failedAttempts < this.numRocks * 2) {
        // If we hit the path, try again
        failedAttempts++;
        i--;
      } else {
        // the rock density is calculated based on the total area of the ground, so if we're failing so much,
        // it means the available area is too small and shouldn't have too many flowers
        break;
      }
    }
  }

  checkOutsideAllEdges(obj, tolerance = 0.05) {
    for (const edge of this.edges) {
      if (!this.checkOutsideEdge(obj, edge, tolerance)) {
        return false;
      }
    }
    return true;
  }

  checkOutsideEdge(tree, edge, tolerance = 0.05) {
    const [start, end] = edge;

    // Edges are in [0, 1] space, but the 'tree' object is in [-0.5, 0.5] space.
    // Shift the tree coordinates back to [0, 1] for accurate math.
    const tx = tree.x + 0.5;
    const tz = tree.z + 0.5;

    // Calculate edge unitvector
    const dx = end[0] - start[0];
    const dz = end[1] - start[1];
    const l2 = dx * dx + dz * dz; // Length squared

    // Handle the edge case of a zero-length path segment
    if (l2 === 0) {
      const dist = Math.sqrt(Math.pow(tx - start[0], 2) + Math.pow(tz - start[1], 2));
      return dist > (this.pathWidth + tolerance);
    }

    // 't' is the projection of the tree onto the infinite line, 
    // clamped between 0 and 1 so it doesn't overshoot the line segment.
    let t = ((tx - start[0]) * dx + (tz - start[1]) * dz) / l2;
    t = Math.max(0, Math.min(1, t));

    const closestX = start[0] + t * dx;
    const closestZ = start[1] + t * dz;

    const distance = Math.sqrt(Math.pow(tx - closestX, 2) + Math.pow(tz - closestZ, 2));

    return distance > (this.pathWidth + tolerance);
  }
}
