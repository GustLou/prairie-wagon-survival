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
import { MyBarn } from "./MyBarn.js";
import { MyCircularFence } from "./MyCircularFence.js";
import { MySquareFence } from "./MySquareFence.js";
import { MyHaySilo } from "./MyHaySilo.js";
import { MyHay } from "./hay/MyHay.js";
import { MyWagon } from "./wagon/MyWagon.js";
import { MyArrow } from "./hay/MyArrow.js";

export class MyScene extends CGFscene {
  constructor() {
    super();
  }
  init(application) {
    super.init(application);

    this.grassBlades = []; // list of grass blades
    this.numGrass = 200;

    this.globalScaleFactor = 1;
    this.skyScaleFactor    = 50;
    this.treeScaleFactor   = 0.5;
    this.flowerScaleFactor = 0.5;

    this.sunPosition = { x: this.skyScaleFactor, y: 0, z: 0 };
    this.sunRotation = 0;
    this.sunScale = 3;
    this.sunSpeed = 0.3;

    this.cloudSpeed        = 0.05;
    this.cloudDensity      = 0.62;
    this.cloudSize        = 6.0; // as in how small the clouds are, the half-sphere radius is defined with skyScaleFactor
    this._cloudTime        = 0.0;
    this._accumulatedTime  = 0;
    this.setUpdatePeriod(16);

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
    this.groundScale = 45;
    this.pathWidth = 0.02;
    this.uHeightScale = 0.13;

    // Build the CPU height grid (and upload its GPU copy) immediately so that
    // terrainHeight() works correctly for every generator call below.
    this._initTerrainHeightmap();

    this.numPatches = 200; // number of patches center
    this.bladesPerPatch = 60; // density of each grass patch
    this.grassScaleFactor = 1.0;

    // ── Barn / fence constants (defined early — needed for path generation) ──
    this.barnX           = -16.0;
    this.barnZ           = -16.0;
    this.barnRotation    = Math.PI / 4;  // faces toward centre (0, 0)
    this.barnScale       = 2.25;
    this.fenceRadius     = 4.0;
    this.fenceEntranceArc = Math.PI / 3;

    this.pathNumPoints = 21;
    this.pathSeed = Math.floor(Math.random() * 1000);

    // Restore saved path from a previous session if one exists
    const savedPath = JSON.parse(localStorage.getItem('cgra_path') || 'null');
    if (savedPath) {
      this.pathNumPoints = savedPath.numPoints;
      this.pathSeed      = savedPath.seed;
      this.pathWidth     = savedPath.width ?? 0.03;
    }

    // Path edges must exist before grass is generated so isOnPath works
    const { fixedPoints: initFP, exclusionZones: initEZ } = this._computePathConfig();
    this.edges = this.ground.generateMSTEdges(this.pathNumPoints, this.pathSeed, initFP, initEZ);

    this.rebuildGrass();

    // rock controls
    this.rocks = [];
    this.numRocks = 15;
    this.rockSpawnSeed  = 27.1;
    this.rockScaleFactor = 0.25;
    this.rockTexBlend = 0.5;
    this.rockMinDistanceToPath = 0.075;

    // tree contols
    this.treeMinDistanceToPath = 0.03;
    this.flowerMinDistanceToPath = 0.03;
    this.flowerDensity = 0.1; // amount of flwoers per unit squared
    this.treeDensity = 0.03; // amount of trees per unit squared
    this.grassMinDistanceToPath = 0.03;

    //Initialize Materials and lights
    this.initSunMaterial();
    this.initMoonMaterial();
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
    // Cache path-edge uniform locations once so display() doesn't call
    // getUniformLocation (a relatively expensive driver round-trip) every frame.
    this._uPathEdgesLoc = this.gl.getUniformLocation(this.terrainShader.program, 'uPathEdges');
    this._uNumEdgesLoc  = this.gl.getUniformLocation(this.terrainShader.program, 'uNumEdges');
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
    
    this.followCamera = true;

    this.displayAll       = true;
    this.displayAxis      = false;  // axis hidden by default during gameplay
    this.displaySky       = this.displayAll;
    this.displaySun       = this.displayAll;
    this.displayClouds    = this.displayAll;
    this.displayGround    = this.displayAll;
    this.displayTree      = this.displayAll;
    this.displayFlower    = this.displayAll;
    this.displayGrass     = this.displayAll;
    this.displayRock      = this.displayAll;
    this.displayBarn      = this.displayAll;
    this.displayFence     = this.displayAll;
    this.displaySilo      = this.displayAll;
    this.displayHay       = this.displayAll;
    this.displayWagon     = this.displayAll;

    this.pathWidth = 0.03;

    this.rock = new MyRock(
      this,
      this.rockSeed,
      8,
      6,
      0.08,
      'textures/white_rock_texture.jpg',
      'textures/black_rock_texture.jpg',
    );

    this.hayScaleFactor = 0.3;
    this.numHay = 5;             // always 5 bales, one per chosen path node
    this.hayMinDistanceToPath = 0.05;

    this.hay = new MyHay(
      this,
      'textures/hay.jpg',
    );

    this.arrow = new MyArrow(this);

    this.arrowShader = new CGFshader(
      this.gl,
      "shaders/arrow.vert",
      "shaders/arrow.frag",
    );

    this.wagonScaleFactor = 0.35;
    this.wagon = new MyWagon(this, "textures/wood.jpeg", "textures/cloth.jpg");

    // Wagon spawns just outside the barn's fence entrance, aimed toward centre
    const spawn = this._wagonSpawnPos();
    this.wagonPosition = { x: spawn.x, z: spawn.z };
    this.wagonAngle    = spawn.angle;
    this.wagonSpeed = 0;                 // Current velocity
    this.cameraSteeringHeight = 1.5;
    this.followDistance = 6;
    this.followHeight = 8;
    this.cameraLerpSpeed = 1;
    
    this.wagonAcceleration = 10 / 9;
    this.wagonSlowFriction = 0.92;
    this.wagonFriction = 0.96;
    this.wagonTurnRate = 0.04;
    this.wagonOnPath = true;

    // 180-Degree Turn Animation State
    this.isWagonTurning = false;
    this.turnAnimTimer = 0;
    this.turnAnimDuration = 0.8; // Duration of the animation in seconds
    this.startTurnAngle = 0;
    this.targetTurnAngle = 0;

    this.horseAngleOffset = 0; 
    this.maxHorseAngle = Math.PI / 4;
    this.horseSmoothness = 0.15;

    this.hayPositions = [];
    this.hayCollisionIndex = -1;

    this.generateTrees();
    this.generateFlowers();
    this.generateRocks();
    this.generateHay();

    // --- Barn + circular fence ---
    // (barnX/Z/Rotation/Scale/fenceRadius defined early above for path generation)
    this.barn = new MyBarn(this);
    this.fence = new MyCircularFence(this, this.barnX, this.barnZ, this.fenceRadius, 48);
    this.worldBorder = new MySquareFence(this, 0,0, this.groundScale, 20);
    this.fenceIntersected = false; // GUI toggle for now; wagon collision will drive this later

    this.displayBarn  = true;
    this.displayFence = true;

    // --- Hay silo ---
    // Local offset (in the barn's un-rotated frame). +X is along the barn's
    // long axis. The silo lives next to the barn's right end, slightly back
    // — inside the fence.
    this.siloOffsetX = 1.25;
    this.siloOffsetZ = 0.15;
    this.siloRadius  = 0.55;
    this.siloHeight  = 3.0;
    this.siloHayLevel = 1.0;
    this.siloRotationOffset = 0; // GUI fine-tune knob (radians)

    this.silo = new MyHaySilo(this, this.siloRadius, this.siloHeight, 40, Math.PI / 3);
    this.displaySilo = true;

    // ── Health / timer system ──────────────────────────────────────────────
    // maxHealth is the total health budget in seconds (silo full = 2 min).
    this.maxHealth      = 150;
    this.health         = this.maxHealth;
    this.instantDamage  = 0;
    this.instantGain    = 0;
    this.hasStartedMoving = false;      // latches true on first wagon movement
    this.gameElapsed    = 0;            // seconds since first move (counts UP)
    this._dt            = 0;           // frame delta in seconds (shared with checkKeys)

    // Read-only strings shown live in the GUI
    this.elapsedDisplay = '0:00';

    // ── Game state & overlay DOM refs ──────────────────────────────────────
    // States: 'start' | 'playing' | 'gameover'
    this.gameState = 'start';
    this._startScreenEl    = document.getElementById('start-screen');
    this._gameoverScreenEl = document.getElementById('gameover-screen');
    this._gameoverTimeEl   = document.getElementById('gameover-time');
    this._gameoverCountEl  = document.getElementById('gameover-count');

    this.wagonHayCount = 0;
    this.balesDropped  = 0;

    // Pre-allocated scratch arrays — reused every frame to avoid GC pressure.
    this._bladeWorldPos = [0, 0]; // grass wind shader uBladeWorldPos
    this._lastGSF = null;         // cached globalScaleFactor for sca matrix

    // Clicking the start card also starts the game (same as any key press)
    this._startScreenEl.addEventListener('click', () => this.startGame());
  }

