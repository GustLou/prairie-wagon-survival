import { CGFobject, CGFappearance, CGFtexture } from "../../lib/CGF.js";
import { WagonWall } from "./WagonWall.js";
import { MyQuad } from "../../tp4/MyQuad.js";
import { MyHalfCylinder } from '../primitives/MyHalfCylinder.js';
import { MyTongue } from './MyTongue.js';
import { MyWheel } from './MyWheel.js';
import { CGFobjModel } from "../extra-libs/CGFobjModel.js";

export class MyWagon extends CGFobject {
  constructor(scene, woodTexture, clothTexture, numPlanks = 3, plankHeight = 0.5, taper = -0.1, baseWidth = 2, baseLength = 4, plankSpace = 0.01) {
    super(scene);

    if (woodTexture) {
      this.woodMaterial = new CGFappearance(scene);
      this.woodMaterial.setAmbient(0.7, 0.7, 0.7, 1.0);
      this.woodMaterial.setDiffuse(1.0, 1.0, 1.0, 1.0);
      this.woodMaterial.setSpecular(0.0, 0.0, 0.0, 1.0);
      this.woodMaterial.setShininess(10.0);
      
      this.woodTexture = new CGFtexture(scene, woodTexture);
      this.woodMaterial.setTexture(this.woodTexture);
      this.woodMaterial.setTextureWrap("REPEAT", "REPEAT");
    }
    if (clothTexture) {
      this.clothMaterial = new CGFappearance(scene);
      this.clothMaterial.setAmbient(0.7, 0.7, 0.7, 1.0);
      this.clothMaterial.setDiffuse(1.0, 1.0, 1.0, 1.0);
      this.clothMaterial.setSpecular(0.0, 0.0, 0.0, 1.0);
      this.clothMaterial.setShininess(10.0);
    
      this.clothTexture = new CGFtexture(scene, clothTexture);
      this.clothMaterial.setTexture(this.clothTexture);
      this.clothMaterial.setTextureWrap("REPEAT", "REPEAT");
    }

    this.baseLength = baseLength;
    this.baseWidth = baseWidth;
    this.numPlanks = numPlanks;
    this.plankHeight = plankHeight;
    this.plankSpace = plankSpace;
    this.taper = taper;
    this.wheelAng = 0;
    this.wheelWidth = 0.1;
    this.initAng0 = Math.random() * 2 * Math.PI;
    this.initAng1 = Math.random() * 2 * Math.PI;
    this.initAng2 = Math.random() * 2 * Math.PI;
    this.initAng3 = Math.random() * 2 * Math.PI;
    
    const interceptingPlank = Math.round(numPlanks*0.6);

    let h = interceptingPlank * (plankHeight + plankSpace);

    let dw = (1 - Math.pow(1-taper, interceptingPlank)) * baseWidth;
    this.backAng = Math.PI / 2 - Math.atan2(h, dw);

    this.back = new WagonWall(scene, numPlanks, baseWidth, plankHeight, taper, plankSpace);
    this.side = new WagonWall(scene, numPlanks, baseLength, plankHeight, taper, plankSpace);
    this.floor = new MyQuad(scene);
    this.tongue = new MyTongue(scene, 0.08, 0.05, 3.0);
    this.wheel = new MyWheel(scene, 8, 2, 1, this.wheelWidth);
    this.cloth = new MyHalfCylinder(scene);
    this.horse = new CGFobjModel(this.scene, 'obj-models/horse.obj');
  }

  display() {
    if (this.woodTexture) this.woodMaterial.apply();

    if (this.wheelAng < 2 * Math.PI) this.wheelAng += 0.1;
    else this.wheelAng = 0;
    // front wall
    this.back.display();
    
    // slanted back wall
    this.scene.translate(0, 0, -this.baseLength);
    this.scene.rotate(this.backAng, 1, 0, 0);
    this.back.display();
    this.scene.rotate(-this.backAng, 1, 0, 0);
    this.scene.translate(0, 0, this.baseLength);
    
    // floor
    this.scene.scale(this.baseWidth, 4, this.baseLength)
    this.scene.rotate(Math.PI / 2, 1, 0, 0);
    this.scene.translate(0, -0.5, 0);
      this.floor.display();    
    this.scene.translate(0, 0.5, 0);
    this.scene.rotate(-Math.PI / 2, 1, 0, 0);
    this.scene.scale(1/this.baseWidth, 0.25, 1/this.baseLength);
    
    // side walls
    this.scene.translate(0, 0, -this.baseLength/2);
    this.scene.rotate(Math.PI / 2, 0, 1, 0);
      this.scene.translate(0, 0, this.baseWidth/2);
      this.side.display();

      this.scene.translate(0, 0, -this.baseWidth);
      this.side.display();
      this.scene.translate(0, 0, this.baseWidth/2);
    this.scene.rotate(-Math.PI / 2, 0, 1, 0);
    this.scene.translate(0, 0, this.baseLength/2);

    // wheels
    this.scene.rotate(Math.PI / 2, 0, 0, 1);
      this.scene.rotate(-this.wheelAng, 0, 1, 0);
      this.scene.translate(0, -this.wheelWidth -this.baseWidth/2, 0);
      this.wheel.display();
      this.scene.translate(0,this.baseWidth + this.wheelWidth*2,0 );
      this.wheel.display();
      this.scene.translate(0,-this.wheelWidth-this.baseWidth/2,0);
      this.scene.rotate(this.wheelAng, 0, 1, 0);
    this.scene.translate(0, 0, -this.baseLength);
      this.scene.rotate(-this.wheelAng, 0, 1, 0);
      this.scene.translate(0, -this.wheelWidth -this.baseWidth/2, 0);
      this.wheel.display();
      this.scene.translate(0,this.baseWidth + this.wheelWidth*2,0 );
      this.wheel.display();
      this.scene.translate(0,-this.wheelWidth-this.baseWidth/2,0);
      this.scene.rotate(this.wheelAng, 0, 1, 0);
    this.scene.translate(0, 0, this.baseLength);
    this.scene.rotate(-Math.PI / 2, 0, 0, 1);


    // tongue
    this.tongue.display();

    // horses
    // this.horse.display();

    // cloth
    if (this.clothTexture) this.clothMaterial.apply();
    this.scene.scale(this.baseWidth, 4, this.baseLength/2)
    this.scene.rotate(Math.PI / 2, 1, 0, 0);
    this.scene.translate(0, -0.5, 0);
    this.scene.translate(0, -this.baseLength/this.baseLength/2, -this.numPlanks*this.plankHeight/this.baseLength); // /this.baseLength to offset the scale
    this.scene.rotate(Math.PI, 0, 1, 0);
      this.cloth.display();
    this.scene.rotate(-Math.PI, 0, 1, 0);
    this.scene.translate(0, this.baseLength/this.baseLength/2, this.numPlanks*this.plankHeight/this.baseLength);    
    this.scene.translate(0, 0.5, 0);
    this.scene.rotate(-Math.PI / 2, 1, 0, 0);
    this.scene.scale(1/this.baseWidth, 0.25, 2/this.baseLength);

    // TODO: hays
  }
}