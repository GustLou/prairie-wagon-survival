import { CGFobject } from "./lib/CGF.js";
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

  /**
   * Generates an MST over `numPoints` points in UV space [0,1].
   *
   * @param {number}   numPoints      - Total node count (fixed + random).
   * @param {number}   seed           - PRNG seed for reproducible random nodes.
   * @param {Array}    fixedPoints    - UV coords [[u,v],...] prepended before random nodes.
   *                                   These are guaranteed to be connected to each other
   *                                   (consecutive pairs get a direct edge) and are the
   *                                   seeds from which Prim's expands outward.
   * @param {Array}    exclusionZones - [{cx,cz,r}] in UV space. Random nodes that fall
   *                                   inside any zone are rejected and regenerated.
   *
   * Stores this.pathEdges (Float32Array padded to MAX_PATH_EDGES vec4s) and this.numEdges.
   */
  generateMSTEdges(numPoints, seed = 0, fixedPoints = [], exclusionZones = []) {
    const rng = this.seededRng(seed);
    const nFixed = fixedPoints.length;
    const randomCount = numPoints - nFixed;

    // Generate random points, skipping those inside any exclusion zone
    const randomPts = [];
    let attempts = 0;
    while (randomPts.length < randomCount && attempts < randomCount * 100) {
      attempts++;
      const p = [rng(), rng()];
      const blocked = exclusionZones.some(({ cx, cz, r }) => {
        const dx = p[0] - cx, dz = p[1] - cz;
        return (dx * dx + dz * dz) < r * r;
      });
      if (!blocked) randomPts.push(p);
    }
    // Safety fill if we somehow exhausted attempts
    while (randomPts.length < randomCount) randomPts.push([rng(), rng()]);

    // pts[0..nFixed-1] are the guaranteed fixed nodes; rest are random
    const pts = [...fixedPoints, ...randomPts];
    const n   = pts.length;

    const inMST = new Array(n).fill(false);
    const edges = [];

    // Mark all fixed nodes as already in the MST and link them in order
    for (let i = 0; i < nFixed; i++) inMST[i] = true;
    for (let i = 0; i < nFixed - 1; i++) edges.push([pts[i], pts[i + 1]]);

    // Fallback: if no fixed points, start with node 0 as usual
    if (nFixed === 0) inMST[0] = true;

    // Prim's algorithm for the remaining nodes
    const stepsNeeded = n - Math.max(1, nFixed);
    for (let step = 0; step < stepsNeeded; step++) {
      let best = { dist: Infinity, i: -1, j: -1 };
      for (let i = 0; i < n; i++) {
        if (!inMST[i]) continue;
        for (let j = 0; j < n; j++) {
          if (inMST[j]) continue;
          const dx = pts[i][0] - pts[j][0];
          const dy = pts[i][1] - pts[j][1];
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < best.dist) best = { dist: d, i, j };
        }
      }
      if (best.j === -1) break;
      inMST[best.j] = true;
      edges.push([pts[best.i], pts[best.j]]);
    }

    // Pad to MAX_PATH_EDGES so gl.uniform4fv always fills the full declared array
    const flat = new Float32Array(MyPlane.MAX_PATH_EDGES * 4);
    edges.forEach(([a, b], i) => {
      if (i >= MyPlane.MAX_PATH_EDGES) return;
      flat[i * 4]     = a[0]; flat[i * 4 + 1] = a[1];
      flat[i * 4 + 2] = b[0]; flat[i * 4 + 3] = b[1];
    });
    this.pathEdges = flat;
    this.numEdges  = Math.min(edges.length, MyPlane.MAX_PATH_EDGES);
    // Store all node UV positions so the scene can place objects on the path
    this.pathNodes = pts;
    return edges;
  }

  setFillMode() {
    this.primitiveType = this.scene.gl.TRIANGLE_STRIP;
  }

  setLineMode() {
    this.primitiveType = this.scene.gl.LINES;
  }
}
