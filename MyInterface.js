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

        // let skyFolder = this.gui.addFolder('Sky Configuration');
        // // Azimuth controls horizontal position
        // skyFolder.add(this.scene, 'sunAzimuth', 0, 360).name('Sun Azimuth');
        
        // // Elevation controls height (-10 is just below horizon, 90 is high noon)
        // skyFolder.add(this.scene, 'sunElevation', -10, 90).name('Sun Elevation');
        
        // skyFolder.open();

        return true;
    }
}