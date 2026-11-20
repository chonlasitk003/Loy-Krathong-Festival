import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function Scene3D({
  contestants,
  selectedContestant,
  onSelectContestant,
  focusKrathongId,
  onClearFocus
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const krathongMeshesRef = useRef(new Map());
  const peopleMeshesRef = useRef([]);
  const waterMeshRef = useRef(null);
  const animationFrameId = useRef(null);
  const contestantsRef = useRef(contestants);

  // Keep contestantsRef in sync
  useEffect(() => {
    contestantsRef.current = contestants;
  }, [contestants]);

  const [hoveredName, setHoveredName] = useState(null);
  const pointerStartRef = useRef({ x: 0, y: 0, time: 0 });
  const cameraTargetPos = useRef(null);
  const controlsTargetPos = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Reset krathongs map on mount
    krathongMeshesRef.current.clear();

    // --- 1. Scene Setup ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060c18);
    scene.fog = new THREE.FogExp2(0x081329, 0.012);

    // --- 2. Camera Setup ---
    const camera = new THREE.PerspectiveCamera(
      52,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    // Positioned directly looking at the river and landing dock
    camera.position.set(0, 15, 26);
    cameraRef.current = camera;

    // --- 3. Renderer Setup ---
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    rendererRef.current = renderer;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // --- 4. OrbitControls Setup ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 1.5, 4); // Target focused on the water where krathongs float
    controls.minDistance = 5;
    controls.maxDistance = 75;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go under water
    controls.minPolarAngle = 0.15;

    // --- 5. Lighting ---
    const ambientLight = new THREE.AmbientLight(0x2a3d66, 1.2);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0xfff6e0, 2.2);
    moonLight.position.set(-25, 45, -30);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 10;
    moonLight.shadow.camera.far = 130;
    scene.add(moonLight);

    // River fill light to make water and floating items visibly luminous
    const riverLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    riverLight.position.set(15, 30, 25);
    scene.add(riverLight);

    const festivalLight = new THREE.PointLight(0xffa133, 2.5, 45, 1.2);
    festivalLight.position.set(0, 9, -7);
    scene.add(festivalLight);

    // --- 6. Sky & Moon (ดวงจันทร์) ---
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1200;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 300;
      starPositions[i + 1] = Math.random() * 90 + 15;
      starPositions[i + 2] = (Math.random() - 0.5) * 300;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.65,
      transparent: true,
      opacity: 0.85
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // Moon Sphere
    const moonGroup = new THREE.Group();
    moonGroup.position.set(-25, 40, -45);

    const moonGeo = new THREE.SphereGeometry(4.8, 32, 32);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xfffae6 });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonGroup.add(moonMesh);

    const haloGeo = new THREE.SphereGeometry(6.6, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffea9f,
      transparent: true,
      opacity: 0.28,
      side: THREE.BackSide
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    moonGroup.add(haloMesh);
    scene.add(moonGroup);

    // --- 7. River (แม่น้ำสีครามสะท้อนแสงจันทร์) ---
    const waterGeo = new THREE.PlaneGeometry(160, 90, 64, 48);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0c3b66, // Luminous deep river blue
      roughness: 0.32,
      metalness: 0.15,
      emissive: 0x052240, // Soft night water glow
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.95
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.set(0, 0, 5);
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);
    waterMeshRef.current = waterMesh;

    const posAttribute = waterGeo.attributes.position;
    const initialPositions = posAttribute.array.slice();

    // Ambient floating river lotus decorations (ดอกบัวลอยน้ำประดับฉากเพื่อความสวยงาม)
    const decoLotusList = [];
    const decoColors = [0xf472b6, 0xfacc15, 0x38bdf8, 0xc084fc];
    for (let d = 0; d < 14; d++) {
      const dGroup = new THREE.Group();
      const col = decoColors[d % decoColors.length];
      const dMat = new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 0.35,
        roughness: 0.4
      });
      for (let p = 0; p < 8; p++) {
        const ang = (p / 8) * Math.PI * 2;
        const petal = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 4), dMat);
        petal.position.set(Math.cos(ang) * 0.55, 0.15, Math.sin(ang) * 0.55);
        petal.rotation.y = -ang + Math.PI / 2;
        petal.rotation.x = 0.4;
        dGroup.add(petal);
      }
      const dCandle = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffea00 })
      );
      dCandle.position.y = 0.25;
      dGroup.add(dCandle);

      const dX = -36 + (d / 14) * 72 + (Math.sin(d * 1.7) * 3);
      const dZ = 7 + (d % 3) * 3.5;
      dGroup.position.set(dX, 0.2, dZ);
      scene.add(dGroup);
      decoLotusList.push({ group: dGroup, speed: 0.12 + (d % 5) * 0.02, seed: d * 3 });
    }

    // --- 8. Riverbanks, Promenade & Docks (ตลิ่ง ท่าน้ำ ทางเดิน) ---
    const bankGeo = new THREE.BoxGeometry(160, 4, 30);
    const bankMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.9
    });
    const riverBank = new THREE.Mesh(bankGeo, bankMat);
    riverBank.position.set(0, 1.8, -25);
    riverBank.receiveShadow = true;
    scene.add(riverBank);

    const walkGeo = new THREE.BoxGeometry(160, 0.4, 12);
    const walkMat = new THREE.MeshStandardMaterial({
      color: 0x374151,
      roughness: 0.8
    });
    const walkMesh = new THREE.Mesh(walkGeo, walkMat);
    walkMesh.position.set(0, 3.9, -14);
    walkMesh.receiveShadow = true;
    scene.add(walkMesh);

    // Wooden piers
    [-22, 0, 22].forEach((xPos) => {
      const pierGeo = new THREE.BoxGeometry(7, 0.5, 9);
      const pierMat = new THREE.MeshStandardMaterial({
        color: 0x78350f,
        roughness: 0.7
      });
      const pier = new THREE.Mesh(pierGeo, pierMat);
      pier.position.set(xPos, 3.5, -6.5);
      pier.castShadow = true;
      pier.receiveShadow = true;
      scene.add(pier);

      [-3, 3].forEach((postX) => {
        [-3.5, 3.5].forEach((postZ) => {
          const postGeo = new THREE.CylinderGeometry(0.18, 0.18, 4.5, 8);
          const postMat = new THREE.MeshStandardMaterial({ color: 0x451a03 });
          const post = new THREE.Mesh(postGeo, postMat);
          post.position.set(xPos + postX, 1.7, -6.5 + postZ);
          scene.add(post);
        });
      });

      const lanternGeo = new THREE.SphereGeometry(0.45, 16, 16);
      const lanternMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const lantern = new THREE.Mesh(lanternGeo, lanternMat);
      lantern.position.set(xPos, 5.2, -3);
      scene.add(lantern);

      const lLight = new THREE.PointLight(0xf59e0b, 2.0, 14);
      lLight.position.set(xPos, 5.0, -3);
      scene.add(lLight);
    });

    // --- 9. Thai Temple (วัด) ---
    function buildThaiTemple(x, y, z) {
      const templeGroup = new THREE.Group();
      templeGroup.position.set(x, y, z);

      const baseGeo = new THREE.BoxGeometry(22, 2.5, 16);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.5 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 1.25;
      base.castShadow = true;
      base.receiveShadow = true;
      templeGroup.add(base);

      const hallGeo = new THREE.BoxGeometry(18, 7, 12);
      const hallMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.6 });
      const hall = new THREE.Mesh(hallGeo, hallMat);
      hall.position.y = 6;
      hall.castShadow = true;
      hall.receiveShadow = true;
      templeGroup.add(hall);

      for (let cx = -8; cx <= 8; cx += 4) {
        [-5.5, 5.5].forEach((cz) => {
          const colGeo = new THREE.CylinderGeometry(0.35, 0.4, 7, 12);
          const colMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
          const col = new THREE.Mesh(colGeo, colMat);
          col.position.set(cx, 6, cz);
          col.castShadow = true;
          templeGroup.add(col);
        });
      }

      const roofColors = [0xb91c1c, 0xd97706];
      const tiers = [
        { w: 22, d: 15, h: 2.2, y: 10 },
        { w: 18, d: 12, h: 2.2, y: 11.8 },
        { w: 14, d: 9, h: 2.2, y: 13.5 }
      ];

      tiers.forEach((tier, idx) => {
        const roofGeo = new THREE.ConeGeometry(tier.w * 0.55, tier.h, 4);
        roofGeo.rotateY(Math.PI / 4);
        const roofMat = new THREE.MeshStandardMaterial({
          color: roofColors[idx % 2],
          roughness: 0.4
        });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = tier.y;
        roof.scale.set(1.4, 1, 0.85);
        roof.castShadow = true;
        templeGroup.add(roof);

        [-1, 1].forEach((dir) => {
          const chofahGeo = new THREE.ConeGeometry(0.2, 1.2, 6);
          const chofahMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.7 });
          const chofah = new THREE.Mesh(chofahGeo, chofahMat);
          chofah.position.set(dir * (tier.w * 0.48), tier.y + 0.6, 0);
          chofah.rotation.z = -dir * 0.4;
          templeGroup.add(chofah);
        });
      });

      const templeLight = new THREE.PointLight(0xfef08a, 2.5, 20);
      templeLight.position.set(0, 5, 6.5);
      templeGroup.add(templeLight);

      scene.add(templeGroup);
    }
    buildThaiTemple(-26, 3.8, -26);

    // --- 10. Thai Pagoda / Golden Stupa (เจดีย์ทองคำ) ---
    function buildThaiPagoda(x, y, z) {
      const pagodaGroup = new THREE.Group();
      pagodaGroup.position.set(x, y, z);

      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        metalness: 0.85,
        roughness: 0.25
      });

      const base1 = new THREE.Mesh(new THREE.CylinderGeometry(8, 9, 2, 8), goldMat);
      base1.position.y = 1;
      base1.castShadow = true;
      pagodaGroup.add(base1);

      const base2 = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 7.5, 2, 8), goldMat);
      base2.position.y = 3;
      base2.castShadow = true;
      pagodaGroup.add(base2);

      const base3 = new THREE.Mesh(new THREE.CylinderGeometry(5, 6, 1.8, 8), goldMat);
      base3.position.y = 4.8;
      base3.castShadow = true;
      pagodaGroup.add(base3);

      const bell = new THREE.Mesh(new THREE.SphereGeometry(4.2, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), goldMat);
      bell.position.y = 5.2;
      bell.castShadow = true;
      pagodaGroup.add(bell);

      const throne = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.2, 3.2), goldMat);
      throne.position.y = 8.8;
      pagodaGroup.add(throne);

      for (let i = 0; i < 7; i++) {
        const r = 1.3 - i * 0.16;
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r, 0.4, 16), goldMat);
        ring.position.y = 9.6 + i * 0.45;
        pagodaGroup.add(ring);
      }

      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.3, 3.2, 16), goldMat);
      tip.position.y = 14;
      tip.castShadow = true;
      pagodaGroup.add(tip);

      const pagodaSpot = new THREE.SpotLight(0xffe875, 4, 35, Math.PI / 4, 0.3);
      pagodaSpot.position.set(x + 12, y + 2, z + 12);
      pagodaSpot.target = pagodaGroup;
      scene.add(pagodaSpot);

      scene.add(pagodaGroup);
    }
    buildThaiPagoda(28, 3.8, -26);

    // --- 11. Thai Traditional Houses (บ้านเรือนไทยริมน้ำ 2 หลัง) ---
    function buildThaiHouse(x, y, z, rotY = 0) {
      const houseGroup = new THREE.Group();
      houseGroup.position.set(x, y, z);
      houseGroup.rotation.y = rotY;

      const woodDark = new THREE.MeshStandardMaterial({ color: 0x5c2b14, roughness: 0.8 });
      const woodLight = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.7 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.5 });

      for (let sx = -3.5; sx <= 3.5; sx += 3.5) {
        for (let sz = -3; sz <= 3; sz += 3) {
          const stilt = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3, 8), woodDark);
          stilt.position.set(sx, 1.5, sz);
          stilt.castShadow = true;
          houseGroup.add(stilt);
        }
      }

      const floor = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.4, 7.5), woodDark);
      floor.position.y = 3;
      floor.castShadow = true;
      floor.receiveShadow = true;
      houseGroup.add(floor);

      const walls = new THREE.Mesh(new THREE.BoxGeometry(6.5, 3.5, 5.5), woodLight);
      walls.position.set(0, 4.8, 0);
      walls.castShadow = true;
      houseGroup.add(walls);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(6, 3, 4), roofMat);
      roof.position.y = 7.5;
      roof.scale.set(1.4, 0.9, 0.9);
      roof.rotateY(Math.PI / 4);
      roof.castShadow = true;
      houseGroup.add(roof);

      const lanternMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xf97316 })
      );
      lanternMesh.position.set(2.5, 4.5, 3);
      houseGroup.add(lanternMesh);

      const hLight = new THREE.PointLight(0xf97316, 1.8, 14);
      hLight.position.set(2.5, 4.2, 3);
      houseGroup.add(hLight);

      scene.add(houseGroup);
    }
    buildThaiHouse(-6, 3.8, -25, 0.08);
    buildThaiHouse(8, 3.8, -24, -0.1);

    // --- 12. Walking / Festival People (ผู้คน 20 คน) ---
    const peopleList = [];
    const thaiClothColors = [
      0xf43f5e, 0xec4899, 0xa855f7, 0x3b82f6, 0x06b6d4,
      0x10b981, 0xeab308, 0xf97316, 0xfacc15, 0x6366f1
    ];

    for (let p = 0; p < 20; p++) {
      const personGroup = new THREE.Group();

      const clothColor = thaiClothColors[p % thaiClothColors.length];
      const bodyMat = new THREE.MeshStandardMaterial({ color: clothColor, roughness: 0.6 });
      const bodyGeo = new THREE.CylinderGeometry(0.28, 0.38, 1.3, 10);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 1.3;
      body.castShadow = true;
      personGroup.add(body);

      const skinMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.8 });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), skinMat);
      head.position.y = 2.15;
      head.castShadow = true;
      personGroup.add(head);

      const hairMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), hairMat);
      hair.position.y = 2.22;
      personGroup.add(hair);

      const legGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.85, 8);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
      const leftLeg = new THREE.Mesh(legGeo, legMat);
      leftLeg.position.set(-0.15, 0.45, 0);
      const rightLeg = new THREE.Mesh(legGeo, legMat);
      rightLeg.position.set(0.15, 0.45, 0);
      personGroup.add(leftLeg);
      personGroup.add(rightLeg);

      const isPier = p < 6;
      let initX, initZ, dir;

      if (isPier) {
        const pierX = [-22, 0, 22][p % 3];
        initX = pierX + (Math.random() - 0.5) * 3;
        initZ = -6 + (Math.random() - 0.5) * 2;
        dir = 0;
      } else {
        initX = -40 + ((p - 6) / 14) * 80 + (Math.random() - 0.5) * 4;
        initZ = -14 + (Math.random() - 0.5) * 4;
        dir = (p % 2 === 0 ? 1 : -1);
      }

      personGroup.position.set(initX, 3.9, initZ);
      personGroup.rotation.y = dir === 1 ? Math.PI / 2 : (dir === -1 ? -Math.PI / 2 : 0);
      scene.add(personGroup);

      peopleList.push({
        group: personGroup,
        leftLeg,
        rightLeg,
        isPier,
        dir,
        speed: 0.02 + Math.random() * 0.015,
        walkCycle: Math.random() * 10
      });
    }
    peopleMeshesRef.current = peopleList;

    // --- 13. Krathong Creation Engine ---
    window.__createSingleKrathong = function(contestant) {
      if (krathongMeshesRef.current.has(contestant.id)) return;

      const kGroup = new THREE.Group();
      kGroup.name = `krathong-${contestant.id}`;
      kGroup.userData = { contestantId: contestant.id };

      // Base (หยวกกล้วยฐานกระทง - ใหญ่เด่นชัด)
      const baseGeo = new THREE.CylinderGeometry(1.6, 1.35, 0.45, 24);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x15803d, // Banana leaf green
        roughness: 0.5
      });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.22;
      base.castShadow = true;
      base.receiveShadow = true;
      kGroup.add(base);

      // Petals ring (กลีบกระทงพับวิจิตร เรืองแสงสวยงามยามค่ำคืน)
      const petalHex = contestant.krathongColor || '#f472b6';
      const petalColor = new THREE.Color(petalHex);
      const petalMat = new THREE.MeshStandardMaterial({
        color: petalColor,
        emissive: petalColor,
        emissiveIntensity: 0.35,
        roughness: 0.3
      });

      const petalCount = 14;
      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
        const petalGeo = new THREE.ConeGeometry(0.42, 1.0, 4);
        petalGeo.rotateZ(Math.PI / 4);
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.position.set(Math.cos(angle) * 1.5, 0.5, Math.sin(angle) * 1.5);
        petal.rotation.y = -angle + Math.PI / 2;
        petal.rotation.x = 0.35;
        petal.castShadow = true;
        kGroup.add(petal);
      }

      // Inner flowers bed (ดอกไม้สีสดใส)
      const flowerGeo = new THREE.SphereGeometry(0.22, 8, 8);
      const flowerMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xfacc15,
        emissiveIntensity: 0.25,
        roughness: 0.5
      });
      for (let f = 0; f < 8; f++) {
        const fAngle = (f / 8) * Math.PI * 2;
        const flower = new THREE.Mesh(flowerGeo, flowerMat);
        flower.position.set(Math.cos(fAngle) * 0.7, 0.48, Math.sin(fAngle) * 0.7);
        kGroup.add(flower);
      }

      // Joss sticks (ธูป 3 ดอก)
      const jossMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      [-0.15, 0, 0.15].forEach((jx, idx) => {
        const joss = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.3, 6), jossMat);
        joss.position.set(jx, 1.05, -0.2);
        joss.rotation.z = (idx - 1) * 0.08;
        kGroup.add(joss);
      });

      // Candle (เทียน 1 เล่ม)
      const candleMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.3 });
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.0, 10), candleMat);
      candle.position.set(0, 0.85, 0.1);
      kGroup.add(candle);

      // Flickering Candle Flame (เปลวเทียนสีทองเรืองรอง)
      const candleHex = contestant.candleColor || '#fbbf24';
      const flameMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(candleHex)
      });
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.45, 8), flameMat);
      flame.position.set(0, 1.5, 0.1);
      flame.name = 'candle-flame';
      kGroup.add(flame);

      // Candle Glow PointLight
      const candleLight = new THREE.PointLight(
        new THREE.Color(candleHex),
        2.5,
        10,
        1.6
      );
      candleLight.position.set(0, 1.5, 0.1);
      candleLight.name = 'candle-light';
      kGroup.add(candleLight);

      // Golden Beacon & Pin (เสาแสงสีทองระบุตำแหน่งชัดเจน)
      const beaconGroup = new THREE.Group();

      // Pulsing Golden Ring on water
      const ringGeo = new THREE.RingGeometry(1.8, 2.1, 32);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      const beaconRing = new THREE.Mesh(ringGeo, ringMat);
      beaconRing.position.y = 0.2;
      beaconRing.name = 'beacon-ring';
      beaconGroup.add(beaconRing);

      // Golden Pillar Light Beam
      const rayGeo = new THREE.CylinderGeometry(0.06, 0.35, 4.5, 12);
      const rayMat = new THREE.MeshBasicMaterial({
        color: 0xfde047,
        transparent: true,
        opacity: 0.75
      });
      const beaconRay = new THREE.Mesh(rayGeo, rayMat);
      beaconRay.position.y = 3.6;
      beaconGroup.add(beaconRay);

      // Floating Diamond on top
      const diamondGeo = new THREE.OctahedronGeometry(0.45, 0);
      const diamondMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.9
      });
      const diamond = new THREE.Mesh(diamondGeo, diamondMat);
      diamond.position.y = 6.0;
      diamond.name = 'beacon-diamond';
      beaconGroup.add(diamond);

      kGroup.add(beaconGroup);

      // Hitbox for raycasting
      const hitBoxGeo = new THREE.CylinderGeometry(2.4, 2.4, 3.0, 16);
      const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
      hitBox.position.y = 1.2;
      hitBox.userData = { contestantId: contestant.id };
      kGroup.add(hitBox);

      // Calculate distinct natural dispersion across the river
      let seed = 0;
      for (let i = 0; i < (contestant.id || '').length; i++) {
        seed = (seed * 31 + contestant.id.charCodeAt(i)) % 10000;
      }

      const existingIndex = krathongMeshesRef.current.size;

      // Spacing: staggered across river width (X: from -24 to +24 with generous separation)
      const posX = ((existingIndex * 14 + (seed % 9) * 2.5) % 52) - 26;
      // Stagger depth on Z: between z = 2.5 (near docks) and z = 11.5 (mid-river)
      const baseZ = 2.5 + ((existingIndex * 3.2 + (seed % 5) * 1.6) % 9);

      kGroup.position.set(posX, 0.28, baseZ);

      scene.add(kGroup);
      krathongMeshesRef.current.set(contestant.id, {
        group: kGroup,
        speed: 0.18 + ((seed % 8) * 0.015),
        baseZ,
        seed,
        flame,
        candleLight,
        hitBox,
        beaconGroup
      });

      return kGroup;
    };

    // Spawn current contestants
    contestantsRef.current.forEach((c) => {
      window.__createSingleKrathong(c);
    });

    // --- 14. Raycasting for Touch & Click ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onPointerDown(event) {
      const clientX = event.clientX ?? (event.touches && event.touches[0]?.clientX);
      const clientY = event.clientY ?? (event.touches && event.touches[0]?.clientY);
      if (clientX === undefined || clientY === undefined) return;

      pointerStartRef.current = {
        x: clientX,
        y: clientY,
        time: Date.now()
      };
    }

    function onPointerUp(event) {
      const clientX = event.clientX ?? (event.changedTouches && event.changedTouches[0]?.clientX);
      const clientY = event.clientY ?? (event.changedTouches && event.changedTouches[0]?.clientY);
      if (clientX === undefined || clientY === undefined) return;

      const dx = clientX - pointerStartRef.current.x;
      const dy = clientY - pointerStartRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const elapsed = Date.now() - pointerStartRef.current.time;

      if (dist > 8 || elapsed > 450) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const candidateMeshes = [];
      krathongMeshesRef.current.forEach((item) => {
        if (item.hitBox) candidateMeshes.push(item.hitBox);
      });

      const intersects = raycaster.intersectObjects(candidateMeshes, false);
      if (intersects.length > 0) {
        const hit = intersects[0];
        const contestantId = hit.object.userData.contestantId;
        const target = contestantsRef.current.find((c) => c.id === contestantId);
        if (target) {
          onSelectContestant(target);
        }
      }
    }

    function onPointerMove(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const candidateMeshes = [];
      krathongMeshesRef.current.forEach((item) => {
        if (item.hitBox) candidateMeshes.push(item.hitBox);
      });

      const intersects = raycaster.intersectObjects(candidateMeshes, false);
      if (intersects.length > 0) {
        renderer.domElement.style.cursor = 'pointer';
        const cId = intersects[0].object.userData.contestantId;
        const found = contestantsRef.current.find((c) => c.id === cId);
        if (found) setHoveredName(found.name);
      } else {
        renderer.domElement.style.cursor = 'grab';
        setHoveredName(null);
      }
    }

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('pointermove', onPointerMove);

    // --- 15. Resize Handler ---
    function handleResize() {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener('resize', handleResize);

    // --- 16. Animation Loop ---
    let clock = new THREE.Clock();

    function animate() {
      animationFrameId.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera transition if target is requested
      if (cameraTargetPos.current && controlsTargetPos.current) {
        camera.position.lerp(cameraTargetPos.current, 0.06);
        controls.target.lerp(controlsTargetPos.current, 0.06);

        if (camera.position.distanceTo(cameraTargetPos.current) < 0.2) {
          cameraTargetPos.current = null;
          controlsTargetPos.current = null;
        }
      }

      controls.update();

      // Water wave ripple (displacing Y coordinate)
      if (waterMeshRef.current) {
        const positions = waterGeo.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
          const u = initialPositions[i];
          const v = initialPositions[i + 2];
          positions[i + 1] =
            Math.sin(u * 0.4 + elapsedTime * 1.8) * 0.12 +
            Math.cos(v * 0.3 + elapsedTime * 1.5) * 0.1;
        }
        waterGeo.attributes.position.needsUpdate = true;
      }

      // Decorative floating lotus water blossoms animation
      decoLotusList.forEach((deco) => {
        deco.group.position.x += deco.speed * 0.03;
        if (deco.group.position.x > 38) deco.group.position.x = -38;
        deco.group.position.y = 0.2 + Math.sin(elapsedTime * 1.8 + deco.seed) * 0.05;
        deco.group.rotation.y += 0.003;
      });

      // Krathong drift & natural spreading animations
      krathongMeshesRef.current.forEach((item, id) => {
        const grp = item.group;
        grp.position.x += item.speed * 0.035;

        if (grp.position.x > 38) {
          grp.position.x = -38;
        }

        const seed = item.seed || parseInt(id.replace(/\D/g, '') || '1', 10);
        // Water wave bobbing
        grp.position.y = 0.28 + Math.sin(elapsedTime * 2.0 + seed) * 0.07;
        // Meandering sway along river depth (Z axis) keeping them naturally separated
        const baseZ = item.baseZ || 4;
        grp.position.z = baseZ + Math.sin(elapsedTime * 0.35 + seed) * 1.3;

        // Gentle tilt and slow organic yaw rotation in river water
        grp.rotation.z = Math.sin(elapsedTime * 1.5 + seed) * 0.035;
        grp.rotation.x = Math.cos(elapsedTime * 1.3 + seed) * 0.025;
        grp.rotation.y += 0.002;

        if (item.flame) {
          const flicker = 0.9 + Math.sin(elapsedTime * 12 + seed) * 0.18;
          item.flame.scale.set(flicker, flicker * 1.1, flicker);
        }
        if (item.candleLight) {
          item.candleLight.intensity = 2.2 + Math.sin(elapsedTime * 10 + seed) * 0.6;
        }

        if (item.beaconGroup) {
          const diamond = item.beaconGroup.getObjectByName('beacon-diamond');
          if (diamond) {
            diamond.rotation.y += 0.03;
            diamond.position.y = 6.0 + Math.sin(elapsedTime * 3) * 0.3;
          }
          const ring = item.beaconGroup.getObjectByName('beacon-ring');
          if (ring) {
            const s = 1.0 + Math.sin(elapsedTime * 3.5) * 0.18;
            ring.scale.set(s, s, s);
          }
        }
      });

      // People walk animations
      peopleMeshesRef.current.forEach((p) => {
        if (!p.isPier) {
          p.walkCycle += p.speed * 4;
          p.group.position.x += p.dir * p.speed;

          p.leftLeg.rotation.x = Math.sin(p.walkCycle) * 0.55;
          p.rightLeg.rotation.x = -Math.sin(p.walkCycle) * 0.55;

          if (p.group.position.x > 42) {
            p.dir = -1;
            p.group.rotation.y = -Math.PI / 2;
          } else if (p.group.position.x < -42) {
            p.dir = 1;
            p.group.rotation.y = Math.PI / 2;
          }
        }
      });

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('pointermove', onPointerMove);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      krathongMeshesRef.current.clear();
    };
  }, []); // Run on mount

  // Sync scene meshes whenever contestants list updates
  useEffect(() => {
    if (!sceneRef.current || !window.__createSingleKrathong) return;
    const scene = sceneRef.current;

    const currentIds = new Set(contestants.map((c) => c.id));

    // 1. Remove meshes that are no longer in contestants
    krathongMeshesRef.current.forEach((item, id) => {
      if (!currentIds.has(id)) {
        scene.remove(item.group);
        krathongMeshesRef.current.delete(id);
      }
    });

    // 2. Add newly arrived contestants
    contestants.forEach((c) => {
      if (!krathongMeshesRef.current.has(c.id)) {
        window.__createSingleKrathong(c);
      }
    });
  }, [contestants]);

  // Handle camera focus
  useEffect(() => {
    if (!focusKrathongId || !cameraRef.current || !controlsRef.current) return;

    const item = krathongMeshesRef.current.get(focusKrathongId);
    if (item && item.group) {
      const pos = item.group.position;
      cameraTargetPos.current = new THREE.Vector3(pos.x, pos.y + 6, pos.z + 12);
      controlsTargetPos.current = new THREE.Vector3(pos.x, pos.y + 1, pos.z);

      if (onClearFocus) {
        setTimeout(onClearFocus, 1000);
      }
    }
  }, [focusKrathongId, onClearFocus]);

  return (
    <div className="relative w-full h-full select-none">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Hover tooltip */}
      {hoveredName && (
        <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-amber-400 text-amber-200 text-sm font-medium shadow-xl transition-all animate-bounce flex items-center gap-1.5">
          <span>🪷 แตะเพื่อเปิดดู:</span>
          <span className="text-white font-bold">{hoveredName}</span>
        </div>
      )}

      {/* 3D Navigation Guide Pill */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/10 text-xs text-slate-300">
        <span>🖱️ ลากเพื่อหมุนฉาก</span>
        <span>•</span>
        <span>🔍 ซูมเข้า-ออก</span>
        <span>•</span>
        <span>🪷 แตะที่กระทงเพื่อเปิดโหวต</span>
      </div>
    </div>
  );
}
