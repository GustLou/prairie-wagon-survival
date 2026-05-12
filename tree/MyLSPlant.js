import { MyLSystem } from "./MyLSystem.js";
import { MyBranch } from "./MyBranch.js";
import { MyLeaf } from "./MyLeaf.js";

/**
 * MyLSPlant
 * @constructor
 * @param scene - Reference to MyScene object
 */
export class MyLSPlant extends MyLSystem {
	constructor(scene, trunkWidth = 0.25, leafScale = 20) {
        super(scene);
        this.trunkWidth = trunkWidth;
        this.leafScale = leafScale;
    }

    // Cria o lexico da gramatica
    iniGrammar(){
        this.grammar = []
        this.primitives = []

        // adicionar pares caracter / primitiva
        this.grammar.push("F")
        this.primitives.push(new MyBranch(this.scene, this.trunkWidth));
        this.grammar.push("X")
        this.primitives.push(new MyLeaf(this.scene, this.leafScale));
    }

    // cria as producoes
    initProductions(){
        // cria dois arrays para as producoes: predecessor -> successor
        this.predecessor = ["F", "X", "X", "X", "X", "X", "X", "X", "X", "X"];
        this.successor = ["FF", "F[-X][X]F[-X]+X", "F[-X][x]+X", "F[+X]-X", "F[/X][X]F[\\X]+X", "F[\\X][x]/X", "F[/X]\\X", "F[^X][X]F[&X]^X", "F[^X]&X", "F[&X]^X"];
    }
}