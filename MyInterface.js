import {CGFinterface, dat} from '../lib/CGF.js';

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

        //Checkbox element in GUI
        this.gui.add(this.scene, 'displayAxis').name('Display Axis');
        this.gui.add(this.scene, 'displaySphere').name('Display Sphere');

        //Slider element in GUI
        this.gui.add(this.scene, 'scaleFactor', 0.1,200).name('Scale Factor');

        // ── Cloud controls ─────────────────────────────────────────────────
        const cloudFolder = this.gui.addFolder('Clouds');
        cloudFolder.add(this.scene, 'displayClouds').name('Display Clouds');
        cloudFolder.add(this.scene, 'cloudSpeed',   0.0, 0.008 ).name('Speed');
        cloudFolder.add(this.scene, 'cloudDensity', 0.0, 0.9).name('Density');
        cloudFolder.add(this.scene, 'cloudScale',   1.0, 20.0 ).name('Scale');
        cloudFolder.open();

        return true;
    }
}