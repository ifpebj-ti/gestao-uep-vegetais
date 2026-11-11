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

const DEFAULT_CAM_POS = new THREE.Vector3(30, 95, 105);
const DEFAULT_CAM_TARGET = new THREE.Vector3(0, 0, 0);

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
      const s = Math.max(geo.largura, geo.profundidade) * 0.8 + 14;
      flyTo(
        new THREE.Vector3(geo.centro.x + s * 0.35, s * 0.85, geo.centro.z + s * 0.75),
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
          pos = new THREE.Vector3(0, 150, 1);
        } else if (preset === 'ground') {
          pos = new THREE.Vector3(0, 3, -100);
          target = new THREE.Vector3(0, 2, 0);
        }
        flyTo(pos, target, 1.2, 'power3.inOut');
      },

      focusQuadra(quadraId: string) {
        const item = quadrasRef.current.find((q) => q.id === quadraId);
        if (!item) return;
        focusOn(item);
        const group = interactiveMeshesRef.current.get(quadraId);
        if (group && !isQuadraEquipamento(item)) {
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

      const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 800);
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
      controls.minDistance = 8;
      controls.maxDistance = 260;
      controls.target.copy(DEFAULT_CAM_TARGET);
      controls.update();
      controlsRef.current = controls;

      scene.add(new THREE.AmbientLight('#ffffff', 1.15));
      const hemiLight = new THREE.HemisphereLight('#ffffff', '#f4f1e7', 0.55);
      hemiLight.position.set(0, 80, 0);
      scene.add(hemiLight);

      const sunLight = new THREE.DirectionalLight('#fffdf7', 1.35);
      sunLight.position.set(60, 100, 50);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 300;
      sunLight.shadow.bias = -0.0005;
      const d = 100;
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

            setCursor(quadra && isQuadraEquipamento(quadra) ? 'default' : 'pointer');

            if (hoveredGroupRef.current !== rootGroup) {
              if (hoveredGroupRef.current && hoveredGroupRef.current !== selectedGroupRef.current) {
                applyVisualState(hoveredGroupRef.current, 'normal', markShadowDirty);
              }
              if (rootGroup !== selectedGroupRef.current && quadra && !isQuadraEquipamento(quadra)) {
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
        // Infraestrutura (sala de equipamento) exibe apenas o tooltip, sem seleção
        if (!quadra || isQuadraEquipamento(quadra)) return;

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
  const originalColorHex = (group.userData.originalColorHex as string) || '#d8ccae';

  gsap.killTweensOf(group.position);
  const y = state === 'normal' ? 0 : state === 'hover' ? 0.3 : 0.5;
  gsap.to(group.position, { y, duration: 0.25, ease: 'power2.out', onComplete: onShadowDirty });

  if (state === 'normal') {
    plateMat?.color.set(originalColorHex);
    plateMat?.emissive.set(0x000000);
    if (plateMat) plateMat.emissiveIntensity = 0;
    if (ringMesh) ringMesh.visible = false;
    return;
  }

  const selected = state === 'selected';
  if (plateMat) {
    plateMat.color.set(selected ? '#a5d6a7' : '#c8e6c9');
    plateMat.emissive.set(selected ? '#22c55e' : '#4caf50');
    plateMat.emissiveIntensity = selected ? 0.5 : 0.3;
  }
  if (ringMesh) {
    ringMesh.visible = true;
    const rMat = ringMesh.material as THREE.MeshStandardMaterial;
    rMat.color.set(selected ? '#22c55e' : '#4caf50');
    rMat.emissive.set(selected ? '#22c55e' : '#4caf50');
    rMat.emissiveIntensity = selected ? 0.95 : 0.6;
  }
}

// ==========================================
// CONSTRUÇÃO DA CENA 3D
// ==========================================

function buildEnvironment(scene: THREE.Scene) {
  const envGroup = new THREE.Group();
  envGroup.name = 'pomar-environment-group';

  const largura = IMAGEM_LARGURA_PX * PX_PARA_METRO + 14;
  const comprimento = IMAGEM_ALTURA_PX * PX_PARA_METRO + 14;

  // Receptor de sombras sem laje cinza sobre o fundo creme
  const shadowFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 600),
    new THREE.ShadowMaterial({ opacity: 0.12 })
  );
  shadowFloor.rotation.x = -Math.PI / 2;
  shadowFloor.position.y = -0.02;
  shadowFloor.receiveShadow = true;
  envGroup.add(shadowFloor);

  // Terreno do pomar (terra batida suave)
  const terreno = new THREE.Mesh(
    new THREE.PlaneGeometry(largura, comprimento),
    new THREE.MeshBasicMaterial({ color: '#ebe5cf' })
  );
  terreno.rotation.x = -Math.PI / 2;
  terreno.position.y = -0.005;
  envGroup.add(terreno);

  // Cerca perimetral (mourões)
  const postGeo = new THREE.CylinderGeometry(0.1, 0.11, 1.5, 6);
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
    const passos = Math.max(1, Math.round(Math.hypot(dx, dz) / 5));
    for (let s = 0; s < passos; s++) {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(p1.x + (s / passos) * dx, 0.75, p1.z + (s / passos) * dz);
      post.castShadow = true;
      envGroup.add(post);
    }
  });

  scene.add(envGroup);
  return envGroup;
}

