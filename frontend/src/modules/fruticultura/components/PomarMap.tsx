import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import {
  QuadraPomar,
  CORES_FRUTEIRAS,
  calcularGeometriaQuadra,
  isQuadraEquipamento,
  totalPlantas,
  IMAGEM_LARGURA_PX,
  IMAGEM_ALTURA_PX,
  PX_PARA_METRO,
} from '../data/pomarData';

export interface PomarMapRef {
  setCameraPreset: (preset: 'isometric' | 'topdown' | 'ground' | 'reset') => void;
  focusQuadra: (quadraId: string) => void;
  resetView: () => void;
}

export interface PomarMapProps {
  selectedQuadraId: string | null;
  onSelectQuadra: (quadra: QuadraPomar | null) => void;
  quadras: QuadraPomar[];
}

// Material invisível compartilhado para hitboxes de raycast (mesmo padrão do Terrarium da olericultura)
const HITBOX_MATERIAL = new THREE.MeshBasicMaterial({ visible: false });

// Enquadramento refinado da câmera - alinhado com a perspectiva e proporção da horta (Terrarium)
const DEFAULT_CAM_POS = new THREE.Vector3(20, 75, 85);
const DEFAULT_CAM_TARGET = new THREE.Vector3(2, 0, -2);

export const PomarMap = forwardRef<PomarMapRef, PomarMapProps>(
  ({ selectedQuadraId, onSelectQuadra, quadras }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const onSelectRef = useRef(onSelectQuadra);
    const quadrasRef = useRef<QuadraPomar[]>(quadras);

    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const interactiveMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
    const hitboxMeshesRef = useRef<THREE.Mesh[]>([]);

    const selectedGroupRef = useRef<THREE.Group | null>(null);
    const hoveredGroupRef = useRef<THREE.Group | null>(null);
    const hoveredIdRef = useRef<string | null>(null);
    const tooltipCoordsRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const [hovered, setHovered] = useState<QuadraPomar | null>(null);

    useEffect(() => {
      onSelectRef.current = onSelectQuadra;
    }, [onSelectQuadra]);

    useEffect(() => {
      quadrasRef.current = quadras;
    }, [quadras]);

    const markShadowDirty = () => {
      if (rendererRef.current) rendererRef.current.shadowMap.needsUpdate = true;
    };

    const flyTo = (pos: THREE.Vector3, target: THREE.Vector3, duration: number, ease: string) => {
      if (!cameraRef.current || !controlsRef.current) return;
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      gsap.killTweensOf([camera.position, controls.target]);
      gsap.to(camera.position, { x: pos.x, y: pos.y, z: pos.z, duration, ease });
      gsap.to(controls.target, { x: target.x, y: target.y, z: target.z, duration, ease });
    };

    const focusOn = (quadra: QuadraPomar) => {
      const geo = calcularGeometriaQuadra(quadra);
      const s = Math.max(geo.largura, geo.profundidade) * 0.7 + 10;
      flyTo(
        new THREE.Vector3(geo.centro.x + s * 0.4, s * 0.75, geo.centro.z + s * 0.65),
        new THREE.Vector3(geo.centro.x, 0.6, geo.centro.z),
        1.0,
        'power2.inOut'
      );
    };

    useImperativeHandle(ref, () => ({
      setCameraPreset(preset) {
        let pos = DEFAULT_CAM_POS.clone();
        let target = DEFAULT_CAM_TARGET.clone();
        if (preset === 'topdown') {
          pos = new THREE.Vector3(0, 115, 0.1);
          target = new THREE.Vector3(0, 0, 0);
        } else if (preset === 'ground') {
          pos = new THREE.Vector3(0, 2.4, 75);
          target = new THREE.Vector3(0, 1.8, -10);
        } else if (preset === 'isometric') {
          pos = new THREE.Vector3(26, 70, 78);
          target = new THREE.Vector3(2, 0, -2);
        }
        flyTo(pos, target, 1.2, 'power3.inOut');
      },

      focusQuadra(quadraId: string) {
        const item = quadrasRef.current.find((q) => q.id === quadraId);
        if (!item) return;
        focusOn(item);
        const group = interactiveMeshesRef.current.get(quadraId);
        if (group) {
          if (selectedGroupRef.current && selectedGroupRef.current !== group) {
            applyVisualState(selectedGroupRef.current, 'normal', markShadowDirty);
          }
          applyVisualState(group, 'selected', markShadowDirty);
          selectedGroupRef.current = group;
          onSelectRef.current?.(item);
        }
      },

      resetView() {
        flyTo(DEFAULT_CAM_POS, DEFAULT_CAM_TARGET, 1.0, 'power2.inOut');
        if (selectedGroupRef.current) {
          applyVisualState(selectedGroupRef.current, 'normal', markShadowDirty);
          selectedGroupRef.current = null;
        }
      },
    }));

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const width = container.clientWidth || 800;
      const height = container.clientHeight || 600;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#f4f1e7');
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 600);
      camera.position.copy(DEFAULT_CAM_POS);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.shadowMap.autoUpdate = false;
      renderer.shadowMap.needsUpdate = true;
      renderer.toneMapping = THREE.NoToneMapping;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
      renderer.domElement.style.cursor = 'grab';
      rendererRef.current = renderer;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.rotateSpeed = 0.85;
      controls.zoomSpeed = 1.0;
      controls.panSpeed = 0.85;
      controls.maxPolarAngle = Math.PI / 2.08;
      controls.minDistance = 6;
      controls.maxDistance = 220;
      controls.target.copy(DEFAULT_CAM_TARGET);
      controls.update();
      controlsRef.current = controls;

      // Iluminação idêntica à olericultura (clara, quente, natural)
      scene.add(new THREE.AmbientLight('#ffffff', 1.15));
      const hemiLight = new THREE.HemisphereLight('#ffffff', '#f4f1e7', 0.55);
      hemiLight.position.set(0, 60, 0);
      scene.add(hemiLight);

      const sunLight = new THREE.DirectionalLight('#fffdf7', 1.35);
      sunLight.position.set(45, 80, 40);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 240;
      sunLight.shadow.bias = -0.0005;
      const d = 80;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      scene.add(sunLight);

      buildEnvironment(scene);

      interactiveMeshesRef.current.clear();
      hitboxMeshesRef.current = [];
      buildQuadras(scene, interactiveMeshesRef.current, hitboxMeshesRef.current, quadrasRef.current);
      renderer.shadowMap.needsUpdate = true;

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      let isDragging = false;
      let pointerMovedWhileDown = false;
      let downX = 0;
      let downY = 0;
      let lastRaycastTime = 0;

      const setCursor = (c: string) => {
        container.style.cursor = c;
        renderer.domElement.style.cursor = c;
      };

      const updateTooltipPosition = (x: number, y: number) => {
        tooltipCoordsRef.current = { x, y };
        if (tooltipRef.current) {
          tooltipRef.current.style.transform = `translate3d(${x + 16}px, ${y + 16}px, 0)`;
        }
      };

      const handlePointerDown = (e: MouseEvent) => {
        isDragging = true;
        pointerMovedWhileDown = false;
        downX = e.clientX;
        downY = e.clientY;
        setCursor('grabbing');
      };

      const handlePointerUp = () => {
        isDragging = false;
        setCursor(hoveredGroupRef.current ? 'pointer' : 'grab');
      };

      const handlePointerMove = (e: MouseEvent) => {
        if (isDragging) {
          if (Math.abs(e.clientX - downX) > 4 || Math.abs(e.clientY - downY) > 4) {
            pointerMovedWhileDown = true;
            if (hoveredIdRef.current !== null) {
              hoveredIdRef.current = null;
              setHovered(null);
            }
          }
          return;
        }

        const rect = container.getBoundingClientRect();
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;

        if (hoveredIdRef.current) updateTooltipPosition(localX, localY);

        const now = performance.now();
        if (now - lastRaycastTime < 32) return;
        lastRaycastTime = now;

        mouse.x = (localX / rect.width) * 2 - 1;
        mouse.y = -(localY / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(hitboxMeshesRef.current, false);

        if (intersects.length > 0) {
          const hitMesh = intersects[0].object;
          const foundId = hitMesh.userData.quadraId as string | undefined;
          const rootGroup = hitMesh.userData.rootGroup as THREE.Group | undefined;

          if (foundId && rootGroup) {
            updateTooltipPosition(localX, localY);
            const quadra = quadrasRef.current.find((q) => q.id === foundId) || null;
            if (hoveredIdRef.current !== foundId) {
              hoveredIdRef.current = foundId;
              setHovered(quadra);
            }

            setCursor('pointer');

            if (hoveredGroupRef.current !== rootGroup) {
              if (hoveredGroupRef.current && hoveredGroupRef.current !== selectedGroupRef.current) {
                applyVisualState(hoveredGroupRef.current, 'normal', markShadowDirty);
              }
              if (rootGroup !== selectedGroupRef.current) {
                applyVisualState(rootGroup, 'hover', markShadowDirty);
              }
              hoveredGroupRef.current = rootGroup;
            }
            return;
          }
        }

        if (hoveredGroupRef.current) {
          if (hoveredGroupRef.current !== selectedGroupRef.current) {
            applyVisualState(hoveredGroupRef.current, 'normal', markShadowDirty);
          }
          hoveredGroupRef.current = null;
        }
        if (hoveredIdRef.current !== null) {
          hoveredIdRef.current = null;
          setHovered(null);
        }
        setCursor('grab');
      };

      const handleClick = (e: MouseEvent) => {
        if (pointerMovedWhileDown) return;

        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(hitboxMeshesRef.current, false);
        if (intersects.length === 0) return;

        const hitMesh = intersects[0].object;
        const foundId = hitMesh.userData.quadraId as string | undefined;
        const clickedGroup = hitMesh.userData.rootGroup as THREE.Group | undefined;
        if (!foundId || !clickedGroup) return;

        const quadra = quadrasRef.current.find((q) => q.id === foundId);
        if (!quadra) return;

        focusOn(quadra);

        if (selectedGroupRef.current && selectedGroupRef.current !== clickedGroup) {
          applyVisualState(selectedGroupRef.current, 'normal', markShadowDirty);
        }
        applyVisualState(clickedGroup, 'selected', markShadowDirty);
        selectedGroupRef.current = clickedGroup;
        onSelectRef.current?.(quadra);
      };

      container.addEventListener('mousemove', handlePointerMove, { passive: true });
      container.addEventListener('mousedown', handlePointerDown, { passive: true });
      window.addEventListener('mouseup', handlePointerUp, { passive: true });
      container.addEventListener('click', handleClick);

      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);
        if (document.hidden) return;
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        const newW = container.clientWidth;
        const newH = container.clientHeight;
        if (newW === 0 || newH === 0) return;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mouseup', handlePointerUp);
        container.removeEventListener('mousemove', handlePointerMove);
        container.removeEventListener('mousedown', handlePointerDown);
        container.removeEventListener('click', handleClick);

        if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);

        gsap.killTweensOf([camera.position, controls.target]);
        interactiveMeshesRef.current.forEach((group) => gsap.killTweensOf(group.position));

        disposeSceneResources(scene);
        controls.dispose();
        renderer.dispose();
        scene.clear();
        interactiveMeshesRef.current.clear();
        hitboxMeshesRef.current = [];
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sincroniza a quadra selecionada vinda da página
    useEffect(() => {
      const targetGroup = selectedQuadraId
        ? interactiveMeshesRef.current.get(selectedQuadraId) || null
        : null;

      if (selectedGroupRef.current && selectedGroupRef.current !== targetGroup) {
        applyVisualState(
          selectedGroupRef.current,
          selectedGroupRef.current === hoveredGroupRef.current ? 'hover' : 'normal',
          markShadowDirty
        );
      }
      if (targetGroup) applyVisualState(targetGroup, 'selected', markShadowDirty);
      selectedGroupRef.current = targetGroup;
    }, [selectedQuadraId]);

    return (
      <div className="relative w-full h-full overflow-hidden select-none bg-[#f4f1e7]">
        <div ref={containerRef} className="w-full h-full cursor-grab" />

        {hovered && (
          <div
            ref={tooltipRef}
            style={{
              left: 0,
              top: 0,
              transform: `translate3d(${tooltipCoordsRef.current.x + 16}px, ${tooltipCoordsRef.current.y + 16}px, 0)`,
              willChange: 'transform',
            }}
            className="pointer-events-none absolute z-40 rounded-2xl border border-emerald-900/15 bg-white/95 px-3.5 py-2.5 shadow-2xl backdrop-blur-md transition-opacity duration-75 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 min-w-8 px-1.5 items-center justify-center rounded-xl bg-[#27633b] text-xs font-bold text-white shadow-sm shrink-0">
                {hovered.codigo}
              </span>
              <div className="pr-1">
                <h4 className="text-sm font-bold text-slate-900 leading-tight">{hovered.nome}</h4>
                <p className="text-xs font-semibold text-emerald-800 leading-tight mt-0.5">
                  {isQuadraEquipamento(hovered)
                    ? 'Infraestrutura'
                    : `${hovered.culturas.join(', ')} • ${totalPlantas(hovered)} plantas`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

PomarMap.displayName = 'PomarMap';

// ==========================================
// LIMPEZA DE RECURSOS DA GPU
// ==========================================

function disposeMaterial(material: THREE.Material) {
  if (material === HITBOX_MATERIAL) return;
  const record = material as unknown as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const value = record[key];
    if (value instanceof THREE.Texture) value.dispose();
  }
  material.dispose();
}

function disposeSceneResources(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();

  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      if (obj.geometry) geometries.add(obj.geometry);
      if (Array.isArray(obj.material)) obj.material.forEach((m) => materials.add(m));
      else if (obj.material) materials.add(obj.material);
    } else if (obj instanceof THREE.Sprite) {
      materials.add(obj.material);
    }
  });

  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => disposeMaterial(m));
}

