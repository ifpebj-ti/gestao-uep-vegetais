import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { CanteiroData, CANTEIROS_DATA } from '../data/horticulturaData';

export interface TerrariumMapRef {
  setCameraPreset: (preset: 'isometric' | 'topdown' | 'ground' | 'reset') => void;
  focusCanteiro: (canteiroId: string) => void;
  resetView: () => void;
}

export interface TerrariumMapProps {
  selectedCanteiroId: string | null;
  onSelectCanteiro: (canteiro: CanteiroData | null) => void;
  filterStatus?: string;
  searchQuery?: string;
  isTeacherView?: boolean;
}

export const TerrariumMap = forwardRef<TerrariumMapRef, TerrariumMapProps>(
  ({ selectedCanteiroId, onSelectCanteiro, filterStatus, searchQuery, isTeacherView }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const onSelectCanteiroRef = useRef(onSelectCanteiro);

    useEffect(() => {
      onSelectCanteiroRef.current = onSelectCanteiro;
    }, [onSelectCanteiro]);

    // Three.js internal references
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const interactiveMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
    const waterMeshRef = useRef<THREE.Mesh | null>(null);

    // Hover and Selection tracking refs
    const selectedGroupRef = useRef<THREE.Group | null>(null);
    const hoveredGroupRef = useRef<THREE.Group | null>(null);

    // Hover tooltip state
    const [hoveredCanteiro, setHoveredCanteiro] = useState<CanteiroData | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; visible: boolean }>({
      x: 0,
      y: 0,
      visible: false,
    });

    // Initial camera configurations
    const DEFAULT_CAM_POS = new THREE.Vector3(14, 25, 26);
    const DEFAULT_CAM_TARGET = new THREE.Vector3(2.5, 0, 3.5);

    // Expose methods to parent component (MapaPage)
    useImperativeHandle(ref, () => ({
      setCameraPreset(preset: 'isometric' | 'topdown' | 'ground' | 'reset') {
        if (!cameraRef.current || !controlsRef.current) return;
        const camera = cameraRef.current;
        const controls = controlsRef.current;

        let targetPos = DEFAULT_CAM_POS.clone();
        let targetLookAt = DEFAULT_CAM_TARGET.clone();

        if (preset === 'topdown') {
          // Exactly like the 2D architectural blueprint from Figma
          targetPos = new THREE.Vector3(2.5, 48, 3.5);
          targetLookAt = new THREE.Vector3(2.5, 0, 3.5);
        } else if (preset === 'ground') {
          // Eye-level aisle walking perspective
          targetPos = new THREE.Vector3(2.5, 2.2, -18);
          targetLookAt = new THREE.Vector3(2.5, 1.2, 5);
        } else if (preset === 'isometric') {
          targetPos = new THREE.Vector3(16, 26, 28);
          targetLookAt = new THREE.Vector3(2.5, 0, 3.5);
        }

        gsap.to(camera.position, {
          x: targetPos.x,
          y: targetPos.y,
          z: targetPos.z,
          duration: 1.4,
          ease: 'power3.inOut',
        });

        gsap.to(controls.target, {
          x: targetLookAt.x,
          y: targetLookAt.y,
          z: targetLookAt.z,
          duration: 1.4,
          ease: 'power3.inOut',
          onUpdate: () => controls.update(),
        });
      },

      focusCanteiro(canteiroId: string) {
        const item = CANTEIROS_DATA.find((c) => c.id === canteiroId);
        if (!item || !cameraRef.current || !controlsRef.current) return;

        const posX = item.posicao.x;
        const posZ = item.posicao.z;

        const camera = cameraRef.current;
        const controls = controlsRef.current;

        gsap.to(controls.target, {
          x: posX,
          y: 0.6,
          z: posZ,
          duration: 1.2,
          ease: 'power2.inOut',
          onUpdate: () => controls.update(),
        });

        gsap.to(camera.position, {
          x: posX + 6,
          y: 6.5,
          z: posZ + 7,
          duration: 1.2,
          ease: 'power2.inOut',
        });

        const targetGroup = interactiveMeshesRef.current.get(canteiroId);
        if (targetGroup) {
          if (selectedGroupRef.current && selectedGroupRef.current !== targetGroup) {
            applyVisualState(selectedGroupRef.current, 'normal');
          }
          applyVisualState(targetGroup, 'selected');
          selectedGroupRef.current = targetGroup;
        }

        onSelectCanteiroRef.current?.(item);
      },

      resetView() {
        if (!cameraRef.current || !controlsRef.current) return;
        const camera = cameraRef.current;
        const controls = controlsRef.current;

        gsap.to(camera.position, {
          x: DEFAULT_CAM_POS.x,
          y: DEFAULT_CAM_POS.y,
          z: DEFAULT_CAM_POS.z,
          duration: 1.2,
          ease: 'power2.inOut',
        });

        gsap.to(controls.target, {
          x: DEFAULT_CAM_TARGET.x,
          y: DEFAULT_CAM_TARGET.y,
          z: DEFAULT_CAM_TARGET.z,
          duration: 1.2,
          ease: 'power2.inOut',
          onUpdate: () => controls.update(),
        });

        if (selectedGroupRef.current) {
          applyVisualState(selectedGroupRef.current, 'normal');
          selectedGroupRef.current = null;
        }
      },
    }));

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      // 1. SCENE
      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#eef3e9');
      scene.fog = new THREE.FogExp2('#eef3e9', 0.009);
      sceneRef.current = scene;

      // 2. CAMERA
      const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 300);
      camera.position.copy(DEFAULT_CAM_POS);
      cameraRef.current = camera;

      // 3. RENDERER
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
      renderer.domElement.style.cursor = 'grab';
      rendererRef.current = renderer;

      // 4. CONTROLS
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI / 2.08;
      controls.minDistance = 6;
      controls.maxDistance = 75;
      controls.target.copy(DEFAULT_CAM_TARGET);
      controls.update();
      controlsRef.current = controls;

      // 5. LIGHTING
      const ambientLight = new THREE.AmbientLight('#ffffff', 0.85);
      scene.add(ambientLight);

      const hemiLight = new THREE.HemisphereLight('#f1f8e9', '#8d6e63', 0.65);
      hemiLight.position.set(0, 50, 0);
      scene.add(hemiLight);

      const sunLight = new THREE.DirectionalLight('#fff8e7', 1.7);
      sunLight.position.set(30, 45, 25);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 120;
      sunLight.shadow.bias = -0.0003;
      const d = 32;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      scene.add(sunLight);

      const fillLight = new THREE.DirectionalLight('#c8e6c9', 0.5);
      fillLight.position.set(-25, 20, -20);
      scene.add(fillLight);

      // 6. ENVIRONMENT & GROUND
      buildEnvironment(scene);

      // 7. BUILD ALL HORTICULTURE SECTORS & CANTEIROS
      interactiveMeshesRef.current.clear();
      buildHorticultureSectors(scene, interactiveMeshesRef.current, (waterMesh) => {
        waterMeshRef.current = waterMesh;
      });

      // 8. RAYCASTING & INTERACTION
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const handlePointerMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        const interactiveGroups = Array.from(interactiveMeshesRef.current.values());
        const intersects = raycaster.intersectObjects(interactiveGroups, true);

        if (intersects.length > 0) {
          let currentObj: THREE.Object3D | null = intersects[0].object;
          let foundCanteiroId: string | null = null;
          let rootGroup: THREE.Group | null = null;

          while (currentObj && currentObj !== scene) {
            if (currentObj.userData && currentObj.userData.canteiroId) {
              foundCanteiroId = currentObj.userData.canteiroId;
              rootGroup = currentObj as THREE.Group;
              break;
            }
            currentObj = currentObj.parent;
          }

          if (foundCanteiroId && rootGroup) {
            const canteiro = CANTEIROS_DATA.find((c) => c.id === foundCanteiroId);
            if (canteiro) {
              setHoveredCanteiro(canteiro);
              setTooltipPos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                visible: true,
              });
              container.style.cursor = 'pointer';
              renderer.domElement.style.cursor = 'pointer';

              // If hovering on a different canteiro group
              if (hoveredGroupRef.current !== rootGroup) {
                // If previous hovered group is NOT selected, reset it to normal
                if (hoveredGroupRef.current && hoveredGroupRef.current !== selectedGroupRef.current) {
                  applyVisualState(hoveredGroupRef.current, 'normal');
                }

                // If new rootGroup is NOT the selected one, apply hover green
                if (rootGroup !== selectedGroupRef.current) {
                  applyVisualState(rootGroup, 'hover');
                }

                hoveredGroupRef.current = rootGroup;
              }
              return;
            }
          }
        }

        // Mouse is not over any canteiro
        if (hoveredGroupRef.current) {
          // If the group that was hovered is NOT the selected one, reset to normal
          if (hoveredGroupRef.current !== selectedGroupRef.current) {
            applyVisualState(hoveredGroupRef.current, 'normal');
          }
          hoveredGroupRef.current = null;
        }

        setHoveredCanteiro(null);
        setTooltipPos((prev) => ({ ...prev, visible: false }));
        container.style.cursor = 'grab';
        renderer.domElement.style.cursor = 'grab';
      };

      const handlePointerDown = () => {
        container.style.cursor = 'grabbing';
        renderer.domElement.style.cursor = 'grabbing';
      };

      const handlePointerUp = () => {
        const nextCursor = hoveredGroupRef.current ? 'pointer' : 'grab';
        container.style.cursor = nextCursor;
        renderer.domElement.style.cursor = nextCursor;
      };

      const handleClick = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const interactiveGroups = Array.from(interactiveMeshesRef.current.values());
        const intersects = raycaster.intersectObjects(interactiveGroups, true);

        if (intersects.length > 0) {
          let currentObj: THREE.Object3D | null = intersects[0].object;
          let foundCanteiroId: string | null = null;
          let clickedGroup: THREE.Group | null = null;

          while (currentObj && currentObj !== scene) {
            if (currentObj.userData && currentObj.userData.canteiroId) {
              foundCanteiroId = currentObj.userData.canteiroId;
              clickedGroup = currentObj as THREE.Group;
              break;
            }
            currentObj = currentObj.parent;
          }

          if (foundCanteiroId && clickedGroup) {
            const canteiro = CANTEIROS_DATA.find((c) => c.id === foundCanteiroId);
            if (canteiro) {
              // Smooth camera transition to the clicked canteiro
              const posX = canteiro.posicao.x;
              const posZ = canteiro.posicao.z;

              gsap.to(controls.target, {
                x: posX,
                y: 0.6,
                z: posZ,
                duration: 1.0,
                ease: 'power2.inOut',
                onUpdate: () => controls.update(),
              });

              gsap.to(camera.position, {
                x: posX + 5.5,
                y: 5.5,
                z: posZ + 6.5,
                duration: 1.0,
                ease: 'power2.inOut',
              });

              // Unselect previously selected canteiro
              if (selectedGroupRef.current && selectedGroupRef.current !== clickedGroup) {
                applyVisualState(selectedGroupRef.current, 'normal');
              }

              // Apply selected green state ONLY to clicked canteiro
              applyVisualState(clickedGroup, 'selected');
              selectedGroupRef.current = clickedGroup;

              onSelectCanteiroRef.current?.(canteiro);
            }
          }
        }
      };

      container.addEventListener('mousemove', handlePointerMove);
      container.addEventListener('mousedown', handlePointerDown);
      container.addEventListener('mouseup', handlePointerUp);
      container.addEventListener('click', handleClick);

      // 9. ANIMATION LOOP
      let clock = new THREE.Clock();
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // Animate water reservoir shimmer
        if (waterMeshRef.current && (waterMeshRef.current.material as THREE.MeshStandardMaterial)) {
          const mat = waterMeshRef.current.material as THREE.MeshStandardMaterial;
          mat.roughness = 0.15 + Math.sin(elapsedTime * 2.2) * 0.05;
          waterMeshRef.current.position.y = 0.55 + Math.sin(elapsedTime * 1.8) * 0.02;
        }

        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // 10. RESIZE LISTENER
      const handleResize = () => {
        if (!container || !renderer || !camera) return;
        const newW = container.clientWidth;
        const newH = container.clientHeight;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      };
      window.addEventListener('resize', handleResize);

      // CLEANUP
      return () => {
        window.removeEventListener('resize', handleResize);
        container.removeEventListener('mousemove', handlePointerMove);
        container.removeEventListener('mousedown', handlePointerDown);
        container.removeEventListener('mouseup', handlePointerUp);
        container.removeEventListener('click', handleClick);

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        controls.dispose();
        renderer.dispose();
        scene.clear();
      };
    }, []);

    // Synchronize selected canteiro from prop
    useEffect(() => {
      const targetGroup = selectedCanteiroId
        ? interactiveMeshesRef.current.get(selectedCanteiroId) || null
        : null;

      if (selectedGroupRef.current && selectedGroupRef.current !== targetGroup) {
        if (selectedGroupRef.current !== hoveredGroupRef.current) {
          applyVisualState(selectedGroupRef.current, 'normal');
        } else {
          applyVisualState(selectedGroupRef.current, 'hover');
        }
      }

      if (targetGroup) {
        applyVisualState(targetGroup, 'selected');
      }
      selectedGroupRef.current = targetGroup;
    }, [selectedCanteiroId]);

    // Filter/Search visual effects
    useEffect(() => {
      interactiveMeshesRef.current.forEach((group, id) => {
        const canteiro = CANTEIROS_DATA.find((c) => c.id === id);
        if (!canteiro) return;

        let visible = true;
        if (filterStatus && filterStatus !== 'todos') {
          if (canteiro.status !== filterStatus && canteiro.tipo !== filterStatus) {
            visible = false;
          }
        }

        if (searchQuery && searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase().trim();
          const match =
            canteiro.nome.toLowerCase().includes(query) ||
            canteiro.codigo.toLowerCase().includes(query) ||
            canteiro.cultura.toLowerCase().includes(query) ||
            canteiro.setor.toLowerCase().includes(query);
          if (!match) visible = false;
        }

        // Animate opacity/scale based on filter
        gsap.to(group.scale, {
          x: visible ? 1 : 0.82,
          y: visible ? 1 : 0.4,
          z: visible ? 1 : 0.82,
          duration: 0.35,
          ease: 'power2.out',
        });

        group.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const mat = child.material as THREE.MeshStandardMaterial;
            if (mat.transparent !== undefined) {
              mat.transparent = true;
              gsap.to(mat, {
                opacity: visible ? 1 : 0.25,
                duration: 0.35,
              });
            }
          }
        });
      });
    }, [filterStatus, searchQuery]);

    return (
      <div className="relative w-full h-full overflow-hidden select-none">
        {/* Three.js canvas container */}
        <div ref={containerRef} className="w-full h-full cursor-grab" />

        {/* Dynamic 3D Follow Tooltip */}
        {tooltipPos.visible && hoveredCanteiro && (
          <div
            ref={tooltipRef}
            style={{
              left: `${tooltipPos.x + 16}px`,
              top: `${tooltipPos.y + 16}px`,
              transform: 'translate(0, 0)',
            }}
            className="pointer-events-none absolute z-40 rounded-2xl border border-emerald-900/15 bg-white/95 px-3.5 py-2.5 shadow-2xl backdrop-blur-md transition-all duration-75 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#27633b] text-xs font-bold text-white shadow-sm shrink-0">
                {hoveredCanteiro.codigo}
              </span>
              <div className="pr-1">
                <h4 className="text-sm font-bold text-slate-900 leading-tight">
                  {hoveredCanteiro.nome}
                </h4>
                <p className="text-xs font-semibold text-emerald-800 leading-tight mt-0.5">
                  {hoveredCanteiro.cultura}
                </p>
              </div>
              <span
                style={{ backgroundColor: `${hoveredCanteiro.statusColor}18`, color: hoveredCanteiro.statusColor }}
                className="rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide whitespace-nowrap ml-1"
              >
                {hoveredCanteiro.statusLabel}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

TerrariumMap.displayName = 'TerrariumMap';

// ==========================================
// PRECISE VISUAL STATE HANDLER
// ONLY the selected or hovered canteiro changes!
// ==========================================

function applyVisualState(group: THREE.Group, state: 'normal' | 'hover' | 'selected') {
  const borderMat = group.userData.borderMat as THREE.MeshStandardMaterial | undefined;
  const ringMesh = group.userData.ringMesh as THREE.Mesh | undefined;
  const originalColorHex = (group.userData.originalColorHex as string) || '#654321';

  if (state === 'normal') {
    gsap.to(group.position, { y: 0, duration: 0.25, ease: 'power2.out' });
    if (borderMat) {
      borderMat.color.set(originalColorHex);
      borderMat.emissive.set(0x000000);
      borderMat.emissiveIntensity = 0;
    }
    if (ringMesh) {
      ringMesh.visible = false;
    }
  } else if (state === 'hover') {
    // Only hovered canteiro changes to a lively natural green
    gsap.to(group.position, { y: 0.15, duration: 0.2, ease: 'power2.out' });
    if (borderMat) {
      borderMat.color.set('#2e7d32');
      borderMat.emissive.set('#4caf50');
      borderMat.emissiveIntensity = 0.35;
    }
    if (ringMesh) {
      ringMesh.visible = true;
      const rMat = ringMesh.material as THREE.MeshStandardMaterial;
      rMat.color.set('#4caf50');
      rMat.emissive.set('#4caf50');
      rMat.emissiveIntensity = 0.6;
    }
  } else if (state === 'selected') {
    // Only the clicked/selected canteiro stays highlighted in rich emerald green
    gsap.to(group.position, { y: 0.25, duration: 0.25, ease: 'power2.out' });
    if (borderMat) {
      borderMat.color.set('#1b5e20');
      borderMat.emissive.set('#22c55e');
      borderMat.emissiveIntensity = 0.65;
    }
    if (ringMesh) {
      ringMesh.visible = true;
      const rMat = ringMesh.material as THREE.MeshStandardMaterial;
      rMat.color.set('#22c55e');
      rMat.emissive.set('#22c55e');
      rMat.emissiveIntensity = 0.95;
    }
  }
}

// ==========================================
// 3D SCENE CONSTRUCTION HELPERS
// ==========================================

function buildEnvironment(scene: THREE.Scene) {
  // Main Ground Terrain (Agroecological field)
  const terrainGeo = new THREE.PlaneGeometry(80, 95, 32, 32);
  const terrainMat = new THREE.MeshStandardMaterial({
    color: '#e4ecdc',
    roughness: 0.92,
    metalness: 0.05,
  });
  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.set(0, -0.05, 5);
  terrain.receiveShadow = true;
  scene.add(terrain);

  // Pathways / Caminhos de terra batida e circulação entre os setores
  const pathMat = new THREE.MeshStandardMaterial({
    color: '#d6cbb3',
    roughness: 0.95,
    metalness: 0.02,
  });

  // Main central road between columns (corredor central)
  const centralAisle = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 42), pathMat);
  centralAisle.rotation.x = -Math.PI / 2;
  centralAisle.position.set(8.5, 0.005, 0);
  centralAisle.receiveShadow = true;
  scene.add(centralAisle);

  // Crossway towards composteira and water tank
  const westCrossway = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.4), pathMat);
  westCrossway.rotation.x = -Math.PI / 2;
  westCrossway.position.set(-1.5, 0.005, 0);
  westCrossway.receiveShadow = true;
  scene.add(westCrossway);

  // Road in front of composteira
  const compostRoad = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 38), pathMat);
  compostRoad.rotation.x = -Math.PI / 2;
  compostRoad.position.set(-4.5, 0.005, 2);
  compostRoad.receiveShadow = true;
  scene.add(compostRoad);

  // Decorative agroecological perimeter fence posts
  const postGeo = new THREE.CylinderGeometry(0.08, 0.09, 1.4, 6);
  const postMat = new THREE.MeshStandardMaterial({ color: '#5c4033', roughness: 0.9 });
  const fenceGroup = new THREE.Group();

  for (let z = -24; z <= 36; z += 4) {
    const postEast = new THREE.Mesh(postGeo, postMat);
    postEast.position.set(18, 0.7, z);
    postEast.castShadow = true;
    fenceGroup.add(postEast);

    const postWest = new THREE.Mesh(postGeo, postMat);
    postWest.position.set(-14, 0.7, z);
    postWest.castShadow = true;
    fenceGroup.add(postWest);
  }

  for (let x = -14; x <= 18; x += 4) {
    const postNorth = new THREE.Mesh(postGeo, postMat);
    postNorth.position.set(x, 0.7, -24);
    postNorth.castShadow = true;
    fenceGroup.add(postNorth);

    const postSouth = new THREE.Mesh(postGeo, postMat);
    postSouth.position.set(x, 0.7, 36);
    postSouth.castShadow = true;
    fenceGroup.add(postSouth);
  }
  scene.add(fenceGroup);

  // Trees and windbreak shrubs along borders (representing IFPE campus greenery)
  createPerimeterFlora(scene);
}