const UNIT_SPHERE = new THREE.SphereGeometry(1, 12, 9);
const UNIT_CYLINDER = new THREE.CylinderGeometry(1, 1, 1, 7);
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);

interface MateriaisFruteira {
  copa: THREE.MeshStandardMaterial;
  tronco: THREE.MeshStandardMaterial;
  extra: THREE.MeshStandardMaterial;
}

function criarLabelSprite(texto: string, subtexto: string, cor: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.roundRect(8, 8, canvas.width - 16, canvas.height - 16, 36);
    ctx.fill();
    ctx.strokeStyle = cor;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 56px sans-serif';
    ctx.fillText(texto, canvas.width / 2, 78);
    ctx.fillStyle = cor;
    ctx.font = '600 34px sans-serif';
    ctx.fillText(subtexto, canvas.width / 2, 124);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true }));
  sprite.scale.set(16, 4, 1);
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
        copa: new THREE.MeshStandardMaterial({ color: cores.copa, roughness: 0.85, flatShading: true }),
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

    // Base (canteiro) da quadra - recebe o destaque de hover/seleção
    const plateColor = equipamento ? '#cfd8dc' : '#d8ccae';
    const plateMat = new THREE.MeshStandardMaterial({ color: plateColor, roughness: 0.95 });
    group.userData.borderMat = plateMat;
    group.userData.originalColorHex = plateColor;
    const plate = new THREE.Mesh(UNIT_BOX, plateMat);
    plate.scale.set(geo.largura + 1.2, 0.12, geo.profundidade + 1.2);
    plate.position.y = 0.06;
    plate.receiveShadow = true;
    group.add(plate);

    const ringMat = new THREE.MeshStandardMaterial({ color: '#4caf50', emissive: '#4caf50', emissiveIntensity: 0.6 });
    const ring = new THREE.Mesh(UNIT_BOX, ringMat);
    ring.scale.set(geo.largura + 2.4, 0.06, geo.profundidade + 2.4);
    ring.position.y = 0.03;
    ring.visible = false;
    group.add(ring);
    group.userData.ringMesh = ring;

    let alturaTotal = 4.5;
    if (equipamento) {
      alturaTotal = 4;
      const wallMat = new THREE.MeshStandardMaterial({ color: '#eceff1', roughness: 0.8 });
      const roofMat = new THREE.MeshStandardMaterial({ color: '#78909c', roughness: 0.7 });
      const walls = new THREE.Mesh(UNIT_BOX, wallMat);
      walls.scale.set(geo.largura * 0.92, 2.6, geo.profundidade * 0.92);
      walls.position.y = 1.4;
      walls.castShadow = true;
      walls.receiveShadow = true;
      group.add(walls);
      const roof = new THREE.Mesh(UNIT_BOX, roofMat);
      roof.scale.set(geo.largura, 0.3, geo.profundidade);
      roof.position.y = 2.85;
      roof.castShadow = true;
      group.add(roof);
    } else {
      const mats = obterMateriais(quadra);
      geo.plantas.forEach((p) => {
        const planta = criarPlanta(quadra, p, mats);
        planta.position.set(p.x, 0.12, p.z);
        group.add(planta);
      });
    }

    // Rótulo flutuante com o nome da quadra
    const cor = CORES_FRUTEIRAS[quadra.tipoFruteira].label;
    const sub = equipamento ? 'Infraestrutura' : `${quadra.culturas.join(' • ')}`;
    const label = criarLabelSprite(quadra.nome, sub, cor);
    label.position.set(0, alturaTotal + 3, 0);
    group.add(label);

    // Hitbox única por quadra (raycast O(1))
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
      // Latada: mourões nas pontas, arame e parreira contínua ao longo da linha
      const poste1 = new THREE.Mesh(UNIT_CYLINDER, mats.tronco);
      poste1.scale.set(0.12, 2.2, 0.12);
      poste1.position.set(-p.w / 2 + 0.2, 1.1, 0);
      add(poste1);
      const poste2 = poste1.clone();
      poste2.position.x = p.w / 2 - 0.2;
      add(poste2);
      const folhagem = new THREE.Mesh(UNIT_BOX, mats.copa);
      folhagem.scale.set(p.w * 0.97, 0.8, p.d * 0.9);
      folhagem.position.y = 1.7;
      add(folhagem);
      break;
    }
    case 'banana': {
      const tronco = new THREE.Mesh(UNIT_CYLINDER, mats.tronco);
      tronco.scale.set(lado * 0.07, 2.2, lado * 0.07);
      tronco.position.y = 1.1;
      add(tronco);
      const folhas = new THREE.Mesh(UNIT_SPHERE, mats.copa);
      folhas.scale.set(p.w * 0.48, 0.55, p.d * 0.48);
      folhas.position.y = 2.4;
      add(folhas);
      break;
    }
    case 'coco': {
      const tronco = new THREE.Mesh(UNIT_CYLINDER, mats.tronco);
      tronco.scale.set(lado * 0.045, 4, lado * 0.045);
      tronco.position.y = 2;
      add(tronco);
      const folhas = new THREE.Mesh(UNIT_SPHERE, mats.copa);
      folhas.scale.set(p.w * 0.5, 0.5, p.d * 0.5);
      folhas.position.y = 4.1;
      add(folhas);
      break;
    }
    case 'pitaya': {
      // Mourão de concreto com a copa de pitaya em guarda-chuva
      const poste = new THREE.Mesh(UNIT_CYLINDER, mats.tronco);
      poste.scale.set(lado * 0.04, 1.6, lado * 0.04);
      poste.position.y = 0.8;
      add(poste);
      const copa = new THREE.Mesh(UNIT_SPHERE, mats.copa);
      copa.scale.set(p.w * 0.4, 0.5, p.d * 0.4);
      copa.position.y = 1.65;
      add(copa);
      const fruto = new THREE.Mesh(UNIT_SPHERE, mats.extra);
      fruto.scale.set(0.18, 0.18, 0.18);
      fruto.position.set(p.w * 0.22, 1.4, 0);
      add(fruto, false);
      break;
    }
    default: {
      // Árvore padrão (goiaba, manga, citros, graviola/pinha)
      const alturaTronco = quadra.tipoFruteira === 'manga' ? 1.6 : 1.1;
      const tronco = new THREE.Mesh(UNIT_CYLINDER, mats.tronco);
      tronco.scale.set(lado * 0.045, alturaTronco, lado * 0.045);
      tronco.position.y = alturaTronco / 2;
      add(tronco);
      const copa = new THREE.Mesh(UNIT_SPHERE, mats.copa);
      const ry = quadra.tipoFruteira === 'manga' ? 1.5 : 1.15;
      copa.scale.set(p.w * 0.46, ry, p.d * 0.46);
      copa.position.y = alturaTronco + ry * 0.7;
      add(copa);
    }
  }

  return planta;
}