  /**
   * Compute the silo's world-space placement based on its local offset
   * relative to the barn (so moving/rotating the barn drags it along), the
   * terrain height under it, and a Y-rotation that aims the opening
   * straight at the fence entrance — so as soon as the wagon drives in,
   * the hay level is visible through the gap.
   */
  siloPlacement() {
    const cos = Math.cos(this.barnRotation);
    const sin = Math.sin(this.barnRotation);
    // Rotate local offset into world space (Y-axis rotation convention used
    // by the rest of the scene).
    const dx =  cos * this.siloOffsetX + sin * this.siloOffsetZ;
    const dz = -sin * this.siloOffsetX + cos * this.siloOffsetZ;
    // Multiply by barn scale so the silo stays close even if the barn grows.
    const wx = this.barnX + dx * this.barnScale;
    const wz = this.barnZ + dz * this.barnScale;
    const wy = this.terrainHeight(wx, wz);

    // World position of the fence entrance (the gap in the fence centered on
    // the barn's front).  The fence entrance angle is (π/2 − barnRotation)
    // in the fence's polar parameterization, which corresponds to the
    // world direction (sin θ, cos θ) where θ = barnRotation.
    const eX = this.barnX + this.fenceRadius * sin;
    const eZ = this.barnZ + this.fenceRadius * cos;

    // We want the silo's local +X (the centre of the wall gap) to point
    // toward the entrance.  After rotating around Y by α, local +X maps to
    // world (cos α, 0, -sin α).  So α = atan2(-(eZ − wz), eX − wx).
    const rotation =
      Math.atan2(-(eZ - wz), (eX - wx)) + this.siloRotationOffset;

    return { x: wx, y: wy, z: wz, rot: rotation };
  }

  /**
   * Pick the highest of a small set of terrain samples around the barn footprint
   * so the barn's bottom rests on (or just above) the ground instead of floating
   * or being half-buried.
   */
  barnGroundY() {
    const halfL = (this.barn.bodyLength / 2) * this.barnScale;
    const halfW = (this.barn.bodyWidth  / 2) * this.barnScale;
    const cos = Math.cos(this.barnRotation), sin = Math.sin(this.barnRotation);

    let maxY = -Infinity;
    const offsets = [
      [0, 0],
      [ halfL,  halfW], [ halfL, -halfW],
      [-halfL,  halfW], [-halfL, -halfW],
    ];
    for (const [ox, oz] of offsets) {
      // rotate local offset by barnRotation around Y
      const rx =  cos * ox + sin * oz;
      const rz = -sin * ox + cos * oz;
      const wx = this.barnX + rx;
      const wz = this.barnZ + rz;
      const y = this.terrainHeight(wx, wz);
      if (y > maxY) maxY = y;
    }
    return maxY;
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
    this.displayBarn      = newValue;
    this.displayFence     = newValue;
    this.displaySilo      = newValue;
    this.displayHay       = newValue;
    this.displayWagon     = newValue;
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
    // t = Date.now() — an absolute Unix timestamp (~1.748e12 ms).
    // We subtract the scene's start time so elapsed stays near 0,
    // keeping uTime in float32-safe range for shader sin() calls.
    if (this._startTime === undefined) this._startTime = t;
    const elapsed = t - this._startTime; // ms since scene start

    // ── Per-frame delta time (seconds, capped to avoid huge jumps on tab switch)
    if (this._lastT === undefined) this._lastT = t;
    this._dt = Math.min((t - this._lastT) / 1000, 0.1);
    this._lastT = t;

    this._cloudTime = (elapsed / 1000.0) * this.cloudSpeed;
    this.windShader.setUniformsValues({ uTime: elapsed / 1000.0 }); // seconds
    
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

    // Only run gameplay logic while actually playing
    if (this.gameState === 'playing') {
      this.checkKeys();
      
      // --- WAGON TURN ANIMATION LOGIC ---
      if (this.isWagonTurning) {
        this.turnAnimTimer += this._dt;
        let progress = this.turnAnimTimer / this.turnAnimDuration;
        
        if (progress >= 1.0) {
          if (progress >= 2.0) {
            this.isWagonTurning = false; // Animation finished
            
            // Keep the angle wrapped nicely within 0 to 2π
            this.wagonAngle = this.targetTurnAngle % (Math.PI * 2);
          } else {
            // section to let the wagon move forward a bit
            this.wagonPosition.x += Math.sin(this.wagonAngle) * this.wagonSpeed * this._dt;
            this.wagonPosition.z += Math.cos(this.wagonAngle) * this.wagonSpeed * this._dt;
          }
        } else {
          // Apply Smoothstep easing for a natural turn
          const ease = progress * progress * (3 - 2 * progress);
          this.wagonAngle = this.startTurnAngle + (Math.PI * ease);
        }
      } else {
        // Apply friction to gradually slow down the wagon
        this.wagonSpeed *= this.wagonOnPath ? this.wagonFriction : this.wagonSlowFriction;

        // Stop micro-sliding when speed is extremely low
        if (Math.abs(this.wagonSpeed) < 0.001) {
          this.wagonSpeed = 0;
        }

        // Calculate new position based on speed and heading
        // (Using sin for X and cos for Z gives standard tank/car controls)
        this.wagonPosition.x += Math.sin(this.wagonAngle) * this.wagonSpeed * this._dt;
        this.wagonPosition.z += Math.cos(this.wagonAngle) * this.wagonSpeed * this._dt;

        this.wagon.updateWheelAngle(this.wagonSpeed);
      }

      // ── Health / timer tick ─────────────────────────────────────────────
      // Latch first movement (checked after checkKeys so speed is already updated).
      if (!this.hasStartedMoving && Math.abs(this.wagonSpeed) > 0.001) {
        this.hasStartedMoving = true;
      }
      if (this.hasStartedMoving) {
        this.gameElapsed += this._dt;
        this.health = Math.max(0, this.health - this._dt);
        this._syncSiloToHealth();

        // ── Game over: health and silo both hit 0 ────────────────────────
        if (this.health <= 0) {
          this.triggerGameOver();
        }
      }
      this.elapsedDisplay = this._formatTime(this.gameElapsed);

      // ── Hay respawn: when ≤ 1 bale remains and the wagon is empty, clear
      //    all positions so generateHay() picks 5 entirely fresh path nodes
      //    (without clearing first the last surviving bale would be locked
      //    in place by the isOccupied filter and never rotate out).
      if (this.hayPositions.length <= 1 && this.wagonHayCount === 0) {
        this.hayPositions = [];
        this.generateHay();
      }

      this.checkCollisions();

      if (this.followCamera) this.updateCamera();

      this.updateSunPosition();
    }
  }