function createPerimeterFlora(scene: THREE.Scene) {
  const treeTrunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 3.2, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#4a3525', roughness: 0.9 });
  const canopyMat = new THREE.MeshStandardMaterial({ color: '#2d6a4f', roughness: 0.85, flatShading: true });
  const ipêMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.85, flatShading: true });

  const treePositions = [
    { x: -16, z: -20, isIpe: false },
    { x: -16, z: -10, isIpe: true },
    { x: -16, z: 2, isIpe: false },
    { x: -16, z: 14, isIpe: false },
    { x: -16, z: 28, isIpe: true },
    { x: 20, z: -20, isIpe: false },
    { x: 21, z: -8, isIpe: false },
    { x: 21, z: 6, isIpe: true },
    { x: 21, z: 18, isIpe: false },
    { x: 20, z: 30, isIpe: false },
    { x: -8, z: -26, isIpe: false },
    { x: 4, z: -26, isIpe: true },
    { x: 12, z: -26, isIpe: false },
    { x: 0, z: 38, isIpe: false },
    { x: 10, z: 38, isIpe: false },
  ];

  treePositions.forEach((pos, idx) => {
    const treeGroup = new THREE.Group();
    const trunk = new THREE.Mesh(treeTrunkGeo, trunkMat);
    trunk.position.y = 1.6;
    trunk.castShadow = true;
    treeGroup.add(trunk);

    const canopy = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.8 + (idx % 3) * 0.3, 1),
      pos.isIpe ? ipêMat : canopyMat
    );
    canopy.position.y = 3.6;
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    treeGroup.add(canopy);

    treeGroup.position.set(pos.x, 0, pos.z);
    scene.add(treeGroup);
  });
}

