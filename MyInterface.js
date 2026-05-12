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
      generatePath: () => { this.scene.newRandomPath(); this.scene.generateTrees(); seedCtrl.updateDisplay();},
      generateTree: () => this.scene.generateTrees(),
      save:         () => this.scene.saveCurrentPath(),
      print:        () => this.scene.printSavedPath(),
    };

    //Checkbox element in GUI
    this.gui.add(this.scene, "displayAxis").name("Display Axis");
    this.gui.add(this.scene, "displaySphere").name("Display Sphere");

    //Slider element in GUI
    this.gui.add(this.scene, "scaleFactor", 0.1, 200).name("Scale Factor");
    this.gui.add(this.scene, "sunScale", 0.1, 20).name("Sun Size");
    // x position of sun
    // this.gui.add(this.scene,'sunPositionX',1,500).name('Sun X Position');
    // this.gui.add(this.scene,'sunPositionY',1,500).name('Sun Y Position');
    // this.gui.add(this.scene,'sunPositionZ',1,500).name('Sun Z Position');

    // let skyFolder = this.gui.addFolder('Sky Configuration');
    // // Azimuth controls horizontal position
    // skyFolder.add(this.scene, 'sunAzimuth', 0, 360).name('Sun Azimuth');

    // // Elevation controls height (-10 is just below horizon, 90 is high noon)
    // skyFolder.add(this.scene, 'sunElevation', -10, 90).name('Sun Elevation');

    // skyFolder.open();

    // ── Cloud controls ─────────────────────────────────────────────────
    const cloudFolder = this.gui.addFolder("Clouds");
    cloudFolder.add(this.scene, "displayClouds").name("Display Clouds");
    cloudFolder.add(this.scene, "cloudSpeed", 0.0, 0.008).name("Speed");
    cloudFolder.add(this.scene, "cloudDensity", 0.0, 0.9).name("Density");
    cloudFolder.add(this.scene, "cloudScale", 1.0, 50.0).name("Scale");
    cloudFolder.open();

    const treeFolder = this.gui.addFolder('Tree');
    treeFolder.add(this.scene, 'axiom').name('Axiom');
    treeFolder.add(this.scene, 'angle').name('Angle');
    treeFolder.add(this.scene, 'iterations').name('Iterations');
    treeFolder.add(this.scene, 'treeScaleFactor').name('Scale Factor');
    treeFolder.add(this.scene, 'treeMinDistanceToPath').name('Min Distance to Path');
    treeFolder.add(this.scene, 'treeDensity', 0, 0.5).name('Density');
    treeFolder.add(this.scene, 'button').name('Generate Trees');
    treeFolder.add(actions, 'generateTree').name('Generate Layout');
    treeFolder.open();

    // Ground controls
    const groundFolder = this.gui.addFolder("Ground");
    groundFolder.add(this.scene, "displayGround").name("Display Terrain");
    groundFolder.add(this.scene, "groundScale", 0.1, 200).name("Ground Scale");
    groundFolder.open();

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
    pathFolder.open();

    const grassFolder = this.gui.addFolder('Grass');
    grassFolder.add(this.scene, 'numPatches', 0, 80, 1).name('Patch Count')
               .onFinishChange(() => this.scene.rebuildGrass());
    grassFolder.add(this.scene, 'bladesPerPatch', 1, 40, 1).name('Blades per Patch')
               .onFinishChange(() => this.scene.rebuildGrass());
    grassFolder.open();

    const rockFolder = this.gui.addFolder('Rock');
    rockFolder.add(this.scene, 'displayRock').name('Display');
    rockFolder.add(this.scene, 'rockScale',     0.1, 5.0 ).name('Scale');
    rockFolder.add(this.scene, 'rockSeed',      0.0, 20.0).name('Seed')
                .onFinishChange(() => this.scene.rebuildRock());
    rockFolder.add(this.scene, 'rockRoughness', 0.0,  0.4).name('Roughness')
                .onFinishChange(() => this.scene.rebuildRock());
    rockFolder.add(this.scene, 'rockTexBlend',  0.0,  1.0).name('Texture Blend');
    rockFolder.open();
    return true;
    }
}