  updateSunPosition() {
    this.sunRotation += (this._dt * this.sunSpeed) % (Math.PI * 2);
  }

  checkCollisions() {
    // Geometric center is baseLength/2 behind wagonPosition along the heading.
    const bodyHalfLength = (this.wagon.baseLength / 2) * this.wagonScaleFactor; // 1.25 * 0.35 = 0.4375
    const bodyHalfWidth  = (this.wagon.baseWidth  / 2) * this.wagonScaleFactor; // 1.0  * 0.35 = 0.35
    const wagonCX = this.wagonPosition.x - Math.sin(this.wagonAngle) * bodyHalfLength;
    const wagonCZ = this.wagonPosition.z - Math.cos(this.wagonAngle) * bodyHalfLength;
    const wagonRadius = Math.sqrt(bodyHalfLength * bodyHalfLength + bodyHalfWidth * bodyHalfWidth);

    // todo: check if we can have the obstacle take damage porportional to the time spent there (current)
    // «Wagon gets damage by hitting obstacles (example: loses a random HP number between 5 and 15)»

    if (this.rockPositions) {
      for (const pos of this.rockPositions) {
        const rx = pos.normX * this.groundScale;
        const rz = pos.normZ * this.groundScale;
        const rockRadius = pos.scale * this.rockScaleFactor;
        const combinedRadius = wagonRadius + rockRadius;
        const dx = wagonCX - rx;
        const dz = wagonCZ - rz;

        if (dx * dx + dz * dz < combinedRadius * combinedRadius) {
          if (!pos.hasCollided) {
            pos.hasCollided = true;
            this.removeHealth(Math.random() * 10 + 5);
          }
          break;
        } else {
          pos.hasCollided = false;
        }
      }
    }

    if (this.hayPositions) {
      // Hay is a (1.5 x 1.0 x 1.0) box; bounding circle in XZ = sqrt(0.75^2 + 0.5^2) ≈ 0.90
      const HAY_MODEL_RADIUS = Math.sqrt(0.75 * 0.75 + 0.5 * 0.5);
      const hayRadius = HAY_MODEL_RADIUS * this.hayScaleFactor;
      this.hayCollisionIndex = -1;
      for (let i = 0; i < this.hayPositions.length; i++) {
        const pos = this.hayPositions[i];
        const hx = pos.normX * this.groundScale;
        const hz = pos.normZ * this.groundScale;
        const combinedRadius = wagonRadius + hayRadius;
        const combinedRadiusVision = wagonRadius + this.groundScale / 4; // let the player see 1/4 of the map
        const dx = wagonCX - hx;
        const dz = wagonCZ - hz;
      
        if (dx * dx + dz * dz < combinedRadius * combinedRadius) {
          this.hayCollisionIndex = i;
        }
        if (dx * dx + dz * dz < combinedRadiusVision * combinedRadiusVision) {
          if (!pos.isSeen) {
            pos.isSeen = true;
          }
        } else {
          if (pos.isSeen) {
            pos.isSeen = false;
          }
        }
      }
    }

    if (this.treePositions) {
      for (const pos of this.treePositions) {
        const tx = pos.x * this.groundScale + pos.randomOffset;
        const tz = pos.z * this.groundScale + pos.randomOffset;
        const treeRadius = pos.obj.trunkWidth * pos.scale * this.treeScaleFactor;
        const combinedRadius = wagonRadius + treeRadius;
        const dx = wagonCX - tx;
        const dz = wagonCZ - tz;

        if (dx * dx + dz * dz < combinedRadius * combinedRadius) {
          if (!pos.hasCollided) {
            pos.hasCollided = true;
            this.removeHealth(Math.random() * 10 + 5);
          }
          break;
        } else {
          pos.hasCollided = false;
        }
      }
    }

    const currentOnPath = this.isOnPath(wagonCX, wagonCZ);
    if (currentOnPath ^ this.wagonOnPath) {
      this.wagonOnPath = currentOnPath;
    }

    // Barn drop zone: wagon center inside the fence circle
    const fdx = wagonCX - this.barnX;
    const fdz = wagonCZ - this.barnZ;
    this.fenceIntersected = (fdx * fdx + fdz * fdz) < (this.fenceRadius * this.fenceRadius);

    // calculate the angle of the wagon relative to the fence center
    const fenceAngle = Math.atan2(fdz, fdx);

    if (this.fenceIntersected && !this.fence._isInEntrance(fenceAngle)) {
      this.turnWagon180();
    }

    // world border collision
    if (!this.worldBorder.containsPoint(wagonCX, wagonCZ)) {
      this.turnWagon180();
    }
  }