function buildHorticultureSectors(
  scene: THREE.Scene,
  interactiveMap: Map<string, THREE.Group>,
  onWaterCreated: (waterMesh: THREE.Mesh) => void
) {
  CANTEIROS_DATA.forEach((canteiro) => {
    const group = new THREE.Group();
    group.userData = { canteiroId: canteiro.id };

    if (canteiro.tipo === 'hortalica') {
      createStandardCanteiro(group, canteiro);
    } else if (canteiro.tipo === 'medicinal') {
      createMedicinalBed(group, canteiro);
    } else if (canteiro.tipo === 'composteira') {
      createComposteraSector(group, canteiro);
    } else if (canteiro.tipo === 'agua') {
      createWaterReservoirSector(group, canteiro, onWaterCreated);
    } else if (canteiro.tipo === 'minhocario') {
      createMinhocarioSector(group, canteiro);
    } else if (canteiro.tipo === 'recepcao') {
      createReceptionSector(group, canteiro);
    }

    group.position.set(canteiro.posicao.x, 0, canteiro.posicao.z);
    if (canteiro.posicao.rotacao) {
      group.rotation.y = canteiro.posicao.rotacao;
    }

    scene.add(group);
    interactiveMap.set(canteiro.id, group);
  });
}

// 1. STANDARD ELEVATED CANTEIRO (C01 to C24)
// Each canteiro receives its OWN independent materials so changing one does not affect others!
function createStandardCanteiro(group: THREE.Group, data: CanteiroData) {
  const { largura, comprimento } = data.posicao;
  const height = 0.45;
  const wallThick = 0.14;

  // Individual wood material for THIS canteiro
  const woodMat = new THREE.MeshStandardMaterial({
    color: '#654321',
    roughness: 0.88,
    metalness: 0.05,
  });
  group.userData.borderMat = woodMat;
  group.userData.originalColorHex = '#654321';

  // Individual soil material for THIS canteiro (remains nutrient-rich dark loam)
  const soilMat = new THREE.MeshStandardMaterial({
    color: '#2a1d15',
    roughness: 0.96,
    metalness: 0.02,
  });
  group.userData.soilMat = soilMat;

  // Outer wooden frame box with hollow center
  // Left border
  const borderZ1 = new THREE.Mesh(new THREE.BoxGeometry(largura, height, wallThick), woodMat);
  borderZ1.position.set(0, height / 2, -comprimento / 2 + wallThick / 2);
  borderZ1.castShadow = true;
  borderZ1.receiveShadow = true;
  group.add(borderZ1);

  // Right border
  const borderZ2 = new THREE.Mesh(new THREE.BoxGeometry(largura, height, wallThick), woodMat);
  borderZ2.position.set(0, height / 2, comprimento / 2 - wallThick / 2);
  borderZ2.castShadow = true;
  borderZ2.receiveShadow = true;
  group.add(borderZ2);

  // Top border
  const borderX1 = new THREE.Mesh(new THREE.BoxGeometry(wallThick, height, comprimento), woodMat);
  borderX1.position.set(-largura / 2 + wallThick / 2, height / 2, 0);
  borderX1.castShadow = true;
  borderX1.receiveShadow = true;
  group.add(borderX1);

  // Bottom border
  const borderX2 = new THREE.Mesh(new THREE.BoxGeometry(wallThick, height, comprimento), woodMat);
  borderX2.position.set(largura / 2 - wallThick / 2, height / 2, 0);
  borderX2.castShadow = true;
  borderX2.receiveShadow = true;
  group.add(borderX2);

  // Soil interior (raised fertile dark soil)
  const soil = new THREE.Mesh(
    new THREE.BoxGeometry(largura - wallThick * 1.5, height - 0.08, comprimento - wallThick * 1.5),
    soilMat
  );
  soil.position.set(0, (height - 0.08) / 2, 0);
  soil.receiveShadow = true;
  group.add(soil);

  // Selection / Highlight accent ring on top edge
  const ringGeo = new THREE.BoxGeometry(largura + 0.06, 0.06, comprimento + 0.06);
  const ringMat = new THREE.MeshStandardMaterial({
    color: '#22c55e',
    emissive: '#22c55e',
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.85,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.set(0, height + 0.03, 0);
  ring.visible = false;
  group.add(ring);
  group.userData.ringMesh = ring;

  // 3D Procedural Plants planted in orderly agronomic rows
  populateCropsInBed(group, data, largura - 0.4, comprimento - 0.4, height - 0.04);

  // Physical identification plaque with code (e.g. C01, C02)
  createSignpost(group, data.codigo, -largura / 2 + 0.3, -comprimento / 2 - 0.25);
}

// 2. MEDICINAL & AROMATIC BEDS
function createMedicinalBed(group: THREE.Group, data: CanteiroData) {
  const { largura, comprimento } = data.posicao;
  const height = 0.4;

  const woodMat = new THREE.MeshStandardMaterial({
    color: '#5c4033',
    roughness: 0.88,
    metalness: 0.05,
  });
  group.userData.borderMat = woodMat;
  group.userData.originalColorHex = '#5c4033';

  const soilMat = new THREE.MeshStandardMaterial({
    color: '#2a1d15',
    roughness: 0.96,
    metalness: 0.02,
  });
  group.userData.soilMat = soilMat;

  // Raised stone/wood curb
  const border = new THREE.Mesh(new THREE.BoxGeometry(largura, height, comprimento), woodMat);
  border.position.set(0, height / 2, 0);
  border.castShadow = true;
  border.receiveShadow = true;
  group.add(border);

  // Top soil layer
  const soil = new THREE.Mesh(
    new THREE.BoxGeometry(largura - 0.25, height + 0.02, comprimento - 0.25),
    soilMat
  );
  soil.position.set(0, (height + 0.02) / 2, 0);
  soil.receiveShadow = true;
  group.add(soil);

  // Selection / Highlight accent ring on top edge
  const ringGeo = new THREE.BoxGeometry(largura + 0.06, 0.06, comprimento + 0.06);
  const ringMat = new THREE.MeshStandardMaterial({
    color: '#22c55e',
    emissive: '#22c55e',
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.85,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.set(0, height + 0.03, 0);
  ring.visible = false;
  group.add(ring);
  group.userData.ringMesh = ring;

  // Aromatic herbal bushes
  const herbColors = ['#15803d', '#166534', '#3f6212', '#4d7c0f', '#047857'];
  const numClusters = Math.floor(largura * 1.8);

  for (let i = 0; i < numClusters; i++) {
    const px = -largura / 2 + 0.7 + Math.random() * (largura - 1.4);
    const pz = -comprimento / 2 + 0.4 + Math.random() * (comprimento - 0.8);
    const scale = 0.3 + Math.random() * 0.25;

    const herbMat = new THREE.MeshStandardMaterial({
      color: herbColors[i % herbColors.length],
      roughness: 0.85,
      flatShading: true,
    });

    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 1), herbMat);
    bush.position.set(px, height + scale * 0.7, pz);
    bush.castShadow = true;
    bush.receiveShadow = true;
    group.add(bush);

    // Subtle purple or yellow flowers on herbs
    if (i % 3 === 0) {
      const flowerMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? '#c084fc' : '#fde047',
        roughness: 0.6,
      });
      const flower = new THREE.Mesh(new THREE.SphereGeometry(scale * 0.3, 6, 6), flowerMat);
      flower.position.set(px, height + scale * 1.4, pz);
      group.add(flower);
    }
  }

  createSignpost(group, data.codigo, -largura / 2 + 0.4, -comprimento / 2 - 0.3);
}

