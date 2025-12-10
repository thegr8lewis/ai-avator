import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'https://cdn.jsdelivr.net/npm/meshoptimizer@0.20.0/meshopt_decoder.module.js';

export async function loadAvatar(url) {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });

  const model = gltf.scene;
  let mixer = null;
  if (gltf.animations && gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(model);
    const action = mixer.clipAction(gltf.animations[0]);
    action.play();
  }

  // Collect targets and bones
  const lipSyncTargets = [];
  const visemeTargets = []; // { mesh, indices: { A,E,I,O,U,MBP }, jawIndex? }
  const blinkTargets = [];
  let headBone = null, neckBone = null, chestBone = null, spineBone = null;
  let jawBone = null; // For fallback lip sync via jaw rotation
  let leftEyeBone = null, rightEyeBone = null;
  let leftUpperArm = null, rightUpperArm = null;
  let leftLowerArm = null, rightLowerArm = null;
  let leftHand = null, rightHand = null;

  model.traverse((obj) => {
    if (obj.isMesh && obj.morphTargetDictionary && obj.morphTargetInfluences) {
      const dict = obj.morphTargetDictionary;
      console.log('👄 Found mesh with morph targets:', obj.name, 'Targets:', Object.keys(dict));
      let idx = dict.jawOpen ?? dict.JawOpen ?? dict.mouthOpen ?? dict.MouthOpen;
      if (idx === undefined) {
        const keys = Object.keys(dict);
        const k = keys.find((n) => n.toLowerCase().includes('jaw'))
          || keys.find((n) => n.toLowerCase().includes('mouth'))
          || keys.find((n) => n.toLowerCase().includes('viseme_aa'))
          || keys.find((n) => n.toLowerCase().includes('viseme_oh'))
          || keys[0];
        if (k !== undefined) idx = dict[k];
      }
      if (idx !== undefined) {
        lipSyncTargets.push({ mesh: obj, index: idx });
        console.log('✅ Lip sync target added for mesh:', obj.name, 'using morph index:', idx);
      }

      // Try to map common viseme names (VRM/ARKit-like)
      const keys = Object.keys(dict);
      const findKey = (preds) => {
        const k = keys.find(name => preds.some(p => p.test(name)));
        return k !== undefined ? dict[k] : undefined;
      };
      const indices = {
        A: findKey([/viseme_aa/i, /A_/i, /^A$/i, /phoneme[_-]?a/i]),
        E: findKey([/viseme_e/i, /^E$/i, /phoneme[_-]?e/i]),
        I: findKey([/viseme_ih/i, /viseme_ee/i, /^I$/i, /phoneme[_-]?i/i]),
        O: findKey([/viseme_oh/i, /^O$/i, /phoneme[_-]?o/i]),
        U: findKey([/viseme_ou/i, /^U$/i, /phoneme[_-]?u/i, /w[_-]?round/i]),
        MBP: findKey([/viseme_mbp/i, /viseme_PP/i, /viseme_b/i, /^M$|^B$|^P$/i, /closed[_-]?mouth/i])
      };
      const anyVis = Object.values(indices).some(v => v !== undefined);
      if (anyVis) {
        visemeTargets.push({ mesh: obj, indices, jawIndex: idx });
      }

      const dkeys = Object.keys(dict);
      const leftName = dkeys.find(n => /eye.?blink.*(left|l)/i.test(n))
        || dkeys.find(n => /blink.*(left|l)/i.test(n))
        || dkeys.find(n => /eyeBlinkLeft/i.test(n));
      const rightName = dkeys.find(n => /eye.?blink.*(right|r)/i.test(n))
        || dkeys.find(n => /blink.*(right|r)/i.test(n))
        || dkeys.find(n => /eyeBlinkRight/i.test(n));
      const leftIndex = leftName !== undefined ? dict[leftName] : undefined;
      const rightIndex = rightName !== undefined ? dict[rightName] : undefined;
      if (leftIndex !== undefined || rightIndex !== undefined) {
        blinkTargets.push({ mesh: obj, leftIndex, rightIndex });
      }
    }

    if (obj.isBone) {
      const name = obj.name.toLowerCase();
      
      if (!headBone && name.includes('head')) headBone = obj;
      else if (!neckBone && name.includes('neck')) neckBone = obj;
      else if (!chestBone && (name.includes('chest') || name.includes('upperchest'))) chestBone = obj;
      else if (!spineBone && name.includes('spine')) spineBone = obj;
      // Try multiple patterns for jaw bone
      if (!jawBone && (name.includes('jaw') || name.includes('chin') || name.includes('mandible') || name === 'j_jaw' || name === 'jaw_bone')) jawBone = obj;
      if (!leftEyeBone && (name.includes('eye_l') || name.includes('leye') || (name.includes('eye') && name.includes('left')))) leftEyeBone = obj;
      if (!rightEyeBone && (name.includes('eye_r') || name.includes('reye') || (name.includes('eye') && name.includes('right')))) rightEyeBone = obj;
      if (!leftUpperArm && (name.includes('upperarm_l') || name.includes('leftarm') || name.includes('arm_l'))) leftUpperArm = obj;
      if (!rightUpperArm && (name.includes('upperarm_r') || name.includes('rightarm') || name.includes('arm_r'))) rightUpperArm = obj;
      if (!leftLowerArm && (name.includes('lowerarm_l') || name.includes('forearm_l'))) leftLowerArm = obj;
      if (!rightLowerArm && (name.includes('lowerarm_r') || name.includes('forearm_r'))) rightLowerArm = obj;
      if (!leftHand && (name.includes('hand_l') || (name.includes('hand') && name.includes('left')))) leftHand = obj;
      if (!rightHand && (name.includes('hand_r') || (name.includes('hand') && name.includes('right')))) rightHand = obj;
    }
  });

  console.log('📊 Avatar loaded - Lip sync targets:', lipSyncTargets.length, 'Viseme targets:', visemeTargets.length, 'Blink targets:', blinkTargets.length);
  console.log('🦴 Bones found - Head:', !!headBone, 'Jaw:', !!jawBone, 'Neck:', !!neckBone);
  
  if (lipSyncTargets.length === 0 && visemeTargets.length === 0) {
    if (jawBone) {
      console.log('⚠️ No morph targets found, will use jaw bone rotation for lip sync');
    } else if (headBone) {
      console.log('⚠️ No morph targets or jaw bone found, will use head tilt for lip sync (limited effect)');
    } else {
      console.warn('❌ No lip sync method available - no morph targets, jaw bone, or head bone found');
    }
  }
  
  return {
    model,
    mixer,
    lipSyncTargets,
    visemeTargets,
    blinkTargets,
    bones: {
      headBone, neckBone, chestBone, spineBone,
      jawBone,
      leftEyeBone, rightEyeBone,
      leftUpperArm, rightUpperArm,
      leftLowerArm, rightLowerArm,
      leftHand, rightHand
    }
  };
}