  /**
   * Triggers a 180-degree rotation animation.
   */
  turnWagon180() {
    // Prevent the animation from restarting if it's already in progress
    if (this.isWagonTurning) return; 

    this.isWagonTurning = true;
    this.wagonSpeed *= 1.5; // make the wagon faster so it gets out of forbidden zone and let friction reduce the velocity afterwards
    this.turnAnimTimer = 0;
    this.startTurnAngle = this.wagonAngle;
    this.targetTurnAngle = this.wagonAngle + Math.PI; 
  }

  updateCamera() {
    const wagonY = this.terrainHeight(this.wagonPosition.x, this.wagonPosition.z);
    const target = vec3.fromValues(
      this.wagonPosition.x, 
      wagonY + this.cameraSteeringHeight, 
      this.wagonPosition.z
    );

    const offsetX = Math.sin(this.wagonAngle) * this.followDistance;
    const offsetZ = Math.cos(this.wagonAngle) * this.followDistance;

    const desiredCamX = this.wagonPosition.x - offsetX;
    const desiredCamZ = this.wagonPosition.z - offsetZ;
    const desiredCamY = wagonY + this.followHeight; 

    const terrainBehindY = this.terrainHeight(desiredCamX, desiredCamZ);
    const safeCamY = Math.max(desiredCamY, terrainBehindY+0.1); 

    const desiredPosition = vec3.fromValues(desiredCamX, safeCamY, desiredCamZ);
    const currentPosition = this.camera.position;
    const newPosition = vec3.create();

    if (this.isWagonTurning) {
      // Snap directly to desired position; bypass lerp entirely
      vec3.copy(newPosition, desiredPosition);
    } else {
      // vec3.lerp(out, a, b, t) glides from 'a' to 'b' by factor 't'
      vec3.lerp(newPosition, currentPosition, desiredPosition, this.cameraLerpSpeed * this._dt);
    }

    this.camera.setPosition(newPosition);
    this.camera.setTarget(target);
  }

  checkKeys() {
    // Accelerate forward
    if (this.gui.isKeyPressed("KeyW")) {
      this.wagonSpeed += this.wagonAcceleration * this._dt;
    }
    // Decelerate / Reverse
    if (this.gui.isKeyPressed("KeyS")) {
      this.wagonSpeed -= this.wagonAcceleration * this._dt;
      if (this.wagonSpeed < 0) {
        this.wagonSpeed = 0;
      }
    }

    // Steer (Curve trajectory)
    let targetHorseAngle = 0;
    if (this.gui.isKeyPressed("KeyA")) {
      this.wagonAngle += this.wagonTurnRate * this.wagonSpeed;
      targetHorseAngle = this.maxHorseAngle;
    }
    if (this.gui.isKeyPressed("KeyD")) {
      this.wagonAngle -= this.wagonTurnRate * this.wagonSpeed;
      targetHorseAngle = -this.maxHorseAngle;
    }       
    this.horseAngleOffset += (targetHorseAngle - this.horseAngleOffset) * this.horseSmoothness;

    if (this.gui.isKeyPressed("KeyL") && this.fenceIntersected) {
      this.dropHay();
    }

    if (this.gui.isKeyPressed("KeyP") && this.hayCollisionIndex != -1) {
      this.pickUpHay(this.hayCollisionIndex);
    }

    if (this.gui.isKeyPressed("KeyR")) {
      this.resetGame();
    }

    // camera
    if (this.gui.isKeyPressed("ArrowUp") && this.followHeight < 10) {
      this.followHeight += 0.5;
    }
    if (this.gui.isKeyPressed("ArrowDown") && this.followHeight > 0) {
      this.followHeight -= 0.5;
    }

    // Zoom in/out (Distance adjustment)
    // We use Math.max and Math.min to clamp the zoom so they can't zoom too far or inside the wagon
    if (this.gui.isKeyPressed("ArrowRight")) {
      this.followDistance = Math.max(5.0, this.followDistance - 0.5); 
    }
    if (this.gui.isKeyPressed("ArrowLeft")) {
      this.followDistance = Math.min(30.0, this.followDistance + 0.5);
    }

    const uDown = this.gui.isKeyPressed('KeyU'); // uturn
    if (uDown && !this._prevKeyU) this.turnWagon180();
    this._prevKeyU = uDown;

    const oneDown = this.gui.isKeyPressed('Digit1');
    if (oneDown && !this._prevKey1) this.pickUpHay(0);
    this._prevKey1 = oneDown;

    const twoDown = this.gui.isKeyPressed('Digit2');
    if (twoDown && !this._prevKey2) this.pickUpHay(1);
    this._prevKey2 = twoDown;

    const threeDown = this.gui.isKeyPressed('Digit3');
    if (threeDown && !this._prevKey3) this.pickUpHay(2);
    this._prevKey3 = threeDown;

    const fourDown = this.gui.isKeyPressed('Digit4');
    if (fourDown && !this._prevKey4) this.pickUpHay(3);
    this._prevKey4 = fourDown;

    const fiveDown = this.gui.isKeyPressed('Digit5');
    if (fiveDown && !this._prevKey5) this.pickUpHay(4);
    this._prevKey5 = fiveDown;
    
    const zeroDown = this.gui.isKeyPressed('Digit0');
    if (zeroDown && !this._prevKey0) this.dropHay();
    this._prevKey0 = zeroDown;
  }

  // ── Barn / path / spawn helpers ─────────────────────────────────────────

  /**
   * Returns true when a world-space point is inside the fenced barn area
   * (with a small buffer so nothing spawns right at the fence edge).
   */
  _isInsideFenceArea(wx, wz, buffer = 2.0) {
    const dx = wx - this.barnX;
    const dz = wz - this.barnZ;
    const r  = this.fenceRadius + buffer;
    return (dx * dx + dz * dz) < r * r;
  }

  /**
   * Computes the two fixed UV-space path nodes that guarantee the MST path
   * always has a branch leading directly to the barn entrance, plus the
   * circular exclusion zone that keeps random nodes out of the fenced area.
   */
  _computePathConfig() {
    const gS  = this.groundScale;
    const sin = Math.sin(this.barnRotation);
    const cos = Math.cos(this.barnRotation);

    // Node A — just outside the fence entrance
    const aWx = this.barnX + (this.fenceRadius + 1.5) * sin;
    const aWz = this.barnZ + (this.fenceRadius + 1.5) * cos;

    // Node B — further toward the centre, ensuring a clear path segment inward
    const bWx = this.barnX + (this.fenceRadius + 6.0) * sin;
    const bWz = this.barnZ + (this.fenceRadius + 6.0) * cos;

    const toUV = (wx, wz) => [wx / gS + 0.5, wz / gS + 0.5];

    return {
      fixedPoints:    [toUV(aWx, aWz), toUV(bWx, bWz)],
      exclusionZones: [{
        cx: this.barnX / gS + 0.5,
        cz: this.barnZ / gS + 0.5,
        r:  (this.fenceRadius + 2.5) / gS,
      }],
    };
  }