// 3. COMPOSTEIRA SECTOR (4 Baias de compostagem com biomassa)
function createComposteraSector(group: THREE.Group, data: CanteiroData) {
  const { largura, comprimento } = data.posicao;
  const numBaias = 4;
  const baiaLen = comprimento / numBaias;
  const slatMat = new THREE.MeshStandardMaterial({ color: '#582f0e', roughness: 0.9 });
  group.userData.borderMat = slatMat;
  group.userData.originalColorHex = '#582f0e';

  const compostMatActive = new THREE.MeshStandardMaterial({ color: '#3d2612', roughness: 0.95 });
  const compostMatStraw = new THREE.MeshStandardMaterial({ color: '#b08968', roughness: 0.9 });

  for (let b = 0; b < numBaias; b++) {
    const bz = -comprimento / 2 + (b + 0.5) * baiaLen;

    const divider = new THREE.Mesh(new THREE.BoxGeometry(largura, 1.2, 0.1), slatMat);
    divider.position.set(0, 0.6, bz - baiaLen / 2);
    divider.castShadow = true;
    group.add(divider);

    const moundMat = b === 1 ? compostMatActive : compostMatStraw;
    const mound = new THREE.Mesh(
      new THREE.CylinderGeometry(largura * 0.35, largura * 0.44, 0.9 - b * 0.1, 8),
      moundMat
    );
    mound.rotation.x = Math.PI / 2;
    mound.rotation.z = Math.PI / 2;
    mound.position.set(0, 0.4, bz);
    mound.castShadow = true;
    mound.receiveShadow = true;
    group.add(mound);
  }

  const endDivider = new THREE.Mesh(new THREE.BoxGeometry(largura, 1.2, 0.1), slatMat);
  endDivider.position.set(0, 0.6, comprimento / 2);
  endDivider.castShadow = true;
  group.add(endDivider);

  const probePole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 1.6, 6),
    new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.8 })
  );
  probePole.position.set(0.6, 1.2, -comprimento / 4);
  probePole.castShadow = true;
  group.add(probePole);

  const probeHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.18, 0.18),
    new THREE.MeshStandardMaterial({ color: '#ef4444' })
  );
  probeHead.position.set(0.6, 1.95, -comprimento / 4);
  group.add(probeHead);

  createSignpost(group, 'COMPOSTEIRA', -largura / 2 - 0.4, -comprimento / 2);
}