// ==========================================
// ESTADO VISUAL (normal / hover / selecionado)
// ==========================================

function applyVisualState(
  group: THREE.Group,
  state: 'normal' | 'hover' | 'selected',
  onShadowDirty?: () => void
) {
  const plateMat = group.userData.borderMat as THREE.MeshStandardMaterial | undefined;
  const ringMesh = group.userData.ringMesh as THREE.Mesh | undefined;
  const labelSprite = group.userData.labelSprite as THREE.Sprite | undefined;
  const originalColorHex = (group.userData.originalColorHex as string) || '#5c4033';

  gsap.killTweensOf(group.position);
  const y = state === 'normal' ? 0 : state === 'hover' ? 0.2 : 0.35;
  gsap.to(group.position, { y, duration: 0.25, ease: 'power2.out', onComplete: onShadowDirty });

  if (state === 'normal') {
    plateMat?.color.set(originalColorHex);
    plateMat?.emissive.set(0x000000);
    if (plateMat) plateMat.emissiveIntensity = 0;
    if (ringMesh) ringMesh.visible = false;
    if (labelSprite) {
      (labelSprite.material as THREE.SpriteMaterial).opacity = 0.88;
      labelSprite.scale.set(7.5, 2.0, 1);
    }
    return;
  }

  const selected = state === 'selected';
  if (plateMat) {
    plateMat.color.set(selected ? '#2e7d32' : '#388e3c');
    plateMat.emissive.set(selected ? '#4caf50' : '#81c784');
    plateMat.emissiveIntensity = selected ? 0.45 : 0.25;
  }
  if (ringMesh) {
    ringMesh.visible = true;
    const rMat = ringMesh.material as THREE.MeshStandardMaterial;
    rMat.color.set(selected ? '#22c55e' : '#4caf50');
    rMat.emissive.set(selected ? '#22c55e' : '#4caf50');
    rMat.emissiveIntensity = selected ? 0.85 : 0.55;
  }
  if (labelSprite) {
    (labelSprite.material as THREE.SpriteMaterial).opacity = 1.0;
    labelSprite.scale.set(8.5, 2.3, 1);
  }
}