  /**
   * World-space position + heading for the wagon at (re)spawn time:
   * just outside the fence entrance, pointed toward the centre.
   */
  _wagonSpawnPos() {
    const sin = Math.sin(this.barnRotation);
    const cos = Math.cos(this.barnRotation);
    return {
      x:     this.barnX + (this.fenceRadius + 1.0) * sin,
      z:     this.barnZ + (this.fenceRadius + 1.0) * cos,
      angle: this.barnRotation,   // wagon faces the same direction the barn front faces
    };
  }

  // ── Health system helpers ────────────────────────────────────────────────

  /**
   * Increase health by `amount` seconds (capped at maxHealth).
   * Call this when the wagon delivers hay to the barn (future), or from U key.
   */
  addHealth(amount = 10) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this._syncSiloToHealth();
    this.instantGain += amount;

    setTimeout(() => {
      this.instantGain -= amount;
    }, 500);
  }

  /**
   * Decrease health by `amount` seconds (floored at 0).
   * Call this on collision damage (future), or from I key.
   */
  removeHealth(amount = 10) {
    this.health = Math.max(0, this.health - amount);
    this._syncSiloToHealth();
    this.instantDamage += amount;

    setTimeout(() => {
      this.instantDamage -= amount;
    }, 500);
  }

  pickUpHay(index) {
    if ((!index && index !== 0) || index < 0 || index >= this.hayPositions.length) return;
    if (this.wagonHayCount >= 2) return;
    
    this.hayPositions.splice(index, 1);

    this.wagonHayCount++;
    this.wagon.updateHayCount(this.wagonHayCount);
  }

  dropHay() {
    if (this.wagonHayCount <= 0) return;
    // Non-linear reward: 1 bale = +18 s, 2 bales = +32 s
    const gain = this.wagonHayCount === 1 ? 18 : 32;
    this.addHealth(gain);
    this.balesDropped += this.wagonHayCount;
    this.wagonHayCount = 0;
    this.wagon.updateHayCount(0);
    // Respawn check is handled in the update loop — new bales appear only
    // when ≤ 1 remain on the map and the wagon is empty.
  }

  /** Keep siloHayLevel in [0,1] in lock-step with the health countdown. */
  _syncSiloToHealth() {
    this.siloHayLevel = this.health / this.maxHealth;
  }

  /** Format a number of seconds as "M:SS". */
  _formatTime(seconds) {
    const s = Math.max(0, seconds);
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return `${m}:${ss.toString().padStart(2, '0')}`;
  }

  // ── Game state transitions ───────────────────────────────────────────────

  /** Called when the player dismisses the start screen. */
  startGame() {
    if (this.gameState !== 'start') return;
    this.gameState = 'playing';
    this._startScreenEl.classList.add('hidden');
  }

  /** Called when health reaches 0 — shows the game over screen. */
  triggerGameOver() {
    if (this.gameState !== 'playing') return;
    this.gameState = 'gameover';
    this._gameoverTimeEl.textContent = this._formatTime(this.gameElapsed);
    this._gameoverCountEl.textContent = this.balesDropped;
    this._gameoverScreenEl.classList.remove('hidden');
  }

  /**
   * Resets all game state and regenerates the world, then returns to the
   * start screen.  Called by pressing R on the game over screen.
   */
  resetGame() {
    if (this.gameState !== 'gameover') return;

    // Reset health & timers
    this.health           = this.maxHealth;
    this.gameElapsed      = 0;
    this.hasStartedMoving = false;
    this.elapsedDisplay   = '0:00';
    this._syncSiloToHealth();

    // Reset wagon to spawn position in front of barn
    const spawn = this._wagonSpawnPos();
    this.wagonPosition = { x: spawn.x, z: spawn.z };
    this.wagonAngle    = spawn.angle;
    this.wagonSpeed    = 0;

    this.hayPositions = [];

    // Regenerate the world
    this.generateTrees();
    this.generateFlowers();
    this.generateRocks();
    this.generateHay();
    this.rebuildGrass();

    // Show start screen again
    this._gameoverScreenEl.classList.add('hidden');
    this._startScreenEl.classList.remove('hidden');
    this.gameState = 'start';
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

  /**
   * Precomputes a 256×256 height grid by evaluating _fbm() at every texel
   * using the same UV→local-coord mapping the vertex shader uses, then uploads
   * it as a WebGL LUMINANCE texture (unit 1).  Both the GPU shader and the CPU
   * sampler below use this identical data, so there is no float32/float64
   * precision mismatch and objects sit exactly on the terrain.
   *
   * Must be called after this.uHeightScale is set.
   */
  _initTerrainHeightmap() {
    const N = 256;
    const pixels = new Uint8Array(N * N);
    this._terrainGrid  = new Float32Array(N * N);
    this._terrainGridN = N;

    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const u  = i / (N - 1);
        const v  = j / (N - 1);
        // Mirror exactly what terrain.vert does:
        //   aTextureCoord → UV; aVertexPosition.xy*1.5 where local_x=u-0.5, local_y=0.5-v
        const lx = (u - 0.5) * 1.5;
        const ly = (0.5 - v) * 1.5;
        const h  = this._fbm(lx, ly);
        this._terrainGrid[j * N + i] = h;
        pixels[j * N + i] = Math.min(255, Math.max(0, Math.round(h * 255)));
      }
    }

    const gl = this.gl;
    this._cpuHeightTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this._cpuHeightTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, N, N, 0,
                  gl.LUMINANCE, gl.UNSIGNED_BYTE, pixels);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  /**
   * Returns the world-space Y height of the terrain at world position (wx, wz).
   * Bilinearly interpolates from the precomputed CPU height grid so the result
   * matches the GPU displacement exactly (same data source, no sin precision issue).
   */
  terrainHeight(wx, wz) {
    const u  = Math.max(0, Math.min(1, wx / this.groundScale + 0.5));
    const v  = Math.max(0, Math.min(1, wz / this.groundScale + 0.5));
    const N  = this._terrainGridN;
    const px = u * (N - 1);
    const py = v * (N - 1);
    const x0 = Math.floor(px), y0 = Math.floor(py);
    const x1 = Math.min(x0 + 1, N - 1);
    const y1 = Math.min(y0 + 1, N - 1);
    const fx = px - x0, fy = py - y0;
    const g  = this._terrainGrid;
    const h  = g[y0*N+x0]*(1-fx)*(1-fy) + g[y0*N+x1]*fx*(1-fy)
             + g[y1*N+x0]*(1-fx)*fy      + g[y1*N+x1]*fx*fy;
    return h * this.uHeightScale * this.groundScale;
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
    this.windShader.setUniformsValues({ uTime: 0.0, uWindStrength: 0.6, uWindSpeed: 2.0 });

    this.rockShader = new CGFshader(
      this.gl,
      'shaders/rock.vert',
      'shaders/rock.frag'
    );
    this.rockShader.setUniformsValues({
      uSeed:        this.seed,
      uRoughness:   this.roughness,
      uTexBlend:    0.0,
      uSampler0:    0,
      uSampler1:    1,
      uLightDir:    [0.0, 0.8, 0.5]
    });
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
  initMoonMaterial() {
    this.moonMaterial = new CGFappearance(this);
    this.moonMaterial.setEmission(1, 1, 1, 1);
    this.moonMaterial.setAmbient(1, 1, 1, 1);
    this.moonMaterial.setDiffuse(0, 0, 0, 1);
    this.moonMaterial.setSpecular(0, 0, 0, 1);

    this.moonTexture = new CGFtexture(this, "textures/moon.png");
    this.moonMaterial.setTexture(this.moonTexture);
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

    this.groundPathTexture = new CGFtexture(this, "textures/dirt4.jpg");
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

    // Store base values to scale them later during the day/night cycle
    this.baseAmbient = [0.45, 0.45, 0.45, 1.0];
    this.baseDiffuse = [1.0, 0.95, 0.7, 1.0];
    this.baseSpecular = [1.0, 0.95, 0.7, 1.0];

    this.lights[0].setAmbient(...this.baseAmbient);
    this.lights[0].setDiffuse(...this.baseDiffuse);
    this.lights[0].setSpecular(...this.baseSpecular);
    
    this.lights[0].enable();
    this.lights[0].update();

    this.setGlobalAmbientLight(0.55, 0.55, 0.55, 1.0);
  }

  syncSunLight() {
    const angle = ((this.sunRotation % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);

    // Calculate the physical rotation
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const rotatedX = this.sunPosition.x * cosA - this.sunPosition.y * sinA;
    const rotatedY = this.sunPosition.x * sinA + this.sunPosition.y * cosA;
    const rotatedZ = this.sunPosition.z; 

    this.lights[0].setPosition(
      rotatedX,
      rotatedY,
      rotatedZ,
      0.0,
    );

    // Nighttime check
    if (angle > Math.PI) {
      this.lights[0].disable();
      this.lights[0].update();
      return;
    }

    // --- DAYTIME TRANSITION LOGIC ---
    const fadeSpeed = 5.0; 
    const intensity = Math.max(0, Math.min(1.0, sinA * fadeSpeed));

    if (intensity <= 0.0) {
        this.lights[0].disable();
    } else {
        this.lights[0].enable();

        this.lights[0].setAmbient(
            this.baseAmbient[0] * intensity,
            this.baseAmbient[1] * intensity,
            this.baseAmbient[2] * intensity,
            1.0
        );
        this.lights[0].setDiffuse(
            this.baseDiffuse[0] * intensity,
            this.baseDiffuse[1] * intensity,
            this.baseDiffuse[2] * intensity,
            1.0
        );
        this.lights[0].setSpecular(
            this.baseSpecular[0] * intensity,
            this.baseSpecular[1] * intensity,
            this.baseSpecular[2] * intensity,
            1.0
        );
    }

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
    this.iterations = 4;
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
            if (this._isInsideFenceArea(tempWx, tempWz)) continue;

            let levels = Math.floor(Math.random() * 2) + 3;
            let blade = new MyGrass(this, levels, 0.1, 0.1 + Math.random() * 0.2);
            blade.health = Math.max(0, Math.min(1, patchHealth + (Math.random() - 0.5) * 0.2));

            const wx = tempWx;
            const wz = tempWz;
            const wy = this.terrainHeight(wx, wz);

            this.grassBlades.push({
                object: blade,
                wx: wx,
                wz: wz,
                wy: wy,
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

  _rebuildAll() {
    // Regenerate every randomly-placed element after the path changes.
    // Clear hay first so generateHay() doesn't bail out on the "needed <= 0" guard.
    this.hayPositions = [];
    this.rebuildGrass();
    this.generateTrees();
    this.generateFlowers();
    this.generateRocks();
    this.generateHay();
  }

  rebuildPath() {
    const { fixedPoints, exclusionZones } = this._computePathConfig();
    this.edges = this.ground.generateMSTEdges(this.pathNumPoints, this.pathSeed, fixedPoints, exclusionZones);
    this._rebuildAll();
  }

  newRandomPath() {
    this.pathSeed = Math.floor(Math.random() * 1000);
    const { fixedPoints, exclusionZones } = this._computePathConfig();
    this.edges = this.ground.generateMSTEdges(this.pathNumPoints, this.pathSeed, fixedPoints, exclusionZones);
    this._rebuildAll();
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

    // Rebuild the global-scale matrix only when the slider actually changes.
    if (this._lastGSF !== this.globalScaleFactor) {
      this._lastGSF = this.globalScaleFactor;
      const g = this.globalScaleFactor;
      this._sca = [g,0,0,0, 0,g,0,0, 0,0,g,0, 0,0,0,1];
    }
    const sca = this._sca;

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
        // Bind the precomputed CPU height map to unit 1 — this is what the
        // terrain vertex shader samples for displacement, and what terrainHeight()
        // interpolates on the CPU side, so both are guaranteed to agree.
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this._cpuHeightTex);
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
        // Pass MST edges (uniform locations cached at shader-creation time)
        this.gl.uniform4fv(this._uPathEdgesLoc, this.ground.pathEdges);
        this.gl.uniform1i(this._uNumEdgesLoc,   this.ground.numEdges);
        this.ground.display();
      this.popMatrix();
    }

    this.pushMatrix();
      this.multMatrix(sca);
      this.scale(this.skyScaleFactor, this.skyScaleFactor, this.skyScaleFactor);

      if (this.displaySky) {
        this.skyboxMaterial.apply();

        this.setActiveShader(this.skyShader);

        this.sphere.display();
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

        this.gl.depthMask(true);
        this.gl.disable(this.gl.BLEND);
      }
    this.popMatrix();

    if (this.displaySun && this.sunPosition) {
      this.pushMatrix();
        this.multMatrix(sca);
        this.rotate(this.sunRotation, 0, 0, 1); // Orbital rotation
        this.translate(this.sunPosition.x, this.sunPosition.y, this.sunPosition.z);
        this.scale(this.sunScale, this.sunScale, this.sunScale);
        this.rotate(this.sunRotation, 0, 1, 0); // Local spin
        
        this.sunMaterial.apply();
        this.setActiveShader(this.sunShader); 
        this.updateSunShaderUniforms();
        this.sunSphere.display();
      this.popMatrix();

      this.pushMatrix();
        this.multMatrix(sca);
        this.rotate(this.sunRotation + Math.PI, 0, 0, 1); 
        
        this.translate(this.sunPosition.x, this.sunPosition.y, this.sunPosition.z);
        this.scale(this.sunScale, this.sunScale, this.sunScale);
        
        this.rotate(this.sunRotation, 0, 1, 0); 
        
        this.moonMaterial.apply();
        this.setActiveShader(this.sunShader);
        this.updateSunShaderUniforms();
        this.sunSphere.display();
      this.popMatrix();
    }

    if (this.displayRock && this.rockPositions) {
      // Set the uniform once for all rocks
      this.setActiveShader(this.rockShader);
      this.rockShader.setUniformsValues({ uTexBlend: this.rockTexBlend });

      for (let i = 0; i < this.rockPositions.length; i++) {
        let pos = this.rockPositions[i];

        // 1. Calculate dynamic world positions based on current ground scale
        let wx = pos.normX * this.groundScale;
        let wz = pos.normZ * this.groundScale;

        this.pushMatrix();
          this.multMatrix(sca);
          this.translate(wx, pos.wy, wz);
          
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

    if (this.displayGrass) {
      for (let i = 0; i < this.grassBlades.length; i++) {
        let g = this.grassBlades[i];

        // Reuse the pre-allocated array — avoids allocating [wx, wz] per blade per frame.
        this._bladeWorldPos[0] = g.wx;
        this._bladeWorldPos[1] = g.wz;
        this.windShader.setUniformsValues({
            uHealth: g.object.health,
            uBladeWorldPos: this._bladeWorldPos
        });

        this.pushMatrix();
          this.multMatrix(sca);
          this.translate(g.wx, g.wy, g.wz);
          this.rotate(g.rot, 0, 1, 0);
          const finalScale = g.scale * this.grassScaleFactor;
          this.scale(finalScale, finalScale, finalScale);

          g.object.display();
        this.popMatrix();
      }
    }
    
    if (this.displayHay && this.hayPositions) {
      this.setActiveShader(this.arrowShader);
      for (let i = 0; i < this.hayPositions.length; i++) {
        const pos = this.hayPositions[i];
        const wx = pos.normX * this.groundScale;
        const wz = pos.normZ * this.groundScale;
        this.pushMatrix();
          this.multMatrix(sca);
          this.translate(wx, pos.wy, wz);
          this.rotate(pos.rotation, 0, 1, 0);
          this.scale(this.hayScaleFactor, this.hayScaleFactor, this.hayScaleFactor);
          this.arrow.display();
        this.popMatrix();
      }
    }

    // Default shader section
    this.setActiveShader(this.defaultShader);
    
    this.setAmbient(0.2, 0.4, 0.8, 1.0);
    this.setDiffuse(0.2, 0.4, 0.8, 1.0);
    this.setSpecular(0.2, 0.4, 0.8, 1.0);
    this.setEmission(0.0, 0.0, 0.0, 1.0);
    this.setShininess(10.0);

    // separated from the arrow in order to be included in the default shader section
    if (this.displayHay && this.hayPositions) {
      // wy is pre-baked at generation time (5-corner terrain max), no per-frame sampling needed.
      for (let i = 0; i < this.hayPositions.length; i++) {
        const pos = this.hayPositions[i];
        if (!pos.isSeen) continue; 
        const wx = pos.normX * this.groundScale;
        const wz = pos.normZ * this.groundScale;
        this.pushMatrix();
          this.multMatrix(sca);
          this.translate(wx, pos.wy, wz);
          this.rotate(pos.rotation, 0, 1, 0);
          this.scale(this.hayScaleFactor, this.hayScaleFactor, this.hayScaleFactor);
          this.hay.display();
        this.popMatrix();
      }
    }

    if (this.displayTree && this.treePositions) {
      for (let i = 0; i < this.treePositions.length; i++) {
        let pos = this.treePositions[i];

        const finalX = pos.x * this.groundScale + pos.randomOffset;
        const finalZ = pos.z * this.groundScale + pos.randomOffset;

        this.pushMatrix();
          this.multMatrix(sca);
          this.translate(finalX, pos.wy, finalZ);
          this.rotate(pos.rotation, 0, 1, 0);
          const finalScale = pos.scale * this.treeScaleFactor;
          this.scale(finalScale, finalScale, finalScale);
          
          pos.obj.display();
        
        this.popMatrix();
      }
    }

    // --- Barn ---
    if (this.displayBarn && this.barn) {
      const groundY = this.barnGroundY();
      this.pushMatrix();
        this.multMatrix(sca);
        this.translate(this.barnX, groundY, this.barnZ);
        this.rotate(this.barnRotation, 0, 1, 0);
        this.scale(this.barnScale, this.barnScale, this.barnScale);
        this.barn.display();
      this.popMatrix();
    }

    // --- Hay silo (next to the barn, inside the fence) ---
    if (this.displaySilo && this.silo) {
      this.silo.setHayLevel(this.siloHayLevel);
      const p = this.siloPlacement();
      this.pushMatrix();
        this.multMatrix(sca);
        this.translate(p.x, p.y, p.z);
        this.rotate(p.rot, 0, 1, 0);
        this.silo.display();
      this.popMatrix();
    }

    // --- Circular fence around the barn ---
    if (this.displayFence && this.fence) {
      // Keep fence center/radius in sync with the GUI sliders.
      this.fence.setCenter(this.barnX, this.barnZ);
      this.fence.setRadius(this.fenceRadius);
      this.fence.setIntersected(this.fenceIntersected);

      // Auto-orient the entrance so it lines up with the barn's front door.
      // The barn's front faces local +Z, which after rotating by
      // barnRotation around Y points to (sin θ, 0, cos θ) in world space.
      // The fence's angle param uses (cos a, sin a) on (X, Z), so:
      //   cos a = sin θ, sin a = cos θ   ⇒   a = π/2 − θ
      this.fence.setEntrance(
        Math.PI / 2 - this.barnRotation,
        this.fenceEntranceArc,
      );

      this.pushMatrix();
        this.multMatrix(sca);
        this.fence.display();
      this.popMatrix();
    }

    if (this.worldBorder) {
      this.pushMatrix();
        this.multMatrix(sca);
        this.worldBorder.display();
      this.popMatrix();
    }

    if (this.displayFlower && this.flowerPositions) {
      for (let i = 0; i < this.flowerPositions.length; i++) {
        let pos = this.flowerPositions[i];

        const finalX = pos.x * this.groundScale + pos.randomOffset;
        const finalZ = pos.z * this.groundScale + pos.randomOffset;

        this.pushMatrix();
          this.multMatrix(sca);
          this.translate(finalX, pos.wy, finalZ);
          this.rotate(pos.rotation, 0, 1, 0);
          const finalScale = pos.scale * this.flowerScaleFactor;
          this.scale(finalScale, finalScale, finalScale);
          
          pos.obj.display();
        this.popMatrix();
      }
    }

    if (this.displayWagon) {
      let wy = this.terrainHeight(this.wagonPosition.x, this.wagonPosition.z);

      const wagonLength = 2;      // Distance from front to back
      const wagonHalfWidth = 2.5;   // Distance from center to left/right side

      const fX = Math.sin(this.wagonAngle); // Forward X
      const fZ = Math.cos(this.wagonAngle); // Forward Z
      const rX = Math.cos(this.wagonAngle); // Right X
      const rZ = -Math.sin(this.wagonAngle);// Right Z

      const frontX = this.wagonPosition.x;
      const frontZ = this.wagonPosition.z;
      const backX  = frontX - (fX * wagonLength);
      const backZ  = frontZ - (fZ * wagonLength);
      const horseX = frontX + 3*fX;
      const horseZ = frontZ + 3*fZ;
      
      const hFront = wy;
      const hBack  = this.terrainHeight(backX, backZ);
      const hHorse = this.terrainHeight(horseX, horseZ);

      const centerX = frontX - (fX * wagonLength / 2);
      const centerZ = frontZ - (fZ * wagonLength / 2);

      const rightX = centerX + (rX * wagonHalfWidth);
      const rightZ = centerZ + (rZ * wagonHalfWidth);
      const leftX  = centerX - (rX * wagonHalfWidth);
      const leftZ  = centerZ - (rZ * wagonHalfWidth);

      const hRight = this.terrainHeight(rightX, rightZ);
      const hLeft  = this.terrainHeight(leftX, leftZ);

      const pitch = Math.atan2(hFront - hBack, wagonLength);
      const roll = Math.atan2(hRight - hLeft, wagonHalfWidth * 2);
      const horsePitch = -Math.atan2(hHorse - hFront, 3);
      
      this.pushMatrix();
        this.multMatrix(sca);
        
        this.translate(frontX, wy + 0.4, frontZ);
        
        this.rotate(this.wagonAngle, 0, 1, 0); 

        this.rotate(-pitch, 1, 0, 0);
        this.rotate(roll, 0, 0, 1);
        
        this.scale(this.wagonScaleFactor, this.wagonScaleFactor, this.wagonScaleFactor);
        
        this.wagon.display(horsePitch, this.horseAngleOffset);
      this.popMatrix();
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
      const randomW = Math.random() * 0.4 + 0.15;
      const randomL = Math.random() * 20 + Math.random() * randomW * 30 + 10;
      
      const obj = new MyLSTree(this, randomW, randomL);
      obj.init();
      
      if (this.checkOutsideAllEdges({ x: randomX, z: randomZ }, this.treeMinDistanceToPath)
          && !this._isInsideFenceArea(randomX * this.groundScale, randomZ * this.groundScale)) {
        this.treePositions.push({
          obj: obj,
          x: randomX,
          z: randomZ,
          wy: this.terrainHeight(randomX * this.groundScale, randomZ * this.groundScale),
          randomOffset: 0,
          scale: 0.6 + Math.random() * 0.8,
          rotation: Math.random() * Math.PI * 2,
          hasCollided: false,
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
      const randomW = Math.random() * 0.15 + 0.05;
      const randomLL = Math.random()*0.6 + 0.2;
      const randomP = Math.round(Math.random() * 6) + 4;
      const randomPL = Math.random()+0.6;
      
      const obj = new MyLSFlower(this, randomW, 3,8, randomLL, 0.3, randomP, randomPL);
      obj.init();
      
      if (this.checkOutsideAllEdges({ x: randomX, z: randomZ }, this.flowerMinDistanceToPath)
          && !this._isInsideFenceArea(randomX * this.groundScale, randomZ * this.groundScale)) {
        this.flowerPositions.push({
          obj: obj,
          x: randomX,
          z: randomZ,
          wy: this.terrainHeight(randomX * this.groundScale, randomZ * this.groundScale),
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
      
      if (this.checkOutsideAllEdges({ x: normX, z: normZ }, this.rockMinDistanceToPath)
          && !this._isInsideFenceArea(normX * this.groundScale, normZ * this.groundScale)) {
        this.rockPositions.push({
          normX: normX,
          normZ: normZ,
          wy:   this.terrainHeight(normX * this.groundScale, normZ * this.groundScale),
          scale: 0.5 + Math.random() * 1.0,
          rotX: Math.random() * Math.PI * 2,
          rotY: Math.random() * Math.PI * 2,
          rotZ: Math.random() * Math.PI * 2,
          hasCollided: false,
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

  generateHay() {
    const needed = this.numHay - this.hayPositions.length;
    if (needed <= 0) return;
  
    const nodes = this.ground.pathNodes;   // UV-space [u, v] for every MST node
    if (!nodes || nodes.length === 0) return;

    // Skip the first 2 fixed nodes (they sit near the barn entrance).
    // Also skip any node whose world position is still inside the fence area.
    const candidates = nodes.slice(2).filter(([u, v]) => {
      const wx = (u - 0.5) * this.groundScale;
      const wz = (v - 0.5) * this.groundScale;
      
      if (this._isInsideFenceArea(wx, wz, 0)) return false;
  
      // Check if a hay bale already exists at this node location (to prevent stacking)
      const normX = u - 0.5;
      const normZ = v - 0.5;

      const isOccupied = this.hayPositions.some(bale => 
        Math.abs(bale.normX - normX) < 0.001 && Math.abs(bale.normZ - normZ) < 0.001
      );
  
      return !isOccupied;
    });

    // Fisher-Yates shuffle so we get a different set each call
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    // Place one bale at each of the first numHay candidates.
    // Pre-bake the terrain height so display() doesn't repeat the 5-sample
    // max() computation (for two render passes) every frame.
    const hw = 0.75 * this.hayScaleFactor;
    const hd = 0.5  * this.hayScaleFactor;
    const count = Math.min(needed, candidates.length);
    for (let i = 0; i < count; i++) {
      const [u, v] = candidates[i];
      const wx = (u - 0.5) * this.groundScale;
      const wz = (v - 0.5) * this.groundScale;
      const wy = Math.max(
        this.terrainHeight(wx,      wz     ),
        this.terrainHeight(wx + hw, wz + hd),
        this.terrainHeight(wx - hw, wz + hd),
        this.terrainHeight(wx + hw, wz - hd),
        this.terrainHeight(wx - hw, wz - hd),
      );
      this.hayPositions.push({
        normX:    u - 0.5,
        normZ:    v - 0.5,
        wy,
        rotation: Math.random() * Math.PI * 2,
        isSeen:   true,
      });
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