// 4. WATER RESERVOIR & IRRIGATION HUB
function createWaterReservoirSector(
  group: THREE.Group,
  data: CanteiroData,
  onWaterCreated: (m: THREE.Mesh) => void
) {
  const { largura, comprimento } = data.posicao;

  const tankMat = new THREE.MeshStandardMaterial({
    color: '#cbd5e1',
    roughness: 0.6,
    metalness: 0.35,
    side: THREE.DoubleSide,
  });
  group.userData.borderMat = tankMat;
  group.userData.originalColorHex = '#cbd5e1';

  const tankGeo = new THREE.CylinderGeometry(largura / 2, largura / 2, 1.1, 24, 1, true);
  const tankWall = new THREE.Mesh(tankGeo, tankMat);
  tankWall.position.y = 0.55;
  tankWall.castShadow = true;
  tankWall.receiveShadow = true;
  group.add(tankWall);

  const floorGeo = new THREE.CircleGeometry(largura / 2 - 0.05, 24);
  const floorMat = new THREE.MeshStandardMaterial({ color: '#0369a1', roughness: 0.8 });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.05;
  group.add(floor);

  const waterGeo = new THREE.CircleGeometry(largura / 2 - 0.08, 24);
  const waterMat = new THREE.MeshStandardMaterial({
    color: '#38bdf8',
    roughness: 0.15,
    metalness: 0.2,
    transparent: true,
    opacity: 0.88,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.55;
  group.add(water);
  onWaterCreated(water);

  const pipeMat = new THREE.MeshStandardMaterial({ color: '#0284c7', metalness: 0.6, roughness: 0.3 });
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 5, 8), pipeMat);
  pipe.rotation.z = Math.PI / 2;
  pipe.position.set(2.5, 0.2, 0);
  pipe.castShadow = true;
  group.add(pipe);

  createSignpost(group, 'ÁGUA', -largura / 2 - 0.3, -comprimento / 2 - 0.2);
}