// ==========================================
// CONSTRUÇÃO DA CENA 3D (MEIO AMBIENTE & CAMINHOS)
// ==========================================

function buildEnvironment(scene: THREE.Scene) {
  const envGroup = new THREE.Group();
  envGroup.name = 'pomar-environment-group';

  const largura = IMAGEM_LARGURA_PX * PX_PARA_METRO + 20; // ~165m
  const comprimento = IMAGEM_ALTURA_PX * PX_PARA_METRO + 20; // ~139m

  // 1. Receptor de sombras sem laje cinza sobre o fundo creme
  const shadowFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    new THREE.ShadowMaterial({ opacity: 0.12 })
  );
  shadowFloor.rotation.x = -Math.PI / 2;
  shadowFloor.position.y = -0.02;
  shadowFloor.receiveShadow = true;
  envGroup.add(shadowFloor);

  // 2. Terreno do pomar (cor de solo suave idêntica à da horta)
  const terreno = new THREE.Mesh(
    new THREE.PlaneGeometry(largura, comprimento),
    new THREE.MeshBasicMaterial({ color: '#f0ece1' })
  );
  terreno.rotation.x = -Math.PI / 2;
  terreno.position.y = -0.005;
  envGroup.add(terreno);

  // 3. Caminhos de terra batida / circulação entre os setores (padrão '#e6dec8' da olericultura)
  const pathMat = new THREE.MeshBasicMaterial({ color: '#e6dec8' });

  // 3.1. Avenida Central (divide pomar oeste e leste)
  const centralAvenue = new THREE.Mesh(new THREE.PlaneGeometry(3.2, comprimento - 12), pathMat);
  centralAvenue.rotation.x = -Math.PI / 2;
  centralAvenue.position.set(3, 0.005, 0);
  envGroup.add(centralAvenue);

  // 3.2. Alameda Norte (em frente a Goiaba e Banana)
  const northRoad = new THREE.Mesh(new THREE.PlaneGeometry(largura - 24, 2.4), pathMat);
  northRoad.rotation.x = -Math.PI / 2;
  northRoad.position.set(0, 0.006, -36);
  envGroup.add(northRoad);

  // 3.3. Alameda Central Transversal (entre Banana/Manga e Uva/Citros)
  const midCrossroad = new THREE.Mesh(new THREE.PlaneGeometry(largura - 20, 2.4), pathMat);
  midCrossroad.rotation.x = -Math.PI / 2;
  midCrossroad.position.set(0, 0.006, -2);
  envGroup.add(midCrossroad);

  // 3.4. Alameda Sul Transversal (acesso a Pitayas e Graviola)
  const southCrossroad = new THREE.Mesh(new THREE.PlaneGeometry(largura - 30, 2.2), pathMat);
  southCrossroad.rotation.x = -Math.PI / 2;
  southCrossroad.position.set(0, 0.006, 26);
  envGroup.add(southCrossroad);

  // 3.5. Caminho lateral Oeste (entre Uva e Citros/Caju)
  const westAisle = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 48), pathMat);
  westAisle.rotation.x = -Math.PI / 2;
  westAisle.position.set(-36, 0.006, 12);
  envGroup.add(westAisle);

  // 3.6. Caminho das Pitayas (corredor leste)
  const pitayaAisle = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 56), pathMat);
  pitayaAisle.rotation.x = -Math.PI / 2;
  pitayaAisle.position.set(36, 0.006, 26);
  envGroup.add(pitayaAisle);

  // 4. Cerca perimetral com mourões de madeira
  const postGeo = new THREE.CylinderGeometry(0.09, 0.1, 1.4, 6);
  const postMat = new THREE.MeshStandardMaterial({ color: '#5c4033', roughness: 0.9 });
  const hw = largura / 2;
  const hd = comprimento / 2;
  const corners = [
    { x: -hw, z: -hd },
    { x: hw, z: -hd },
    { x: hw, z: hd },
    { x: -hw, z: hd },
  ];
  corners.forEach((p1, i) => {
    const p2 = corners[(i + 1) % corners.length];
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const dist = Math.hypot(dx, dz);
    const passos = Math.max(1, Math.round(dist / 4.2));
    for (let s = 0; s < passos; s++) {
      // Deixa portão aberto no sul (centro)
      const x = p1.x + (s / passos) * dx;
      const z = p1.z + (s / passos) * dz;
      if (Math.abs(z - hd) < 0.5 && Math.abs(x) < 5) continue;

      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(x, 0.7, z);
      post.castShadow = true;
      envGroup.add(post);
    }
  });

  // 5. Flora perimetral decorativa (árvores low-poly contornando a cerca externa, como na horta)
  createPerimeterFlora(envGroup, hw, hd);

  scene.add(envGroup);
  return envGroup;
}

