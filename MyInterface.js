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
        this.gui.add(this.scene, 'scaleFactor', 0.1, 200).name('Scale Factor');
        this.gui.add(this.scene, 'sunScale', 0.1, 20).name('Sun Size');
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
        const cloudFolder = this.gui.addFolder('Clouds');
        cloudFolder.add(this.scene, 'displayClouds').name('Display Clouds');
        cloudFolder.add(this.scene, 'cloudSpeed',   0.0, 0.008 ).name('Speed');
        cloudFolder.add(this.scene, 'cloudDensity', 0.0, 0.9).name('Density');
        cloudFolder.add(this.scene, 'cloudScale',   1.0, 20.0 ).name('Scale');
        cloudFolder.open();

        return true;
    }
}