// 5. MINHOCÁRIO SECTOR (Vermicompostagem)
function createMinhocarioSector(group: THREE.Group, data: CanteiroData) {
  const { largura, comprimento } = data.posicao;
  const woodMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.85 });
  group.userData.borderMat = woodMat;
  group.userData.originalColorHex = '#78350f';

  const numTiers = 3;
  for (let i = 0; i < numTiers; i++) {
    const tier = new THREE.Mesh(
      new THREE.BoxGeometry(largura * 0.9, 0.32, (comprimento / numTiers) * 0.9),
      woodMat
    );
    const zOffset = -comprimento / 3 + i * (comprimento / numTiers);
    tier.position.set(0, 0.2 + i * 0.06, zOffset);
    tier.castShadow = true;
    tier.receiveShadow = true;
    group.add(tier);

    const humusMat = new THREE.MeshStandardMaterial({ color: '#1c1917', roughness: 0.98 });
    const humus = new THREE.Mesh(
      new THREE.BoxGeometry(largura * 0.8, 0.08, (comprimento / numTiers) * 0.78),
      humusMat
    );
    humus.position.set(0, 0.37 + i * 0.06, zOffset);
    group.add(humus);
  }

  const roofMat = new THREE.MeshStandardMaterial({ color: '#a16207', roughness: 0.7 });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(largura * 1.15, 0.05, comprimento * 1.05), roofMat);
  roof.position.set(0, 0.95, 0);
  roof.rotation.x = 0.12;
  roof.castShadow = true;
  group.add(roof);

  createSignpost(group, 'MINHOCÁRIO', -largura / 2 - 0.3, -comprimento / 2);
}

