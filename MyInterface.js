import { CGFinterface, dat } from "../lib/CGF.js";

/**
 * MyInterface
 * @constructor
 */
export class MyInterface extends CGFinterface {
  constructor() {
    super();
  }

  init(application) {
    // call CGFinterface init
    super.init(application);

    // init GUI. For more information on the methods, check:
    // https://github.com/dataarts/dat.gui/blob/master/API.md
    this.gui = new dat.GUI();

    const actions = {
      generatePath:    () => { this.scene.newRandomPath(); seedCtrl.updateDisplay();},
      generateTree:    () => this.scene.generateTrees(),
      generateRocks:   () => this.scene.generateRocks(),
      generateGrass:   () => this.scene.rebuildGrass(),
      generateFlowers: () => this.scene.generateFlowers(),
      save:            () => this.scene.saveCurrentPath(),
      print:           () => this.scene.printSavedPath(),
      toggleDisplayAll:() => this.scene.toggleDisplayAll(),
    };

    // Global controls
    const globalFolder = this.gui.addFolder("Global");
    globalFolder.add(this.scene, "globalScaleFactor", 0.1, 200).name("Scale Factor");
    globalFolder.add(this.scene, "displayAxis").name("Display Axis");
    globalFolder.add(actions, "toggleDisplayAll").name("Toggle Display All");

    // Sky controls
    const skyFolder = this.gui.addFolder("Sky");
    skyFolder.add(this.scene, "displaySky").name("Display Sky");
    skyFolder.add(this.scene, "skyScaleFactor", 0.1, 200).name("Scale Factor");
    skyFolder.add(this.scene, "displaySun").name("Display Sun");
    skyFolder.add(this.scene, "sunScale", 0.1, 20).name("Sun Size");

    // Cloud controls
    // const cloudFolder = this.gui.addFolder("Clouds");
    skyFolder.add(this.scene, "displayClouds").name("Display Clouds");
    skyFolder.add(this.scene, "cloudSpeed", 0.0, 0.5).name("Speed");
    skyFolder.add(this.scene, "cloudDensity", 0.0, 0.9).name("Density");
    skyFolder.add(this.scene, "cloudSize", 1.0, 50.0).name("Cloud Size");

    // Tree controls
    const treeFolder = this.gui.addFolder('Tree');
    treeFolder.add(this.scene, 'displayTree').name('Display Trees');
    treeFolder.add(this.scene, 'axiom').name('Axiom');
    treeFolder.add(this.scene, 'angle').name('Angle');
    treeFolder.add(this.scene, 'iterations').name('Iterations');
    treeFolder.add(this.scene, 'treeScaleFactor').name('Scale Factor');
    treeFolder.add(this.scene, 'treeMinDistanceToPath').name('Min Distance to Path');
    treeFolder.add(this.scene, 'treeDensity', 0, 0.5).name('Density');
    treeFolder.add(actions, 'generateTree').name('Generate Layout');

    // Flower controls
    const flowerFolder = this.gui.addFolder('Flower');
    flowerFolder.add(this.scene, 'displayFlower').name('Display Flowers');
    flowerFolder.add(this.scene, 'flowerScaleFactor').name('Scale Factor');
    flowerFolder.add(this.scene, 'flowerMinDistanceToPath').name('Min Distance to Path');
    flowerFolder.add(this.scene, 'flowerDensity', 0, 0.5).name('Density');
    flowerFolder.add(actions, 'generateFlowers').name('Generate Layout');
    // flowerFolder.open();

    // Ground controls
    const groundFolder = this.gui.addFolder("Ground");
    groundFolder.add(this.scene, "displayGround").name("Display Terrain");
    groundFolder.add(this.scene, "groundScale", 0.1, 200).name("Ground Scale");

    // Path generation controls
    const pathFolder = this.gui.addFolder("Path Generation");
    pathFolder.add(this.scene, "pathNumPoints", 3, 21, 1).name("Nodes")
              .onChange(() => this.scene.rebuildPath());
    const seedCtrl = pathFolder.add(this.scene, "pathSeed", 0, 999, 1).name("Seed")
              .onChange(() => this.scene.rebuildPath());
    pathFolder.add(this.scene, "pathWidth", 0.01, 0.1).name("Width")
              .onChange(v => this.scene.terrainShader.setUniformsValues({ uPathWidth: v }));
    pathFolder.add(actions, "generatePath").name("Generate New Path");
    pathFolder.add(actions, "save").name("Save Current Path");
    pathFolder.add(actions, "print").name("Print Saved Path");

    const grassFolder = this.gui.addFolder('Grass');
    grassFolder.add(this.scene, 'displayGrass').name('Display');
    grassFolder.add(this.scene, 'numPatches', 0, 80, 1).name('Patch Count')
               .onFinishChange(() => this.scene.rebuildGrass());
    grassFolder.add(this.scene, 'bladesPerPatch', 1, 40, 1).name('Blades per Patch')
               .onFinishChange(() => this.scene.rebuildGrass());
    grassFolder.add(this.scene, 'grassMinDistanceToPath').name('Min Distance to Path');
    grassFolder.add(this.scene, 'grassScaleFactor').name('Scale Factor');
    grassFolder.add(actions, 'generateGrass').name('Generate Layout');

    const rockFolder = this.gui.addFolder('Rock');
    rockFolder.add(this.scene, 'displayRock').name('Display');
    rockFolder.add(this.scene, 'numRocks',      1,   50,  1  ).name('Count')
          .onFinishChange(() => this.scene.rebuildRocks());
    rockFolder.add(this.scene, 'rockSpawnSeed', 0,  100,  0.1).name('Spawn Seed')
          .onFinishChange(() => this.scene.rebuildRocks());
    rockFolder.add(this.scene, 'rockMinDistanceToPath').name('Min Distance to Path');
    rockFolder.add(this.scene, 'rockScaleFactor').name('Scale Factor');
    rockFolder.add(actions, 'generateRocks').name('Generate Layout');
    return true;
    }
}
