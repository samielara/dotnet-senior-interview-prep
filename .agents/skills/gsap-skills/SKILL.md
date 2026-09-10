---
name: gsap-skills
description: Expert reference for GreenSock Animation Platform (GSAP 3) choreography, camera tweening, interactive timelines, SVG drawing, and 3D WebGL camera animations.
---

# GSAP Skills — Animation & 3D Choreography

## Overview
Guidelines for creating silky 60fps animations with GSAP 3:
- Tweening 3D object positions and camera coordinates in Three.js scenes.
- Staggered timeline choreographies for UI nodes and interactive mental models.
- Clean cleanup on destroy to avoid memory leaks.

## Key Three.js Tweening Pattern
```javascript
function focusOn3DTarget(camera, controls, targetPos, lookAtPos) {
  gsap.to(camera.position, {
    x: targetPos.x,
    y: targetPos.y,
    z: targetPos.z,
    duration: 1.2,
    ease: 'power2.inOut',
    onUpdate: () => controls.update()
  });
  gsap.to(controls.target, {
    x: lookAtPos.x,
    y: lookAtPos.y,
    z: lookAtPos.z,
    duration: 1.2,
    ease: 'power2.inOut'
  });
}
```
