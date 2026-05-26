import {CGFobject} from '../../lib/CGF.js';

/**
 * MyLSystem
 * @constructor
 * @param scene - Reference to MyScene object
 */
export class MyLSystem extends CGFobject {
    constructor(scene) {
        super(scene);
        this.init();
    }

    init() {
        this.axiom = this.scene.axiom;
        this.iterations = this.scene.iterations;
        this.angle = this.scene.angle * Math.PI / 180.0;
        this.scale = Math.pow(this.scene.treeScaleFactor, this.iterations - 1);

        // 1. Call setup methods (which subclasses like MyLSTree will override)
        this.iniGrammar();
        this.initProductions();
        
        // 2. Automatically convert arrays to high-performance lookup maps
        this.buildOptimizationMaps();

        // 3. Run development sequence
        this.iterate();
    }

    // Default grammar setup (Subclasses may override this)
    iniGrammar() {
        this.grammar = ["F"];
        this.primitives = [new MyQuad(this.scene, 0.2, 1)];
    }

    // Default productions setup (Subclasses like MyLSTree override this)
    initProductions() {
        this.predecessor = ["X", "F"];
        this.successor = [this.scene.ruleX, this.scene.ruleF];
    }

    // Generates O(1) lookup tables from subclass arrays automatically
    buildOptimizationMaps() {
        this.grammarMap = {};
        if (this.grammar && this.primitives) {
            for (let i = 0; i < this.grammar.length; i++) {
                this.grammarMap[this.grammar[i]] = this.primitives[i];
            }
        }

        this.productionsMap = {};
        if (this.predecessor && this.successor) {
            for (let i = 0; i < this.predecessor.length; i++) {
                const pred = this.predecessor[i];
                if (!this.productionsMap[pred]) {
                    this.productionsMap[pred] = [];
                }
                this.productionsMap[pred].push(this.successor[i]);
            }
        }
    }

    iterate() {
        for (let i = 0; i < this.iterations; ++i) {
            let newString = "";

            for (let j = 0; j < this.axiom.length; ++j) {
                const char = this.axiom[j];
                const rules = this.productionsMap[char];

                if (!rules || rules.length === 0) {
                    newString += char;
                } else if (rules.length === 1) {
                    newString += rules[0];
                } else {
                    // Stochastic handling
                    newString += rules[Math.floor(Math.random() * rules.length)];
                }
            }
            this.axiom = newString;
        }
    }

    display() {
        // REMOVED the global setDefaultAppearance from here so leaves can have their own color
    
        for (let i = 0; i < this.axiom.length; ++i) {
            switch(this.axiom[i]) {
                case "+": this.scene.rotate(this.angle, 0, 0, 1); break;
                case "-": this.scene.rotate(-this.angle, 0, 0, 1); break;
                case "\\": this.scene.rotate(-this.angle, 0, 1, 0); break;
                case "/": this.scene.rotate(-this.angle, 0, 1, 0); break;
                case "^": this.scene.rotate(-this.angle, 1, 0, 0); break;
                case "&": this.scene.rotate(-this.angle, 1, 0, 0); break;
                case "[": this.scene.pushMatrix(); break;
                case "]": this.scene.popMatrix(); break;
    
                default:
                    // High-speed O(1) primitive lookups
                    const primitive = this.grammarMap[this.axiom[i]];
                    if (primitive) {
                        this.scene.pushMatrix();
                        this.scene.scale(this.scale, this.scale, this.scale);
                        
                        // FIX: Set the appearance for the specific primitive (branch OR leaf) right before rendering
                        primitive.setDefaultAppearance(); 
                        primitive.display();
                        
                        this.scene.popMatrix();
                        this.scene.translate(0, this.scale, 0);
                    }
                    break;
            }
        }
    }
}