function createPerimeterFlora(parent: THREE.Group, hw: number, hd: number) {
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 2.6, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#4a3525', roughness: 0.9 });
  const canopyGeos = [
    new THREE.DodecahedronGeometry(1.6, 1),
    new THREE.DodecahedronGeometry(1.9, 1),
  ];
  const canopyMats = [
    new THREE.MeshStandardMaterial({ color: '#2d6a4f', roughness: 0.85, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: '#40916c', roughness: 0.85, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: '#d4a373', roughness: 0.85, flatShading: true }), // Ipê suave
  ];

  const positions: Array<{ x: number; z: number }> = [];
  const spacing = 12;

  // Lado norte e sul
  for (let x = -hw + 8; x <= hw - 8; x += spacing) {
    positions.push({ x, z: -hd - 4.5 });
    if (Math.abs(x) > 8) positions.push({ x, z: hd + 4.5 });
  }
  // Lado leste e oeste
  for (let z = -hd + 8; z <= hd - 8; z += spacing) {
    positions.push({ x: -hw - 4.5, z });
    positions.push({ x: hw + 4.5, z });
  }

  positions.forEach((pos, idx) => {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.3;
    trunk.castShadow = true;
    tree.add(trunk);

    const canopy = new THREE.Mesh(canopyGeos[idx % canopyGeos.length], canopyMats[idx % canopyMats.length]);
    canopy.position.y = 3.0;
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    tree.add(canopy);

    tree.position.set(pos.x, 0, pos.z);
    parent.add(tree);
  });
}