// 6. RECEPÇÃO DE MATERIAIS SECTOR
function createReceptionSector(group: THREE.Group, data: CanteiroData) {
  const { largura, comprimento } = data.posicao;

  const floorMat = new THREE.MeshStandardMaterial({ color: '#e2d5c3', roughness: 0.9 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(largura, 0.1, comprimento), floorMat);
  floor.position.y = 0.05;
  floor.receiveShadow = true;
  group.add(floor);

  const postMat = new THREE.MeshStandardMaterial({ color: '#7c4a27', roughness: 0.8 });
  const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8);

  const corners = [
    { x: -largura / 2 + 0.2, z: -comprimento / 2 + 0.2 },
    { x: largura / 2 - 0.2, z: -comprimento / 2 + 0.2 },
    { x: -largura / 2 + 0.2, z: comprimento / 2 - 0.2 },
    { x: largura / 2 - 0.2, z: comprimento / 2 - 0.2 },
  ];

  corners.forEach((c) => {
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(c.x, 1.1, c.z);
    post.castShadow = true;
    group.add(post);
  });

  const roofMat = new THREE.MeshStandardMaterial({
    color: '#27633b',
    roughness: 0.9,
    transparent: true,
    opacity: 0.85,
  });
  group.userData.borderMat = roofMat;
  group.userData.originalColorHex = '#27633b';

  const roof = new THREE.Mesh(new THREE.BoxGeometry(largura + 0.4, 0.06, comprimento + 0.4), roofMat);
  roof.position.y = 2.22;
  roof.castShadow = true;
  group.add(roof);

  const tableMat = new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.8 });
  const table = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 0.8), tableMat);
  table.position.set(0, 0.4, 0);
  table.castShadow = true;
  group.add(table);

  createSignpost(group, 'RECEPÇÃO', -largura / 2 - 0.4, -comprimento / 2);
}

