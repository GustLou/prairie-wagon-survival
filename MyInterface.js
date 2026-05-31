import { CGFinterface, dat } from "./lib/CGF.js";

/**
 * MyInterface
 * @constructor
 */
export class MyInterface extends CGFinterface {
  constructor() {
    super();
  }

  init(application) {
    super.init(application);

    this.gui = new dat.GUI();

    // ── HUD folder (open) — game stats visible at a glance ───────────────
    const hudFolder = this.gui.addFolder('Game');
    hudFolder.add(this.scene, 'elapsedDisplay').name('Score').listen();
    hudFolder.add(this.scene, 'health', 0, 150, 1).name('Health Left').listen();
    hudFolder.add(this.scene, 'instantDamage', 0, 50, 0.5).name('Instant Dmg').listen();
    hudFolder.add(this.scene, 'instantGain', 0, 50, 0.5).name('HP Restored').listen();
    hudFolder.add(this.scene, 'balesDropped', 0, 99999, 1).name('Bales in Barn').listen(); // must be a numeric bar, even though it doesn't make any sense, so we used a very big number that is impossible to beat
    hudFolder.open();

    // ── Settings folder (closed) — all developer/debug controls ──────────
    const settings = this.gui.addFolder('Settings');
    // Settings stays closed by default (no .open() call)

    // Actions object for button-style controls
    const actions = {
      generatePath:    () => { this.scene.newRandomPath(); seedCtrl.updateDisplay(); },
      generateTree:    () => this.scene.generateTrees(),
      generateRocks:   () => this.scene.generateRocks(),
      generateGrass:   () => this.scene.rebuildGrass(),
      generateFlowers: () => this.scene.generateFlowers(),
      generateHay:     () => this.scene.generateHay(),
      save:            () => this.scene.saveCurrentPath(),
      print:           () => this.scene.printSavedPath(),
      toggleDisplayAll:() => this.scene.toggleDisplayAll(),
    };

    // Global controls
    const globalFolder = settings.addFolder('Global');
    globalFolder.add(this.scene, 'globalScaleFactor', 0.1, 5).name('Scale Factor');
    globalFolder.add(this.scene, 'displayAxis').name('Display Axis');
    globalFolder.add(actions, 'toggleDisplayAll').name('Toggle Display All');
    globalFolder.add(this.scene, 'followCamera').name('Camera Follows Wagon');

    // Sky controls
    const skyFolder = settings.addFolder('Sky');
    skyFolder.add(this.scene, 'displaySky').name('Display Sky');
    skyFolder.add(this.scene, 'skyScaleFactor', 0.1, 200).name('Scale Factor');
    skyFolder.add(this.scene, 'displaySun').name('Display Sun');
    skyFolder.add(this.scene, 'sunScale', 0.1, 20).name('Sun Size');
    skyFolder.add(this.scene, 'sunSpeed', 0.0, 1.0).name('Sun Speed');
    skyFolder.add(this.scene, 'displayClouds').name('Display Clouds');
    skyFolder.add(this.scene, 'cloudSpeed', 0.0, 0.5).name('Cloud Speed');
    skyFolder.add(this.scene, 'cloudDensity', 0.0, 0.9).name('Cloud Density');
    skyFolder.add(this.scene, 'cloudSize', 1.0, 50.0).name('Cloud Size');

    // Ground controls
    const groundFolder = settings.addFolder('Ground');
    groundFolder.add(this.scene, 'displayGround').name('Display Terrain');
    groundFolder.add(this.scene, 'uHeightScale', 0.01, 0.5).name('Height Scale')
      .onChange(v => this.scene.terrainShader.setUniformsValues({ uHeightScale: v }));

    // Path generation controls
    const pathFolder = settings.addFolder('Path Generation');
    pathFolder.add(this.scene, 'pathNumPoints', 3, 21, 1).name('Nodes')
              .onChange(() => this.scene.rebuildPath());
    const seedCtrl = pathFolder.add(this.scene, 'pathSeed', 0, 999, 1).name('Seed')
              .onChange(() => this.scene.rebuildPath());
    pathFolder.add(this.scene, 'pathWidth', 0.01, 0.1).name('Width')
              .onChange(v => this.scene.terrainShader.setUniformsValues({ uPathWidth: v }));
    pathFolder.add(actions, 'generatePath').name('Generate New Path');
    pathFolder.add(actions, 'save').name('Save Current Path');
    pathFolder.add(actions, 'print').name('Print Saved Path');

    // Tree controls
    const treeFolder = settings.addFolder('Trees');
    treeFolder.add(this.scene, 'displayTree').name('Display Trees');
    treeFolder.add(this.scene, 'treeScaleFactor').name('Scale Factor');
    treeFolder.add(this.scene, 'treeDensity', 0, 0.5).name('Density');
    treeFolder.add(this.scene, 'treeMinDistanceToPath').name('Min Distance to Path');
    treeFolder.add(actions, 'generateTree').name('Generate Layout');

    // Flower controls
    const flowerFolder = settings.addFolder('Flowers');
    flowerFolder.add(this.scene, 'displayFlower').name('Display Flowers');
    flowerFolder.add(this.scene, 'flowerScaleFactor').name('Scale Factor');
    flowerFolder.add(this.scene, 'flowerDensity', 0, 0.5).name('Density');
    flowerFolder.add(this.scene, 'flowerMinDistanceToPath').name('Min Distance to Path');
    flowerFolder.add(actions, 'generateFlowers').name('Generate Layout');

    // Grass controls
    const grassFolder = settings.addFolder('Grass');
    grassFolder.add(this.scene, 'displayGrass').name('Display');
    grassFolder.add(this.scene, 'numPatches', 0, 200, 1).name('Patch Count')
               .onFinishChange(() => this.scene.rebuildGrass());
    grassFolder.add(this.scene, 'bladesPerPatch', 1, 100, 1).name('Blades per Patch')
               .onFinishChange(() => this.scene.rebuildGrass());
    grassFolder.add(this.scene, 'grassMinDistanceToPath').name('Min Distance to Path');
    grassFolder.add(this.scene, 'grassScaleFactor').name('Scale Factor');
    grassFolder.add(actions, 'generateGrass').name('Generate Layout');

    // Rock controls
    const rockFolder = settings.addFolder('Rocks');
    rockFolder.add(this.scene, 'displayRock').name('Display');
    rockFolder.add(this.scene, 'numRocks', 1, 50, 1).name('Count')
              .onFinishChange(() => this.scene.generateRocks());
    rockFolder.add(this.scene, 'rockSpawnSeed', 0, 100, 0.1).name('Spawn Seed')
              .onFinishChange(() => this.scene.generateRocks());
    rockFolder.add(this.scene, 'rockMinDistanceToPath').name('Min Distance to Path');
    rockFolder.add(this.scene, 'rockScaleFactor').name('Scale Factor');
    rockFolder.add(actions, 'generateRocks').name('Generate Layout');

    // Barn controls
    const barnFolder = settings.addFolder('Barn');
    barnFolder.add(this.scene, 'displayBarn').name('Display Barn');
    barnFolder.add(this.scene, 'displayFence').name('Display Fence');
    barnFolder.add(this.scene, 'barnScale', 0.2, 5.0, 0.05).name('Barn Scale');
    barnFolder.add(this.scene, 'fenceRadius', 0.5, 8.0, 0.1).name('Fence Radius');
    barnFolder.add(this.scene, 'fenceEntranceArc', 0, Math.PI, 0.02).name('Entrance Width');

    // Hay silo controls (Hay Level is driven by health — not a manual slider)
    const siloFolder = settings.addFolder('Hay Silo');
    siloFolder.add(this.scene, 'displaySilo').name('Display Silo');
    siloFolder.add(this.scene, 'siloOffsetX', -3, 3, 0.05).name('Offset X (local)');
    siloFolder.add(this.scene, 'siloOffsetZ', -3, 3, 0.05).name('Offset Z (local)');

    // Wagon controls
    const wagonFolder = settings.addFolder('Wagon');
    wagonFolder.add(this.scene, 'displayWagon').name('Display');
    wagonFolder.add(this.scene, 'wagonScaleFactor').name('Scale Factor');
    wagonFolder.add(this.scene, 'wagonAcceleration', 0.001, 5).name('Acceleration');
    wagonFolder.add(this.scene, 'wagonTurnRate', 0.01, 0.2).name('Turn Rate');

    this.initKeys();

    return true;
  }

  initKeys() {
    this.scene.gui = this;
    this.processKeyboard = function () {};
    this.activeKeys = {};
  }

  processKeyDown(event) {
    this.activeKeys[event.code] = true;

    // ── Game state transitions ────────────────────────────────────────────
    if (this.scene.gameState === 'start') {
      this.scene.startGame();
      return;
    }
    if (this.scene.gameState === 'gameover' && event.code === 'KeyR') {
      this.scene.resetGame();
    }
  }

  processKeyUp(event) {
    this.activeKeys[event.code] = false;
  }

  isKeyPressed(keyCode) {
    return this.activeKeys[keyCode] || false;
  }
}