// Geometrias reutilizáveis de modelos low-poly
const UNIT_SPHERE = new THREE.DodecahedronGeometry(1, 1);
const UNIT_CYLINDER = new THREE.CylinderGeometry(1, 1, 1, 7);
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);

interface MateriaisFruteira {
  copa: THREE.MeshStandardMaterial;
  tronco: THREE.MeshStandardMaterial;
  extra: THREE.MeshStandardMaterial;
}

/**
 * Cria sprite de etiqueta harmoniosa:
 * - Proporção menor e elegante
 * - Fundo branco translúcido com cantos arredondados
 * - Não oclui a visão do pomar
 */
function criarLabelSprite(texto: string, subtexto: string, cor: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 136;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Pill arredondada translúcida
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.beginPath();
    ctx.roundRect(6, 6, canvas.width - 12, canvas.height - 12, 28);
    ctx.fill();

    // Borda sutil na cor da cultura
    ctx.strokeStyle = cor;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Texto principal
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(texto, canvas.width / 2, 62);

    // Subtítulo
    ctx.fillStyle = cor;
    ctx.font = '600 26px sans-serif';
    ctx.fillText(subtexto, canvas.width / 2, 102);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    depthTest: false,
    transparent: true,
    opacity: 0.88,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(7.5, 2.0, 1);
  sprite.renderOrder = 10;
  return sprite;
}

