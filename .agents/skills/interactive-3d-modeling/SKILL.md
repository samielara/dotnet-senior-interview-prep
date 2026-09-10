---
name: interactive-3d-modeling
description: Guide and patterns for creating high-performance, mobile-responsive interactive 3D WebGL visualizations using Three.js and GSAP for educational mental models, software architecture analogies, and interactive product anatomy.
---

# Interactive 3D WebGL Modeling Skill

## Overview
Build production-grade, interactive 3D WebGL experiences embedded into web applications to explain complex architectural mental models (e.g., OOP Pillars Car Analogy, ThreadPool workers, Memory Heap vs Stack, Distributed Microservices topologies).

## Core Principles

1. **Lightweight & Zero-Asset-Failure Architecture:**
   - Prefer procedural 3D geometries (Extrusion, Rounded Boxes, Cylinders, Torus, Grouped Meshes) with custom materials, neon emissive edges, and ambient lighting over heavy 20MB .glb files that fail on mobile or slow cellular connections.
   - Fallback gracefully if WebGL is unavailable on older devices.

2. **Touch-First Mobile & Responsive Viewport:**
   - Touch drag rotates the model smoothly in 3D orbit (OrbitControls or quaternion touch rotation).
   - Pinch or button controls for zoom.
   - Canvas height responsive (e.g., 260px on mobile phones, 360px on desktop) to preserve viewport flow without hijacking document scroll.

3. **Semantic 3D Hotspot System:**
   - Pin 3D beacon markers directly onto coordinates:
     - Encapsulation: Engine / Hood (Private state, hidden combustion)
     - Abstraction: Steering Wheel / Pedals (Public simple API)
     - Inheritance: Chassis / Frame (Base class derivation)
     - Polymorphism: Drivetrain / Motor (Dynamic implementation override)
   - Interactive hotspot clicking triggers GSAP camera tween to the target part with easing.

4. **Visual Aesthetics (2026 Developer Aesthetic):**
   - Dark graphite / obsidian materials (#111827, #0f172a) with metallic roughness.
   - Glowing neon accents (Cyan #38bdf8, Emerald #10b981, Indigo #6366f1, Amber #f59e0b).
   - Soft directional lights + ambient blue rim lighting for depth.
   - Ground grid reflection / shadow plane for spatial grounding.
