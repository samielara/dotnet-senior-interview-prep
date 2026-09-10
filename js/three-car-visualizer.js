// ============================================================================
// INTERACTIVE 3D WEBGL CAR MENTAL MODEL VISUALIZER
// Built with Three.js & GSAP 3 (2026 Developer Aesthetic)
// Visualizes the 4 OOP Pillars mapped to automotive engineering anatomy
// ============================================================================

(function () {
  'use strict';

  const PILLAR_DATA = {
    abstraction: {
      title: 'Abstraction: Clean Driver Interface',
      carPart: 'Steering Wheel, Dashboard & Pedals',
      concept: 'Exposes simple, essential contracts (StartEngine(), Brake()) while hiding internal combustion details.',
      code: 'public interface ICar { void StartEngine(); void Brake(); }',
      cameraPos: { x: 0, y: 1.8, z: 2.2 },
      targetLook: { x: 0, y: 0.6, z: 0.2 },
      accent: '#38bdf8',
      partName: 'cockpit'
    },
    encapsulation: {
      title: 'Encapsulation: Protected Internal State',
      carPart: 'Engine Compartment Under The Hood',
      concept: 'Hides private state (_fuelAirRatio, _sparkTiming, _batteryVoltage) behind private fields and public accessors.',
      code: 'private decimal _fuelAirRatio; // Inaccessible outside class\npublic void Tune() { /* validated state */ }',
      cameraPos: { x: 1.8, y: 1.5, z: 2.5 },
      targetLook: { x: 0, y: 0.5, z: 1.5 },
      accent: '#6366f1',
      partName: 'engine'
    },
    inheritance: {
      title: 'Inheritance: Shared Vehicle Chassis',
      carPart: 'Base Chassis Platform & Structural Frame',
      concept: 'TeslaModel3 inherits common vehicle physics, steering geometry, and suspension from BaseVehicle.',
      code: 'public class TeslaModel3 : BaseVehicle { /* acquires WheelBase, VIN, Suspension */ }',
      cameraPos: { x: 3.5, y: 1.2, z: 0 },
      targetLook: { x: 0, y: 0.3, z: 0 },
      accent: '#10b981',
      partName: 'chassis'
    },
    polymorphism: {
      title: 'Polymorphism: Dynamic Powertrain Dispatch',
      carPart: 'High-Torque Dual Motor Powertrain',
      concept: 'Pressing the accelerator pedal invokes the same method signature Accelerate(), but the Electric Motor provides InstantTorque() while GasCar provides CombustionRev().',
      code: 'public override void Accelerate() => EngageInstantTorqueMotors();',
      cameraPos: { x: -2.2, y: 1.0, z: -2.0 },
      targetLook: { x: 0, y: 0.4, z: -1.0 },
      accent: '#f59e0b',
      partName: 'powertrain'
    }
  };

  const instances = new Map();

  class CarVisualizer3D {
    constructor(container) {
      this.container = container;
      this.activePillar = null;
      this.autoRotate = true;
      this.parts = {};
      this.animationFrameId = null;

      this.init();
    }

    init() {
      if (typeof THREE === 'undefined') {
        console.warn('[3D Visualizer] Three.js not loaded yet, retrying...');
        setTimeout(() => this.init(), 300);
        return;
      }

      this.setupDOM();
      this.setupThree();
      this.buildCyberpunkCar();
      this.setupEvents();
      this.animate();

      // Default focus on abstraction
      setTimeout(() => {
        this.selectPillar('abstraction');
      }, 500);
    }

    setupDOM() {
      this.container.innerHTML = `
        <div class="three-car-card">
          <div class="three-car-header">
            <div class="three-car-badge-wrap">
              <span class="three-car-badge">⚡ 3D INTERACTIVE MENTAL MODEL</span>
              <span class="three-car-sub">Drag / Touch to Rotate • Click Pillars to Inspect Anatomy</span>
            </div>
            <div class="three-car-actions">
              <button class="three-ctrl-btn" data-action="autorotate" title="Toggle Auto-Rotation">
                <span class="icon">🔄</span> Auto-Rotate
              </button>
              <button class="three-ctrl-btn" data-action="reset" title="Reset Camera View">
                <span class="icon">🎯</span> Reset
              </button>
            </div>
          </div>

          <div class="three-car-viewport-wrap">
            <div class="three-canvas-container"></div>
            
            <!-- Interactive 3D Pillar Navigation Bar -->
            <div class="three-pillar-nav">
              <button class="three-pillar-pill active" data-pillar="abstraction">
                <span class="dot" style="background:#38bdf8;"></span>
                <span class="pill-name">🎛️ Abstraction</span>
                <span class="pill-part">Dashboard &amp; Controls</span>
              </button>
              <button class="three-pillar-pill" data-pillar="encapsulation">
                <span class="dot" style="background:#6366f1;"></span>
                <span class="pill-name">🛡️ Encapsulation</span>
                <span class="pill-part">Engine Core</span>
              </button>
              <button class="three-pillar-pill" data-pillar="inheritance">
                <span class="dot" style="background:#10b981;"></span>
                <span class="pill-name">🧬 Inheritance</span>
                <span class="pill-part">Chassis Base</span>
              </button>
              <button class="three-pillar-pill" data-pillar="polymorphism">
                <span class="dot" style="background:#f59e0b;"></span>
                <span class="pill-name">⚡ Polymorphism</span>
                <span class="pill-part">Instant Torque Motor</span>
              </button>
            </div>
          </div>

          <!-- Active Concept Detail Callout HUD -->
          <div class="three-concept-hud" id="threeConceptHud">
            <div class="hud-top">
              <span class="hud-pillar-tag" id="hudPillarTag">Abstraction</span>
              <h4 class="hud-title" id="hudTitle">Abstraction: Clean Driver Interface</h4>
              <span class="hud-part-badge" id="hudPartBadge">📍 Steering Wheel &amp; Pedals</span>
            </div>
            <p class="hud-desc" id="hudDesc">
              Exposes simple, essential contracts (StartEngine(), Brake()) while hiding internal combustion details.
            </p>
            <div class="hud-code-wrap">
              <span class="hud-code-label">C# ARCHITECTURAL IMPLEMENTATION:</span>
              <pre class="hud-code" id="hudCode"><code>public interface ICar { void StartEngine(); void Brake(); }</code></pre>
            </div>
          </div>
        </div>
      `;

      this.canvasContainer = this.container.querySelector('.three-canvas-container');
      this.hudTag = this.container.querySelector('#hudPillarTag');
      this.hudTitle = this.container.querySelector('#hudTitle');
      this.hudPartBadge = this.container.querySelector('#hudPartBadge');
      this.hudDesc = this.container.querySelector('#hudDesc');
      this.hudCode = this.container.querySelector('#hudCode code');
    }

    setupThree() {
      const width = this.canvasContainer.clientWidth || 600;
      const height = Math.min(Math.max(width * 0.52, 280), 380);

      // Scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x070a12);
      this.scene.fog = new THREE.FogExp2(0x070a12, 0.12);

      // Camera
      this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
      this.camera.position.set(3.2, 2.2, 3.8);

      // Renderer
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.canvasContainer.appendChild(this.renderer.domElement);

      // Lights
      const ambientLight = new THREE.AmbientLight(0x1e293b, 1.8);
      this.scene.add(ambientLight);

      const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
      mainLight.position.set(5, 8, 5);
      mainLight.castShadow = true;
      this.scene.add(mainLight);

      const blueRim = new THREE.DirectionalLight(0x38bdf8, 2.5);
      blueRim.position.set(-5, 3, -4);
      this.scene.add(blueRim);

      const cyanUnder = new THREE.PointLight(0x06b6d4, 1.5, 6);
      cyanUnder.position.set(0, 0.1, 0);
      this.scene.add(cyanUnder);

      // Ground Reflection Grid
      const gridHelper = new THREE.GridHelper(16, 24, 0x38bdf8, 0x1e293b);
      gridHelper.position.y = -0.01;
      this.scene.add(gridHelper);

      // Orbit Controls if available, or custom drag
      if (typeof THREE.OrbitControls !== 'undefined') {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
        this.controls.minDistance = 2.0;
        this.controls.maxDistance = 7.0;
        this.controls.target.set(0, 0.5, 0);
      } else {
        this.setupTouchFallback();
      }
    }

    setupTouchFallback() {
      let isDragging = false;
      let prevMouseX = 0;

      const onPointerDown = (e) => {
        isDragging = true;
        prevMouseX = e.clientX || (e.touches && e.touches[0].clientX);
        this.autoRotate = false;
      };

      const onPointerMove = (e) => {
        if (!isDragging) return;
        const currentX = e.clientX || (e.touches && e.touches[0].clientX);
        const deltaX = (currentX - prevMouseX) * 0.006;
        if (this.carGroup) {
          this.carGroup.rotation.y += deltaX;
        }
        prevMouseX = currentX;
      };

      const onPointerUp = () => {
        isDragging = false;
      };

      const el = this.renderer.domElement;
      el.addEventListener('mousedown', onPointerDown);
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);

      el.addEventListener('touchstart', onPointerDown, { passive: true });
      window.addEventListener('touchmove', onPointerMove, { passive: true });
      window.addEventListener('touchend', onPointerUp);
    }

    buildCyberpunkCar() {
      this.carGroup = new THREE.Group();
      this.scene.add(this.carGroup);

      // Materials
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.85,
        roughness: 0.25
      });

      const chassisMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.9,
        roughness: 0.4
      });

      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x0284c7,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.8,
        transparent: true,
        opacity: 0.85
      });

      const engineGlowMat = new THREE.MeshStandardMaterial({
        color: 0x6366f1,
        emissive: 0x4f46e5,
        emissiveIntensity: 1.8,
        roughness: 0.2
      });

      const motorGlowMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 1.6,
        roughness: 0.3
      });

      const wheelMat = new THREE.MeshStandardMaterial({
        color: 0x090d16,
        roughness: 0.7
      });

      const rimMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        metalness: 0.9,
        roughness: 0.2
      });

      // 1. INHERITANCE: Base Chassis Platform
      const chassisGeo = new THREE.BoxGeometry(1.6, 0.18, 3.8);
      const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
      chassisMesh.position.y = 0.22;
      chassisMesh.castShadow = true;
      this.carGroup.add(chassisMesh);
      this.parts.chassis = chassisMesh;

      // 2. Main Aerodynamic Body
      const bodyGeo = new THREE.BoxGeometry(1.5, 0.45, 3.4);
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.set(0, 0.48, 0);
      bodyMesh.castShadow = true;
      this.carGroup.add(bodyMesh);

      // 3. Cabin & Windshield (ABSTRACTION: Steering & Dashboard inside)
      const cabinGeo = new THREE.BoxGeometry(1.25, 0.42, 1.6);
      const cabinMesh = new THREE.Mesh(cabinGeo, glassMat);
      cabinMesh.position.set(0, 0.85, -0.1);
      this.carGroup.add(cabinMesh);

      // Steering column & driver HUD inside cabin
      const steeringGeo = new THREE.TorusGeometry(0.14, 0.03, 8, 16);
      const steeringMesh = new THREE.Mesh(steeringGeo, new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7 }));
      steeringMesh.position.set(0.28, 0.82, 0.25);
      steeringMesh.rotation.x = Math.PI / 3;
      this.carGroup.add(steeringMesh);
      this.parts.cockpit = steeringMesh;

      // 4. ENCAPSULATION: Engine Bay Core under Hood
      const engineCoreGeo = new THREE.BoxGeometry(0.8, 0.32, 0.9);
      const engineCoreMesh = new THREE.Mesh(engineCoreGeo, engineGlowMat);
      engineCoreMesh.position.set(0, 0.52, 1.15);
      this.carGroup.add(engineCoreMesh);
      this.parts.engine = engineCoreMesh;

      // Hood Wireframe / Protective Casing
      const hoodGeo = new THREE.BoxGeometry(1.3, 0.1, 1.2);
      const hoodMesh = new THREE.Mesh(hoodGeo, new THREE.MeshStandardMaterial({
        color: 0x1e1b4b,
        wireframe: true
      }));
      hoodMesh.position.set(0, 0.72, 1.15);
      this.carGroup.add(hoodMesh);

      // 5. POLYMORPHISM: Dual High-Torque Electric Motor (Rear Axle)
      const motorGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.1, 16);
      const motorMesh = new THREE.Mesh(motorGeo, motorGlowMat);
      motorMesh.rotation.z = Math.PI / 2;
      motorMesh.position.set(0, 0.32, -1.25);
      this.carGroup.add(motorMesh);
      this.parts.powertrain = motorMesh;

      // 6. Wheels (4 corners)
      const wheelPositions = [
        [-0.85, 0.32, 1.15],
        [0.85, 0.32, 1.15],
        [-0.85, 0.32, -1.25],
        [0.85, 0.32, -1.25]
      ];

      this.wheels = [];
      wheelPositions.forEach(([x, y, z]) => {
        const wheelGroup = new THREE.Group();
        wheelGroup.position.set(x, y, z);

        const tireGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.22, 24);
        const tire = new THREE.Mesh(tireGeo, wheelMat);
        tire.rotation.z = Math.PI / 2;
        tire.castShadow = true;
        wheelGroup.add(tire);

        const rimGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.23, 12);
        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.rotation.z = Math.PI / 2;
        wheelGroup.add(rim);

        this.carGroup.add(wheelGroup);
        this.wheels.push(wheelGroup);
      });

      // Headlights
      const hlLeft = new THREE.PointLight(0x38bdf8, 2, 4);
      hlLeft.position.set(-0.5, 0.5, 1.8);
      this.carGroup.add(hlLeft);

      const hlRight = new THREE.PointLight(0x38bdf8, 2, 4);
      hlRight.position.set(0.5, 0.5, 1.8);
      this.carGroup.add(hlRight);

      // Taillights
      const tailGeo = new THREE.BoxGeometry(1.3, 0.06, 0.05);
      const tailMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const tailMesh = new THREE.Mesh(tailGeo, tailMat);
      tailMesh.position.set(0, 0.58, -1.72);
      this.carGroup.add(tailMesh);
    }

    setupEvents() {
      // Pillar Buttons
      const pills = this.container.querySelectorAll('.three-pillar-pill');
      pills.forEach(pill => {
        pill.addEventListener('click', () => {
          const pillarKey = pill.getAttribute('data-pillar');
          this.selectPillar(pillarKey);
        });
      });

      // Action Buttons
      const autoBtn = this.container.querySelector('[data-action="autorotate"]');
      if (autoBtn) {
        autoBtn.addEventListener('click', () => {
          this.autoRotate = !this.autoRotate;
          autoBtn.classList.toggle('active', this.autoRotate);
        });
      }

      const resetBtn = this.container.querySelector('[data-action="reset"]');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.resetCamera();
        });
      }

      // Responsive Resize
      window.addEventListener('resize', () => {
        if (!this.canvasContainer || !this.renderer || !this.camera) return;
        const width = this.canvasContainer.clientWidth;
        if (!width) return;
        const height = Math.min(Math.max(width * 0.52, 280), 380);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
      });
    }

    selectPillar(pillarKey) {
      const data = PILLAR_DATA[pillarKey];
      if (!data) return;

      this.activePillar = pillarKey;

      // Update Pill Nav Buttons
      this.container.querySelectorAll('.three-pillar-pill').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-pillar') === pillarKey);
      });

      // Update HUD Content
      if (this.hudTag) {
        this.hudTag.textContent = pillarKey.toUpperCase();
        this.hudTag.style.color = data.accent;
        this.hudTag.style.borderColor = data.accent;
      }
      if (this.hudTitle) this.hudTitle.textContent = data.title;
      if (this.hudPartBadge) this.hudPartBadge.textContent = '📍 ' + data.carPart;
      if (this.hudDesc) this.hudDesc.textContent = data.concept;
      if (this.hudCode) {
        this.hudCode.textContent = data.code;
        if (window.Prism) {
          Prism.highlightElement(this.hudCode);
        }
      }

      // Pulse the 3D part
      this.pulsePart(data.partName);

      // Smoothly Tween 3D Camera using GSAP
      if (typeof gsap !== 'undefined') {
        gsap.to(this.camera.position, {
          x: data.cameraPos.x,
          y: data.cameraPos.y,
          z: data.cameraPos.z,
          duration: 1.4,
          ease: 'power2.inOut'
        });

        if (this.controls) {
          gsap.to(this.controls.target, {
            x: data.targetLook.x,
            y: data.targetLook.y,
            z: data.targetLook.z,
            duration: 1.4,
            ease: 'power2.inOut'
          });
        }
      } else {
        this.camera.position.set(data.cameraPos.x, data.cameraPos.y, data.cameraPos.z);
        if (this.controls) {
          this.controls.target.set(data.targetLook.x, data.targetLook.y, data.targetLook.z);
        }
      }
    }

    pulsePart(partKey) {
      const mesh = this.parts[partKey];
      if (!mesh) return;

      if (typeof gsap !== 'undefined') {
        gsap.fromTo(mesh.scale, 
          { x: 1, y: 1, z: 1 }, 
          { x: 1.15, y: 1.15, z: 1.15, duration: 0.35, yoyo: true, repeat: 1, ease: 'power1.out' }
        );
      }
    }

    resetCamera() {
      if (typeof gsap !== 'undefined') {
        gsap.to(this.camera.position, {
          x: 3.2,
          y: 2.2,
          z: 3.8,
          duration: 1.2,
          ease: 'power2.inOut'
        });
        if (this.controls) {
          gsap.to(this.controls.target, {
            x: 0,
            y: 0.5,
            z: 0,
            duration: 1.2,
            ease: 'power2.inOut'
          });
        }
      } else {
        this.camera.position.set(3.2, 2.2, 3.8);
        if (this.controls) this.controls.target.set(0, 0.5, 0);
      }
      this.autoRotate = true;
    }

    animate() {
      this.animationFrameId = requestAnimationFrame(() => this.animate());

      if (this.controls) {
        this.controls.update();
      }

      if (this.autoRotate && this.carGroup && (!this.controls || !this.controls.state || this.controls.state === -1)) {
        this.carGroup.rotation.y += 0.005;
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }

    destroy() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }

  window.CarVisualizer3D = {
    attach: function (containerElement) {
      if (!containerElement) return null;
      const id = containerElement.id || ('car-viz-' + Math.random().toString(36).substring(2, 9));
      if (instances.has(id)) {
        return instances.get(id);
      }
      const instance = new CarVisualizer3D(containerElement);
      instances.set(id, instance);
      return instance;
    }
  };
})();