function buildQuadras(
  scene: THREE.Scene,
  interactiveMap: Map<string, THREE.Group>,
  hitboxMeshes: THREE.Mesh[],
  quadras: QuadraPomar[]
) {
  const materiaisPorTipo = new Map<string, MateriaisFruteira>();
  const obterMateriais = (quadra: QuadraPomar): MateriaisFruteira => {
    let mats = materiaisPorTipo.get(quadra.tipoFruteira);
    if (!mats) {
      const cores = CORES_FRUTEIRAS[quadra.tipoFruteira];
      mats = {
        copa: new THREE.MeshStandardMaterial({ color: cores.copa, roughness: 0.82, flatShading: true }),
        tronco: new THREE.MeshStandardMaterial({ color: cores.tronco, roughness: 0.9 }),
        extra: new THREE.MeshStandardMaterial({ color: '#d81b60', roughness: 0.7 }),
      };
      materiaisPorTipo.set(quadra.tipoFruteira, mats);
    }
    return mats;
  };

  quadras.forEach((quadra) => {
    const geo = calcularGeometriaQuadra(quadra);
    const group = new THREE.Group();
    group.userData = { quadraId: quadra.id };
    const equipamento = isQuadraEquipamento(quadra);

    // Canteiro/placa base com acabamento idêntico ao canteiro elevado de madeira da horta
    const baseMat = new THREE.MeshStandardMaterial({
      color: equipamento ? '#eceff1' : '#5c4033',
      roughness: 0.88,
      metalness: 0.05,
    });
    group.userData.borderMat = baseMat;
    group.userData.originalColorHex = equipamento ? '#eceff1' : '#5c4033';

    const plate = new THREE.Mesh(UNIT_BOX, baseMat);
    plate.scale.set(geo.largura + 1.0, 0.2, geo.profundidade + 1.0);
    plate.position.y = 0.1;
    plate.receiveShadow = true;
    plate.castShadow = true;
    group.add(plate);

    // Terra interna do canteiro
    if (!equipamento) {
      const soilMat = new THREE.MeshStandardMaterial({
        color: '#2a1d15',
        roughness: 0.96,
        metalness: 0.02,
      });
      const soil = new THREE.Mesh(UNIT_BOX, soilMat);
      soil.scale.set(geo.largura + 0.6, 0.08, geo.profundidade + 0.6);
      soil.position.y = 0.22;
      soil.receiveShadow = true;
      group.add(soil);
    }

    // Anel verde de destaque para seleção/hover
    const ringMat = new THREE.MeshStandardMaterial({
      color: '#4caf50',
      emissive: '#4caf50',
      emissiveIntensity: 0.6,
    });
    const ring = new THREE.Mesh(UNIT_BOX, ringMat);
    ring.scale.set(geo.largura + 1.8, 0.06, geo.profundidade + 1.8);
    ring.position.y = 0.03;
    ring.visible = false;
    group.add(ring);
    group.userData.ringMesh = ring;

    let alturaTotal = 4.2;

    if (equipamento) {
      alturaTotal = 4.0;
      // Galpão/sala de equipamentos com acabamento em tons terrosos da horta
      const wallMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.85 });
      const roofMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.7 });
      const walls = new THREE.Mesh(UNIT_BOX, wallMat);
      walls.scale.set(geo.largura * 0.92, 2.6, geo.profundidade * 0.92);
      walls.position.y = 1.4;
      walls.castShadow = true;
      walls.receiveShadow = true;
      group.add(walls);

      const roof = new THREE.Mesh(UNIT_BOX, roofMat);
      roof.scale.set(geo.largura, 0.35, geo.profundidade);
      roof.position.y = 2.85;
      roof.castShadow = true;
      group.add(roof);
    } else {
      const mats = obterMateriais(quadra);
      geo.plantas.forEach((p) => {
        const planta = criarPlanta(quadra, p, mats);
        planta.position.set(p.x, 0.22, p.z);
        group.add(planta);
      });
    }

    // Rótulo flutuante estilizado
    const cor = CORES_FRUTEIRAS[quadra.tipoFruteira].label;
    const sub = equipamento ? 'Infraestrutura' : `${quadra.culturas.join(' • ')}`;
    const label = criarLabelSprite(quadra.nome, sub, cor);
    label.position.set(0, alturaTotal + 1.8, 0);
    group.add(label);
    group.userData.labelSprite = label;

    // Hitbox única por quadra (raycast ultra rápido O(1))
    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(geo.largura + 1.2, alturaTotal, geo.profundidade + 1.2),
      HITBOX_MATERIAL
    );
    hitbox.position.y = alturaTotal / 2;
    hitbox.userData = { quadraId: quadra.id, rootGroup: group };
    group.add(hitbox);
    hitboxMeshes.push(hitbox);

    group.position.set(geo.centro.x, 0, geo.centro.z);
    group.rotation.y = geo.rotacaoY;

    scene.add(group);
    interactiveMap.set(quadra.id, group);
  });
}

