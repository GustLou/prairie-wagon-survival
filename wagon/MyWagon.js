import { CGFobject, CGFappearance, CGFtexture } from "../../lib/CGF.js";
import { WagonWall } from "./WagonWall.js";
import { MyQuad } from "../../tp4/MyQuad.js";
import { MyHalfCylinder } from '../primitives/MyHalfCylinder.js';
import { MyTongue } from './MyTongue.js';
import { MyWheel } from './MyWheel.js';
import { CGFobjModel } from "../extra-libs/CGFobjModel.js";

export class MyWagon extends CGFobject {
  constructor(scene, woodTexture, clothTexture, numPlanks = 3, plankHeight = 0.5, taper = -0.1, baseWidth = 2, baseLength = 2.5, plankSpace = 0.01, wheelWidth = 0.1, wheelSpeed = Math.PI, tongueLength = 3) {
    super(scene);

    this.hayCount = 2;

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
    this.wheelWidth = wheelWidth;
    this.wheelSpeed = wheelSpeed;
    this.tongueLength = tongueLength;
    this.initAng0 = Math.random() * 2 * Math.PI;
    this.initAng1 = Math.random() * 2 * Math.PI;
    this.initAng2 = Math.random() * 2 * Math.PI;
    this.initAng3 = Math.random() * 2 * Math.PI;
    
    // wall math
    let h = numPlanks * (plankHeight + plankSpace);

    // Assuming symmetrical taper along the length of the wagon
    let dw = (1 - Math.pow(1-taper, numPlanks)) * (baseLength / 2);
    this.backAng = Math.PI / 2 - Math.atan2(h, dw);

    let dl = (1 - Math.pow(1-taper, numPlanks)) * (baseWidth / 2);
    this.sideAng = Math.PI / 2 - Math.atan2(h, dl);

    // cloth math
    this.totalHeight = this.numPlanks * this.plankHeight;
    this.topExcessWidth = -this.totalHeight * Math.tan(this.sideAng);
    this.topExcessLength = -this.totalHeight * Math.tan(this.backAng);

    this.clothWidth = this.baseWidth + (2 * this.topExcessWidth);
    this.clothLength = this.baseLength + (2 * this.topExcessLength);

    this.wheelBaseWidth = this.baseWidth + this.topExcessWidth; // halfway

    this.yOffset = this.baseLength / this.clothLength;

    this.back = new WagonWall(scene, numPlanks, baseWidth, plankHeight, taper, plankSpace);
    this.side = new WagonWall(scene, numPlanks, baseLength, plankHeight, taper, plankSpace);
    this.floor = new MyQuad(scene);
    this.tongue = new MyTongue(scene, 0.08, 0.05, tongueLength);
    this.axis = new MyTongue(scene, 0.08, 0.05, this.clothWidth);
    this.wheel = new MyWheel(scene, 8, 2, 1, this.wheelWidth);
    this.cloth = new MyHalfCylinder(scene);
    this.horse = new CGFobjModel(this.scene, 'obj-models/horse3.obj');
  }

