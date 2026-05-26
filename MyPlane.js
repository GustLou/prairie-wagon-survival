import { CGFobject } from "../lib/CGF.js";
/**
 * MyPlane
 * @constructor
 * @param scene - Reference to MyScene object
 * @param nDivs - number of divisions in both directions of the surface
 * @param minS - minimum texture coordinate in S
 * @param maxS - maximum texture coordinate in S
 * @param minT - minimum texture coordinate in T
 * @param maxT - maximum texture coordinate in T
 */
export class MyPlane extends CGFobject {
  constructor(scene, nrDivs, minS, maxS, minT, maxT) {
    super(scene);
    // nrDivs = 1 if not provided
    nrDivs = typeof nrDivs !== "undefined" ? nrDivs : 1;
    this.nrDivs = nrDivs;
    this.patchLength = 1.0 / nrDivs;
    this.minS = minS || 0;
    this.maxS = maxS || 1;
    this.minT = minT || 0;
    this.maxT = maxT || 1;
    this.q = (this.maxS - this.minS) / this.nrDivs;
    this.w = (this.maxT - this.minT) / this.nrDivs;
    this.initBuffers();
  }
  initBuffers() {
    // Generate vertices, normals, and texCoords
    this.vertices = [];
    this.normals = [];
    this.texCoords = [];
    var yCoord = 0.5;
    for (var j = 0; j <= this.nrDivs; j++) {
      var xCoord = -0.5;
      for (var i = 0; i <= this.nrDivs; i++) {
        this.vertices.push(xCoord, yCoord, 0);
        this.normals.push(0, 0, 1);
        this.texCoords.push(this.minS + i * this.q, this.minT + j * this.w);
        xCoord += this.patchLength;
      }
      yCoord -= this.patchLength;
    }
    // Generating indices
    this.indices = [];

    var ind = 0;
    for (var j = 0; j < this.nrDivs; j++) {
      for (var i = 0; i <= this.nrDivs; i++) {
        this.indices.push(ind);
        this.indices.push(ind + this.nrDivs + 1);
        ind++;
      }
      if (j + 1 < this.nrDivs) {
        this.indices.push(ind + this.nrDivs);
        this.indices.push(ind);
      }
    }
    this.primitiveType = this.scene.gl.TRIANGLE_STRIP;
    this.initGLBuffers();
  }

  static get MAX_PATH_EDGES() { return 20; }

  // Mulberry32 seeded PRNG — same seed always produces the same path
  seededRng(seed) {
    let s = seed >>> 0;
    return () => {
      s += 0x6D2B79F5;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Generates an MST over `numPoints` random points in UV space [0,1].
  // Pass a seed integer for reproducible layouts.
  // Stores this.pathEdges (Float32Array padded to MAX_PATH_EDGES vec4s) and this.numEdges.
  generateMSTEdges(numPoints, seed = 0) {
    const rng = this.seededRng(seed);
    const pts = Array.from({ length: numPoints }, () => [rng(), rng()]);
    // pts.push([0,0]);

    const inMST = new Array(numPoints).fill(false);
    const edges = [];
    inMST[0] = true;

    for (let step = 0; step < numPoints - 1; step++) {
      let best = { dist: Infinity, i: -1, j: -1 };
      for (let i = 0; i < numPoints; i++) {
        if (!inMST[i]) continue;
        for (let j = 0; j < numPoints; j++) {
          if (inMST[j]) continue;
          const dx = pts[i][0] - pts[j][0];
          const dy = pts[i][1] - pts[j][1];
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < best.dist) best = { dist: d, i, j };
        }
      }
      inMST[best.j] = true;
      edges.push([pts[best.i], pts[best.j]]);
    }

    // Pad to MAX_PATH_EDGES so gl.uniform4fv always fills the full declared array
    const flat = new Float32Array(MyPlane.MAX_PATH_EDGES * 4);
    edges.forEach(([a, b], i) => {
      flat[i * 4]     = a[0]; flat[i * 4 + 1] = a[1];
      flat[i * 4 + 2] = b[0]; flat[i * 4 + 3] = b[1];
    });
    this.pathEdges = flat;
    this.numEdges = edges.length;
    return edges;
  }

  setFillMode() {
    this.primitiveType = this.scene.gl.TRIANGLE_STRIP;
  }

  setLineMode() {
    this.primitiveType = this.scene.gl.LINES;
  }
}