/**
 * Cria modelos low-poly harmonizados com a proporção da horta:
 * - Árvores com proporção adequada (2.5 a 4m de altura)
 * - Copa facetada em Dodecahedron para combinar com os repolhos e copas do Terrarium
 * - Espaçamento equilibrado
 */
function criarPlanta(
  quadra: QuadraPomar,
  p: { w: number; d: number },
  mats: MateriaisFruteira
): THREE.Group {
  const planta = new THREE.Group();
  const lado = Math.min(p.w, p.d);

  const add = (mesh: THREE.Mesh, sombra = true) => {
    mesh.castShadow = sombra;
    mesh.receiveShadow = true;
    planta.add(mesh);
    return mesh;
  };

  switch (quadra.tipoFruteira) {
    case 'uva': {
      // Latada de parreira: mourões nas pontas e cobertura contínua
      const poste1 = new THREE.Mesh(UNIT_CYLINDER, mats.tronco);
      poste1.scale.set(0.1, 2.0, 0.1);
      poste1.position.set(-p.w / 2 + 0.25, 1.0, 0);
      add(poste1);

      const poste2 = poste1.clone();
      poste2.position.x = p.w / 2 - 0.25;
      add(poste2);

      const folhagem = new THREE.Mesh(UNIT_BOX, mats.copa);
      folhagem.scale.set(p.w * 0.98, 0.6, p.d * 0.85);
      folhagem.position.y = 1.6;
      add(folhagem);
      break;
    }
    case 'banana': {
      // Bananeira estilizada com tronco cônico e copa volumosa
      const tronco = new THREE.Mesh(UNIT_CYLINDER, mats.tronco);
      tronco.scale.set(0.18, 2.0, 0.18);
      tronco.position.y = 1.0;
      add(tronco);

      const folhas = new THREE.Mesh(UNIT_SPHERE, mats.copa);
      folhas.scale.set(lado * 0.38, 0.55, lado * 0.38);
      folhas.position.y = 2.1;
      add(folhas);
      break;
    }
    case 'coco': {
      // Coqueiro 
      const tronco = new THREE.Mesh(UNIT_CYLINDER, mats.tronco);
      tronco.scale.set(0.14, 3.4, 0.14);
      tronco.position.y = 1.7;
      add(tronco);

      const folhas = new THREE.Mesh(UNIT_SPHERE, mats.copa);
      folhas.scale.set(lado * 0.42, 0.45, lado * 0.42);
      folhas.position.y = 3.5;
      add(folhas);
      break;
    }
    case 'pitaya': {
      // Tutor/mourão de concreto com copa suspensa e pequeno fruto
      const poste = new THREE.Mesh(UNIT_CYLINDER, mats.tronco);
      poste.scale.set(0.12, 1.4, 0.12);
      poste.position.y = 0.7;
      add(poste);

      const copa = new THREE.Mesh(UNIT_SPHERE, mats.copa);
      copa.scale.set(lado * 0.32, 0.45, lado * 0.32);
      copa.position.y = 1.45;
      add(copa);

      const fruto = new THREE.Mesh(UNIT_SPHERE, mats.extra);
      fruto.scale.set(0.14, 0.14, 0.14);
      fruto.position.set(lado * 0.18, 1.25, 0);
      add(fruto, false);
      break;
    }
    default: {
      // Fruteiras padrão em formato copa arbórea (manga mais encorpada, goiaba/citros/graviola equilibradas)
      const isManga = quadra.tipoFruteira === 'manga';
      const alturaTronco = isManga ? 1.4 : 1.0;
      const tronco = new THREE.Mesh(UNIT_CYLINDER, mats.tronco);
      tronco.scale.set(0.14, alturaTronco, 0.14);
      tronco.position.y = alturaTronco / 2;
      add(tronco);

      const copa = new THREE.Mesh(UNIT_SPHERE, mats.copa);
      const raioCopa = isManga ? lado * 0.42 : lado * 0.36;
      const alturaCopa = isManga ? 1.3 : 1.05;
      copa.scale.set(raioCopa, alturaCopa, raioCopa);
      copa.position.y = alturaTronco + alturaCopa * 0.75;
      add(copa);
    }
  }

  return planta;
}