  display(horseAngle) {
    if (this.woodTexture) this.woodMaterial.apply();

    // front wall
    this.scene.rotate(-this.backAng, 1, 0, 0);
    this.back.display();
    this.scene.rotate(this.backAng, 1, 0, 0);
    
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
      this.scene.rotate(-this.sideAng, 1, 0, 0);
      this.side.display();
      this.scene.rotate(this.sideAng, 1, 0, 0);

      this.scene.translate(0, 0, -this.baseWidth);
      this.scene.rotate(this.sideAng, 1, 0, 0);
      this.side.display();
      this.scene.rotate(-this.sideAng, 1, 0, 0);
      this.scene.translate(0, 0, this.baseWidth/2);
    this.scene.rotate(-Math.PI / 2, 0, 1, 0);
    this.scene.translate(0, 0, this.baseLength/2);

    // wheels
    this.scene.rotate(Math.PI / 2, 0, 0, 1);
      this.scene.rotate(-this.wheelAng, 0, 1, 0);
      this.scene.translate(0, -this.wheelWidth*1.5 -this.wheelBaseWidth/2, 0); // the wheels were offset by half their width ???
        this.scene.rotate(-Math.PI/2, 1, 0, 0);
        this.axis.display();
        this.scene.rotate(Math.PI/2, 1, 0, 0);
        
        this.scene.rotate(this.initAng0, 0, 1, 0);
        this.wheel.display();
        this.scene.rotate(-this.initAng0, 0, 1, 0);
      this.scene.translate(0,this.wheelBaseWidth + this.wheelWidth*2,0 );
        this.scene.rotate(this.initAng1, 0, 1, 0);
        this.wheel.display();
        this.scene.rotate(-this.initAng1, 0, 1, 0);
      this.scene.translate(0,-this.wheelWidth-this.wheelBaseWidth/2,0);
      this.scene.rotate(this.wheelAng, 0, 1, 0);
    this.scene.translate(0, 0, -this.baseLength);
      this.scene.rotate(-this.wheelAng, 0, 1, 0);
      this.scene.translate(0, -this.wheelWidth -this.wheelBaseWidth/2, 0);
        this.scene.rotate(-Math.PI/2, 1, 0, 0);
        this.axis.display();
        this.scene.rotate(Math.PI/2, 1, 0, 0);
        
        this.scene.rotate(this.initAng2, 0, 1, 0);
        this.wheel.display();
        this.scene.rotate(-this.initAng2, 0, 1, 0);
      this.scene.translate(0,this.wheelBaseWidth + this.wheelWidth*2,0 );
        this.scene.rotate(this.initAng3, 0, 1, 0);
        this.wheel.display();
        this.scene.rotate(-this.initAng3, 0, 1, 0);
      this.scene.translate(0,-this.wheelWidth-this.wheelBaseWidth/2,0);
      this.scene.rotate(this.wheelAng, 0, 1, 0);
    this.scene.translate(0, this.wheelWidth/2, this.baseLength);
    this.scene.rotate(-Math.PI / 2, 0, 0, 1);


    // tongue
    this.scene.rotate(horseAngle, 1, 0, 0);
    this.tongue.display();

    // horses
    this.scene.rotate(Math.PI / 2, 0, 1, 0);
    this.scene.scale(0.4, 0.4, 0.4)
    this.scene.translate(-this.tongueLength - 5,0,0);

    this.scene.translate(0, 0, this.baseWidth);
    this.horse.display();
    this.scene.translate(0, 0, -this.baseWidth*2);
    this.horse.display();
    this.scene.translate(0, 0, this.baseWidth);
    
    this.scene.translate(this.tongueLength + 5,0,0);
    this.scene.scale(2.5, 2.5, 2.5);
    this.scene.rotate(-Math.PI / 2, 0, 1, 0);
    this.scene.rotate(-horseAngle, 1, 0, 0);

    // cloth
    if (this.clothTexture) this.clothMaterial.apply();

    this.scene.scale(this.clothWidth, 4, this.clothLength / 2);
    this.scene.rotate(Math.PI / 2, 1, 0, 0);
    
    // Apply the dynamic yOffset to lock the center in place
    this.scene.translate(0, -this.yOffset, -this.totalHeight / 4); 
    
    this.scene.rotate(Math.PI, 0, 1, 0);
      this.cloth.display();
    this.scene.rotate(-Math.PI, 0, 1, 0);
    
    // Undoing the transformations cleanly
    this.scene.translate(0, this.yOffset, this.totalHeight / 4); 
    this.scene.rotate(-Math.PI / 2, 1, 0, 0);
    this.scene.scale(1 / this.clothWidth, 0.25, 2 / this.clothLength);

    // hays
    let offset = 0.6;
    this.scene.translate(0, 0, -0.6);
    for (let i = 0; i < this.hayCount; i++) {
      this.scene.hay.display(false);
      this.scene.translate(0, 0, -1.2);
      offset += 1.2;
    }
    this.scene.translate(0, 0, offset);
  }

  updateWheelAngle(speed) {
    this.wheelAng += this.wheelSpeed*speed;
  }
}