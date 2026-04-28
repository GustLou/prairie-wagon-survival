# CLAUDE.md — CGRA Final Project Context

## Course
**Computação Gráfica / Computer Graphics** — L.EIC, 3rd year  
Faculdade de Engenharia da Universidade do Porto (FEUP)  
Academic year: 2025/2026

---

## Project Overview

This is the **final project** for the Computer Graphics course. The goal is to build a complete **3D interactive game** from scratch using **WebCGF** (a WebGL-based framework used throughout the semester's practical classes).

The theme is a **spring prairie landscape**, and the game is a **survival challenge**: keep the wagon driver alive for as long as possible. The score is the total survival time in seconds.

---

## Game Concept

- A **covered wagon (prairie schooner)** starts at a **barn** with an initial number of health points (HP).
- HP decreases over time. To survive, the player must collect **hay bales** scattered randomly across the prairie and deliver them to the barn.
- **Driving near a hay bale** picks it up (max 2 bales at a time).
- **Entering the circular drop zone** in front of the barn delivers bales and restores HP.
- **Rocks and obstacles** damage the wagon on collision (distance-based detection).
- The game ends when HP reaches zero.

### Reference HP values (tunable)
| Event | HP change |
|---|---|
| Wagon starting HP | ~100 |
| HP lost per second | ~1 |
| HP gained per hay bale delivered | ~50 |
| HP lost per obstacle collision | ~5–15 (random) |

---

## Scene Elements

### Environment
- **Sky**: Large inverted half-sphere with panoramic texture. Sun as directional light.
- **Terrain**: Subtle rolling hills via height maps.
- **Ground**: Soil texture with dirt patches and a wagon pathway.

### Scatter & Flora
- **Rocks**: Multiple textures + vertex perturbation for variation.
- **Flowers**: Parameter-based, randomised placement, colour, scale, and texture.
- **Grass**: Dense and dead patches; wind animation via vertex shader (advanced).

### Key Entities
- **Wagon (prairie schooner)**: Hierarchical model with cloth cover (half-length), wooden bed, front tongue, 4 wheels, and OBJ-imported horse(s). Wheels rotate with movement; front axle steers.
- **Barn**: Box body with wood-plank texture, half-prism roof with dark wood texture, texture-mapped windows and doors.
- **Hay bales**: Collectible objects, only visible when nearby; a vertically animated arrow shader pinpoints each one.

---

## Wagon Controls
| Key | Action |
|---|---|
| W | Accelerate forward |
| S | Reduce speed |
| A | Steer front wheels left |
| D | Steer front wheels right |
| P | Pick up hay bale |
| L | Drop hay bale |

The wagon moves **forward only** (no reverse).

---

## Technical Requirements

### Modelling
- Hierarchical scene graph with geometric transformations (T, R, S) composed per node.
- Unit primitives (cylinder, cube) scaled and positioned via model matrices.
- OBJ import for horse/mule model.

### Shaders (GLSL)
- **Grass wind shader**: vertex-based oscillation simulating wind.
- **Arrow shader**: animated vertical bounce to pinpoint hay bales.

### Interface (DAT.gui)
Display the following live values:
- Current HP
- Instantaneous damage from collisions
- Instantaneous HP restored from deliveries
- Total bales delivered
- Score (elapsed seconds)

### Animation
- All 4 wheels rotate proportionally to wagon speed.
- Front wheel axis rotates with steering direction.
- Arrow bounces vertically above each hay bale.

---

## Hierarchical Modelling Context

This project builds directly on **Section 3.6 – Hierarchical Modelling** from the course textbook (*Introdução à Computação Gráfica*). Key concepts:

- Complex objects are built by combining primitives in a **scene graph**.
- Each node accumulates transformations from its parent (e.g., M_forearm = M_arm · T(...) · Rz(...)).
- The wagon follows this pattern: body → wheels, tongue, cover — each with its own local transform composed onto the parent's world matrix.

**Procedural modelling** (from the `Modelação_procedimental` lectures) is used for:
- Terrain generation (height maps or noise-based).
- Flower/rock placement randomness.
- L-systems or fractal approaches for flora (advanced option).

---

## Deliverable Schedule
| Week | Task | Git Tag |
|---|---|---|
| 8 | Sky, sun, clouds | `environment` |
| 9 | Terrain, ground, scatter | `terrain` |
| 10 | Flowers and grass | `flora` |
| 11 | Wagon + interaction + animation | `interaction` |
| 12 | Collectible system + UI | `gameplay` |
| 12 (end) | README, video, screenshots | `final` |
| 13 | Presentation | — |

**Deadline**: 29 May 2026 (Friday), submitted via Moodle.

---

## Evaluation (20 points total)
| Criterion | Weight |
|---|---|
| Explicit & procedural modelling of entities | 4.0 |
| Lighting, materials, and textures | 4.0 |
| Overall scene & entity complexity | 3.0 |
| Animated entities | 3.0 |
| Advanced shader effects | 3.0 |
| Aesthetics & creativity | 2.0 |
| Software quality (structure, comments) | 1.0 |

---

## Repository & Delivery Conventions
- **ZIP naming**: `project-t<class>g<group>-N.zip`
- **Screenshot naming**: `project-t<class>g<group>-N.png` (5 × Full HD PNG)
- **Video**: `project-t<class>g<group>.mp4` — 1 minute, H.264, demonstrating full scene, controls, shaders, and hay bale mechanics.
- Include a `README.md` at repo root with: title, members, scene description, run instructions, key map, feature list, known issues, and AI use declaration.

---

## Notes for Claude / AI Assistance

When helping with this project, keep in mind:
- The framework is **WebCGF** (WebGL). All rendering is done via WebGL shaders; there is no Three.js or Babylon.js.
- All geometric transformations must be built from **matrix composition** (not shortcuts).
- The scene graph structure should mirror the hierarchical modelling taught in the course (parent → child transform accumulation).
- Collision detection is **distance-based** (no physics engine), using the distance between object centres vs. a threshold.
- Wagon movement is **kinematic** (basic: velocity via W/S keys); advanced option adds proper acceleration physics.
- Performance matters — this runs in a browser. Avoid unnecessary draw calls and prefer instancing for repeated elements (grass, rocks, flowers).
