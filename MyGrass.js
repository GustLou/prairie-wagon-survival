import { CGFobject } from "../lib/CGF.js";
export class MyGrass extends CGFobject {
  /**
   *
   * @param scene - The CGFScene
   * @param levels - The levels (layers) of the grass object
   * @param width - The initial width
   * @param height - The height
   */
  constructor(scene, levels = 4, width = 0.2, height = 1.0) {
    super(scene);

    // procedural variation of these fields
    this.levels = levels;
    this.width = width * (0.8 + Math.random() * 0.4);
    this.height = height * (0.7 + Math.random() * 0.6);
    this.tilt = (Math.random() - 0.5) * 0.2; // Small random lean
    this.health = Math.random(); // how alive is the grass blade 0.0 - almost dead 1.0 - fully alive, will use this for the colors

    this.initBuffers();
  }

  initBuffers() {
    this.vertices = [];
    this.indices = [];
    this.normals = [];
    this.texCoords = [];

    for (let i = 0; i <= this.levels; i++) {
      // for each layer of the grass object
      let v = i / this.levels;
      let y = v * this.height;

      // tapering: the grass gets thinner as the level goes up
      let currentWidth = this.width * (1 - v);
      let xOffset = v * v * this.tilt;

      // create two vertices for the "floor" of the blade grass
      this.vertices.push(-currentWidth / 2 + xOffset, y, 0); // Left vertex
      this.vertices.push(currentWidth / 2 + xOffset, y, 0); // Right vertex

      // normals and TexCoords
      this.normals.push(0, 0, 1, 0, 0, 1);
      this.texCoords.push(0, 1 - v, 1, 1 - v);

      // Connect this floor to the one below it using two triangles (one quad)
      if (i > 0) {
        let base = (i - 1) * 2;
        this.indices.push(base, base + 1, base + 2); // Triangle 1
        this.indices.push(base + 1, base + 3, base + 2); // Triangle 2
      }
    }
    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
  }
}
