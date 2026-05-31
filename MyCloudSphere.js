import {CGFobject} from './lib/CGF.js';

/**
 * MyCloudSphere
 * A hemisphere generated procedurally (not hardcoded).
 * Rendered from the inside — used as the cloud layer
 * sitting just inside the sky sphere.
 *
 * @param scene     - Reference to MyScene
 * @param radius    - Radius of the dome (match your sky sphere scale)
 * @param latBands  - Vertical subdivisions (more = smoother)
 * @param longBands - Horizontal subdivisions
 */
export class MyCloudSphere extends CGFobject {
    constructor(scene, radius = 0.97, latBands = 40, longBands = 60) {
        super(scene);
        this.radius   = radius;
        this.latBands = latBands;
        this.longBands = longBands;
        this.initBuffers();
    }

    initBuffers() {
        this.vertices  = [];
        this.normals   = [];
        this.texCoords = [];
        this.indices   = [];

        // Sweep phi from 0 (top) to PI/2 (equator) — hemisphere only.
        // A full sphere would go to PI.
        for (let lat = 0; lat <= this.latBands; lat++) {
            const phi    = (lat / this.latBands) * (Math.PI / 2);
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            for (let lon = 0; lon <= this.longBands; lon++) {
                const theta = (lon / this.longBands) * (2 * Math.PI);
                const x = Math.cos(theta) * sinPhi;
                const y = cosPhi;
                const z = Math.sin(theta) * sinPhi;

                this.vertices.push(
                    this.radius * x,
                    this.radius * y,
                    this.radius * z
                );

                // Inward-facing normals (viewed from inside the dome)
                this.normals.push(-x, -y, -z);

                // UV for the fragment shader (longitude → u, latitude → v)
                this.texCoords.push(
                    lon / this.longBands,
                    lat / this.latBands
                );
            }
        }

        for (let lat = 0; lat < this.latBands; lat++) {
            for (let lon = 0; lon < this.longBands; lon++) {
                const first  = lat * (this.longBands + 1) + lon;
                const second = first + this.longBands + 1;
                // Two triangles per quad, wound for inside view
                this.indices.push(second, first + 1, first);
                this.indices.push(second + 1, first + 1, second);
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}