// 7. VEGETAL POPULATION (Procedural Plant Models)
function populateCropsInBed(
  group: THREE.Group,
  data: CanteiroData,
  bedW: number,
  bedL: number,
  soilTopY: number
) {
  const crop = data.cultura.toLowerCase();

  if (crop.includes('alface') || crop.includes('rúcula') || crop.includes('espinafre') || crop.includes('mostarda')) {
    const isPurple = crop.includes('roxa');
    const leafMat = new THREE.MeshStandardMaterial({
      color: isPurple ? '#701a75' : '#22c55e',
      roughness: 0.75,
      flatShading: true,
    });
    const leafInnerMat = new THREE.MeshStandardMaterial({
      color: isPurple ? '#a21caf' : '#4ade80',
      roughness: 0.65,
    });

    const rows = 2;
    const cols = 7;
    const dx = bedW / (cols + 1);
    const dz = bedL / (rows + 1);

    for (let c = 1; c <= cols; c++) {
      for (let r = 1; r <= rows; r++) {
        const px = -bedW / 2 + c * dx;
        const pz = -bedL / 2 + r * dz;

        const head = new THREE.Group();
        const outerLeaves = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 1), leafMat);
        outerLeaves.scale.set(1.1, 0.65, 1.1);
        outerLeaves.castShadow = true;
        head.add(outerLeaves);

        const heart = new THREE.Mesh(new THREE.SphereGeometry(0.11, 7, 7), leafInnerMat);
        heart.position.y = 0.05;
        head.add(heart);

        head.position.set(px, soilTopY + 0.1, pz);
        group.add(head);
      }
    }
  } else if (crop.includes('cenoura') || crop.includes('beterraba') || crop.includes('rabanete')) {
    const fernMat = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.8, flatShading: true });
    const rootCrownColor = crop.includes('cenoura') ? '#ea580c' : crop.includes('beterraba') ? '#831843' : '#dc2626';
    const rootMat = new THREE.MeshStandardMaterial({ color: rootCrownColor, roughness: 0.7 });

    const rows = 2;
    const cols = 8;
    const dx = bedW / (cols + 1);
    const dz = bedL / (rows + 1);

    for (let c = 1; c <= cols; c++) {
      for (let r = 1; r <= rows; r++) {
        const px = -bedW / 2 + c * dx;
        const pz = -bedL / 2 + r * dz;

        const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.08, 6), rootMat);
        crown.position.set(px, soilTopY + 0.04, pz);
        group.add(crown);

        const foliage = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 6), fernMat);
        foliage.position.set(px, soilTopY + 0.18, pz);
        foliage.castShadow = true;
        group.add(foliage);
      }
    }
  } else if (crop.includes('tomate') || crop.includes('pimentão') || crop.includes('berinjela') || crop.includes('quiabo')) {
    const stakeMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
    const vineMat = new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.8, flatShading: true });
    const fruitColor = crop.includes('tomate') ? '#ef4444' : crop.includes('berinjela') ? '#581c87' : '#15803d';
    const fruitMat = new THREE.MeshStandardMaterial({ color: fruitColor, roughness: 0.4 });

    const cols = 5;
    const dx = bedW / (cols + 1);

    for (let c = 1; c <= cols; c++) {
      const px = -bedW / 2 + c * dx;

      const stake = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 6), stakeMat);
      stake.position.set(px, soilTopY + 0.6, 0);
      stake.castShadow = true;
      group.add(stake);

      const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 1), vineMat);
      bush.scale.set(0.9, 1.4, 0.9);
      bush.position.set(px, soilTopY + 0.55, 0);
      bush.castShadow = true;
      group.add(bush);

      for (let f = 0; f < 3; f++) {
        const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), fruitMat);
        const ang = (f * Math.PI * 2) / 3;
        fruit.position.set(px + Math.cos(ang) * 0.22, soilTopY + 0.4 + f * 0.12, Math.sin(ang) * 0.22);
        group.add(fruit);
      }
    }
  } else if (crop.includes('couve') || crop.includes('repolho') || crop.includes('brócolis')) {
    const brassicaMat = new THREE.MeshStandardMaterial({ color: '#047857', roughness: 0.8, flatShading: true });
    const cols = 5;
    const dx = bedW / (cols + 1);

    for (let c = 1; c <= cols; c++) {
      const px = -bedW / 2 + c * dx;
      const rosette = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26, 1), brassicaMat);
      rosette.scale.set(1.4, 0.6, 1.4);
      rosette.position.set(px, soilTopY + 0.16, 0);
      rosette.castShadow = true;
      group.add(rosette);
    }
  } else {
    const sproutMat = new THREE.MeshStandardMaterial({ color: '#84cc16', roughness: 0.6 });
    const cols = 8;
    const dx = bedW / (cols + 1);

    for (let c = 1; c <= cols; c++) {
      const px = -bedW / 2 + c * dx;
      const sprout = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 5), sproutMat);
      sprout.position.set(px, soilTopY + 0.06, 0);
      group.add(sprout);
    }
  }
}

// 8. SIGNPOST LABEL MAKER
function createSignpost(group: THREE.Group, text: string, x: number, z: number) {
  const postMat = new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.9 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), postMat);
  post.position.set(x, 0.35, z);
  group.add(post);

  const boardGeo = new THREE.BoxGeometry(0.65, 0.32, 0.05);
  const boardMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.5 });
  const board = new THREE.Mesh(boardGeo, boardMat);
  board.position.set(x, 0.65, z);
  board.castShadow = true;
  group.add(board);

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#1e3a1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const textMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  const textPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.28), textMat);
  textPlane.position.set(x, 0.65, z + 0.03);
  group.add(textPlane);
}