// High-level controller that owns avatar state and per-frame updates
export function initAvatar({ scene, camera, url, lipSync, enableProceduralGestures = false, gestureUrl = null }) {
  let controllerModel = null;
  let controllerMixer = null;
  let baseY = 0;
  let gestureAction = null;
  let gestureTargetWeight = 0;
  let gestureCurrentWeight = 0;
  let timeBase = Math.random() * 1000;

  // Targets and bones
  let lipSyncTargets = [];
  let visemeTargets = [];
  let blinkTargets = [];
  let headBone = null, neckBone = null, chestBone = null, spineBone = null;
  let jawBone = null;
  let leftEyeBone = null, rightEyeBone = null;
  let leftUpperArm = null, rightUpperArm = null;
  let leftLowerArm = null, rightLowerArm = null;
  let leftHand = null, rightHand = null;

  const gazeTarget = new THREE.Vector3(0, 1.6, 2.5);
  let nextSaccadeAt = 0;
  let blinkPhase = 0;
  let blinking = false;
  let nextBlinkAt = 0;
  let lipT = 0;

  const tmpV = new THREE.Vector3();
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const damp = (current, target, lambda, dt) => lerp(current, target, 1 - Math.exp(-lambda * dt));

  function setMouth(value) { 
    if (lipSyncTargets.length === 0) return;
    for (const t of lipSyncTargets) {
      t.mesh.morphTargetInfluences[t.index] = value;
    }
  }
  function clearVisemes() {
    for (const vt of visemeTargets) {
      const inf = vt.mesh.morphTargetInfluences;
      const idxs = vt.indices;
      for (const k of ['A','E','I','O','U','MBP']) {
        const idx = idxs[k];
        if (idx !== undefined) inf[idx] = 0;
      }
      if (vt.jawIndex !== undefined) inf[vt.jawIndex] = 0;
    }
  }
  function applyViseme(name, strength = 1) {
    for (const vt of visemeTargets) {
      const inf = vt.mesh.morphTargetInfluences;
      const idxs = vt.indices;
      // zero others
      for (const k of ['A','E','I','O','U','MBP']) {
        const idx = idxs[k];
        if (idx !== undefined) inf[idx] = 0;
      }
      // set current
      const targetIdx = idxs[name];
      if (targetIdx !== undefined) {
        inf[targetIdx] = strength;
      } else if (vt.jawIndex !== undefined) {
        // fallback to jaw open
        inf[vt.jawIndex] = strength * 0.7;
      }
    }
  }
  function setBlink(left, right) {
    for (const bt of blinkTargets) {
      if (bt.leftIndex !== undefined && bt.leftIndex !== null && bt.leftIndex >= 0) bt.mesh.morphTargetInfluences[bt.leftIndex] = left;
      if (bt.rightIndex !== undefined && bt.rightIndex !== null && bt.rightIndex >= 0) bt.mesh.morphTargetInfluences[bt.rightIndex] = right;
    }
  }

  function filterClipToUpperBody(clip) {
    if (!clip) return null;
    const include = /shoulder|upperarm|lowerarm|forearm|hand|thumb|index|middle|ring|pinky/i;
    const tracks = clip.tracks.filter(tr => include.test(tr.name));
    if (tracks.length === 0) return null;
    return new THREE.AnimationClip(clip.name + '_upper', clip.duration, tracks);
  }

  function tryLoadGestureAnimation(url) {
    try {
      const gestureLoader = new GLTFLoader();
      gestureLoader.setMeshoptDecoder(MeshoptDecoder);
      gestureLoader.load(url, (gltf) => {
        if (!gltf.animations || gltf.animations.length === 0) return;
        const filtered = filterClipToUpperBody(gltf.animations[0]);
        if (!filtered) return;
        if (!controllerMixer) controllerMixer = new THREE.AnimationMixer(controllerModel);
        gestureAction = controllerMixer.clipAction(filtered, controllerModel);
        gestureAction.setLoop(THREE.LoopRepeat, Infinity);
        gestureAction.clampWhenFinished = false;
        gestureAction.enabled = true;
        gestureAction.play();
        gestureAction.setEffectiveWeight(0.0);
      });
    } catch {}
  }

  async function load() {
    const loaded = await loadAvatar(url);
    controllerModel = loaded.model;
    controllerMixer = loaded.mixer;
    lipSyncTargets = loaded.lipSyncTargets;
    visemeTargets = loaded.visemeTargets || [];
    blinkTargets = loaded.blinkTargets;
    ({ headBone, neckBone, chestBone, spineBone, jawBone, leftEyeBone, rightEyeBone, leftUpperArm, rightUpperArm, leftLowerArm, rightLowerArm, leftHand, rightHand } = loaded.bones);

    controllerModel.position.set(0, 0, 0);
    scene.add(controllerModel);
    controllerModel.position.set(0, -1.5, 0);
    camera.position.set(0, 0.3, 4.5);
    camera.lookAt(0, -0.2, 0);
    camera.near = 0.1;
    camera.far = 100;
    camera.updateProjectionMatrix();
    setMouth(0); setBlink(0, 0); baseY = controllerModel.position.y;
    if (gestureUrl) tryLoadGestureAnimation(gestureUrl);
  }

  function update(dt) {
    if (!controllerModel) return;
    if (controllerMixer) controllerMixer.update(dt);
    const t = performance.now() * 0.001;
    controllerModel.position.y = baseY + Math.sin(t * 1.2) * 0.008;
    controllerModel.rotation.y = Math.sin((t + Math.random()) * 0.4) * 0.02;
    controllerModel.rotation.x = Math.sin(t * 0.33) * 0.01;
    const breath = (Math.sin(t * 0.5) * 0.5 + 0.5) * 0.04;
    if (chestBone) { chestBone.position.y = damp(chestBone.position.y, breath * 0.01, 10, dt); chestBone.scale.y = 1 + breath; }
    
    // Lip sync / viseme application
    if (lipSync) {
      if (lipSync.active) {
        // If we have a current viseme name, apply it; else fallback to jaw oscillation
        if (lipSync.currentViseme && visemeTargets.length > 0) {
          // Tie strength to intensity
          const strength = Math.max(0, Math.min(1, 0.6 + 0.4 * (lipSync.intensity || 0)));
          applyViseme(lipSync.currentViseme, strength);
        } else if (lipSyncTargets.length > 0) {
          lipSync.t = (lipSync.t || 0) + dt;
          lipSync.intensity = Math.max(0, (lipSync.intensity || 0) - dt * 1.5);
          const osc = Math.abs(Math.sin(lipSync.t * 12));
          const mouth = Math.min(1, (0.1 + osc * 0.9) * (0.25 + lipSync.intensity));
          setMouth(mouth);
        } else if (jawBone) {
          // Fallback: Use jaw bone rotation when no morph targets available
          lipSync.t = (lipSync.t || 0) + dt;
          lipSync.intensity = Math.max(0, (lipSync.intensity || 0) - dt * 1.5);
          const osc = Math.abs(Math.sin(lipSync.t * 12));
          const jawRotation = (0.1 + osc * 0.9) * (0.25 + lipSync.intensity) * 0.3; // Max 0.3 radians (~17 degrees)
          jawBone.rotation.z = damp(jawBone.rotation.z, jawRotation, 15, dt);
        } else if (headBone) {
          // Last resort: Use subtle head movement to indicate speech
          lipSync.t = (lipSync.t || 0) + dt;
          lipSync.intensity = Math.max(0, (lipSync.intensity || 0) - dt * 1.5);
          const osc = Math.abs(Math.sin(lipSync.t * 12));
          const extraTilt = (0.1 + osc * 0.9) * (0.25 + lipSync.intensity) * 0.08; // Subtle head tilt
          // This adds to the existing head animation
        }
      } else {
        // Ensure mouth/visemes are reset when not speaking
        clearVisemes();
        setMouth(0);
        if (jawBone) {
          jawBone.rotation.z = damp(jawBone.rotation.z, 0, 15, dt);
        }
      }
    }
    
    const speakAmp = lipSync?.intensity || 0;
    const tilt = 0.02 * Math.sin(t * 0.7);
    if (headBone) {
      // Enhanced head movement during speech to simulate talking
      if (lipSync?.active) {
        // More pronounced nodding and mouth-like movement when speaking
        const talkOsc = Math.abs(Math.sin((lipSync.t || 0) * 12));
        const mouthSimulation = talkOsc * speakAmp * 0.15; // Vertical nod to simulate mouth
        const sideTilt = Math.sin((lipSync.t || 0) * 8) * speakAmp * 0.08; // Side-to-side
        
        headBone.rotation.x = damp(headBone.rotation.x, tilt + mouthSimulation, 12, dt);
        headBone.rotation.y = damp(headBone.rotation.y, sideTilt, 10, dt);
        headBone.rotation.z = damp(headBone.rotation.z, sideTilt * 0.5, 10, dt);
      } else {
        // Idle head movement
        const nod = speakAmp * 0.05 * Math.sin(t * 8);
        const targetX = tilt + nod;
        const targetY = 0.02 * Math.sin((t + 1.7) * 0.9);
        headBone.rotation.x = damp(headBone.rotation.x, targetX, 8, dt);
        headBone.rotation.y = damp(headBone.rotation.y, targetY, 8, dt);
        headBone.rotation.z = damp(headBone.rotation.z, 0, 8, dt);
      }
    }
    // Hand/arm gestures - only active when speaking
    if (lipSync?.active && lipSync.intensity > 0) {
      const amp = 0.3 * lipSync.intensity; // Gesture strength tied to speech intensity
      const wave = Math.sin(t * 1.4);
      const counter = Math.sin(t * 1.2 + Math.PI * 0.3);
      
      if (leftUpperArm) {
        leftUpperArm.rotation.z = damp(leftUpperArm.rotation.z, amp * 0.8 * wave, 10, dt);
        leftUpperArm.rotation.x = damp(leftUpperArm.rotation.x, amp * 0.5 * counter, 10, dt);
      }
      if (rightUpperArm) {
        rightUpperArm.rotation.z = damp(rightUpperArm.rotation.z, -amp * 0.8 * wave, 10, dt);
        rightUpperArm.rotation.x = damp(rightUpperArm.rotation.x, amp * 0.5 * -counter, 10, dt);
      }
      if (leftLowerArm) { 
        leftLowerArm.rotation.x = damp(leftLowerArm.rotation.x, clamp(amp * 0.9 * (wave * 0.8 + 0.2), -0.6, 0.6), 12, dt); 
      }
      if (rightLowerArm) { 
        rightLowerArm.rotation.x = damp(rightLowerArm.rotation.x, clamp(amp * 0.9 * (-wave * 0.8 + 0.2), -0.6, 0.6), 12, dt); 
      }
      if (leftHand) { 
        leftHand.rotation.y = damp(leftHand.rotation.y, clamp(amp * 0.6 * Math.sin(t * 2.0 + 0.4), -0.5, 0.5), 14, dt); 
      }
      if (rightHand) { 
        rightHand.rotation.y = damp(rightHand.rotation.y, clamp(amp * 0.6 * Math.sin(t * 2.1 - 0.3), -0.5, 0.5), 14, dt); 
      }
    } else {
      // Return arms to rest position when not speaking
      if (leftUpperArm) {
        leftUpperArm.rotation.z = damp(leftUpperArm.rotation.z, 0, 8, dt);
        leftUpperArm.rotation.x = damp(leftUpperArm.rotation.x, 0, 8, dt);
      }
      if (rightUpperArm) {
        rightUpperArm.rotation.z = damp(rightUpperArm.rotation.z, 0, 8, dt);
        rightUpperArm.rotation.x = damp(rightUpperArm.rotation.x, 0, 8, dt);
      }
      if (leftLowerArm) { 
        leftLowerArm.rotation.x = damp(leftLowerArm.rotation.x, 0, 8, dt); 
      }
      if (rightLowerArm) { 
        rightLowerArm.rotation.x = damp(rightLowerArm.rotation.x, 0, 8, dt); 
      }
      if (leftHand) { 
        leftHand.rotation.y = damp(leftHand.rotation.y, 0, 8, dt); 
      }
      if (rightHand) { 
        rightHand.rotation.y = damp(rightHand.rotation.y, 0, 8, dt); 
      }
    }
    if (gestureAction) {
      const base = 0.15;
      const speak = (lipSync?.active ? 0.7 * (lipSync?.intensity || 0) : 0.0);
      gestureTargetWeight = clamp(base + speak, 0, 1);
      gestureCurrentWeight = lerp(gestureCurrentWeight, gestureTargetWeight, 1 - Math.exp(-6 * dt));
      gestureAction.setEffectiveWeight(gestureCurrentWeight);
      gestureAction.setEffectiveTimeScale(1.0 + 0.2 * (lipSync?.intensity || 0));
    }
    const now = performance.now() * 0.001;
    if (now >= nextSaccadeAt) {
      const gx = (Math.random() - 0.5) * 0.2;
      const gy = (Math.random() - 0.5) * 0.15;
      gazeTarget.set(gx, 1.5 + gy, 2.0);
      nextSaccadeAt = now + (0.18 + Math.random() * 0.6);
    }
    const eyes = [leftEyeBone, rightEyeBone].filter(Boolean);
    for (const eye of eyes) {
      tmpV.copy(gazeTarget);
      eye.parent.worldToLocal(tmpV);
      const dir = tmpV.sub(eye.position).normalize();
      const yaw = Math.atan2(dir.x, dir.z);
      const pitch = Math.atan2(-dir.y, Math.sqrt(dir.x * dir.x + dir.z * dir.z));
      const maxYaw = 0.25, maxPitch = 0.25;
      eye.rotation.y = damp(eye.rotation.y, clamp(yaw, -maxYaw, maxYaw), 30, dt);
      eye.rotation.x = damp(eye.rotation.x, clamp(pitch, -maxPitch, maxPitch), 30, dt);
    }
    const blinkNow = performance.now() * 0.001;
    if (!blinking && blinkNow >= nextBlinkAt) { blinking = true; blinkPhase = 0; }
    if (blinking) {
      blinkPhase += dt / 0.08;
      if (blinkPhase < 1) { setBlink(clamp(blinkPhase, 0, 1), clamp(blinkPhase, 0, 1)); }
      else if (blinkPhase < 2) { const v = clamp(2 - blinkPhase, 0, 1); setBlink(v, v); }
      else { setBlink(0, 0); blinking = false; const base = 3 + Math.random() * 4; nextBlinkAt = blinkNow + base; if (Math.random() < 0.18) nextBlinkAt = blinkNow + 0.25; }
    }
  }

  return { load, update, get model() { return controllerModel; }, get mixer() { return controllerMixer; } };
}
