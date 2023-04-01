import './main.css';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import fragment from './shaders/fragment.glsl.js';
import vertex from './shaders/vertex.glsl.js';
import TRACK from './sounds/track.mp3';

class Visualizer {
  constructor(mesh, frequencyUniformName) {
    // mesh setup
    this.mesh = mesh;
    this.frequencyUniformName = frequencyUniformName;
    this.mesh.material.uniforms[this.frequencyUniformName] = { value: 0 };

    // audio listener
    this.listener = new THREE.AudioListener();
    this.mesh.add(this.listener);

    // global audio source
    this.sound = new THREE.Audio(this.listener);
    this.loader = new THREE.AudioLoader();

    // analyser
    this.analyser = new THREE.AudioAnalyser(this.sound, 32);
  }

  load(path) {
    this.loader.load(path, (buffer) => {
      this.sound.setBuffer(buffer);
      this.sound.setLoop(true);
      this.sound.setVolume(0.5);
      this.sound.play();
    });
  }

  getFrequency() {
    return this.analyser.getAverageFrequency();
  }

  update() {
    const frequency = Math.max(this.getFrequency() - 100, 0) / 50;
    const frequencyUniform =
      this.mesh.material.uniforms[this.frequencyUniformName];

    gsap.to(frequencyUniform, {
      duration: 1.5,
      ease: 'Slow.easeOut',
      value: frequency,
    });
  }
}

export default class Sketch {
  constructor() {
    this.scene = new THREE.Scene();
    this.container = document.getElementById('container');
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000e24, 1);
    this.renderer.useLegacyLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );
    this.camera.position.set(-4, 0, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.time = 0;

    this.addMesh();
    this.addLights();
    this.setupResize();
    // this.resize();
    this.render();
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    // image cover
    this.imageAspect = 853 / 1280;
    let a1;
    let a2;
    if (this.height / this.width > this.imageAspect) {
      a1 = (this.width / this.height) * this.imageAspect;
      a2 = 1;
    } else {
      a1 = 1;
      a2 = this.height / this.width / this.imageAspect;
    }

    this.material.uniforms.resolution.value.x = this.width;
    this.material.uniforms.resolution.value.y = this.height;
    this.material.uniforms.resolution.value.z = a1;
    this.material.uniforms.resolution.value.w = a2;

    // optional - cover with quad
    const distance = this.camera.position.z;
    const height = 1;
    this.camera.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * distance));

    // if (w/h > 1)
    // if (this.width / this.height > 1) {
    //   this.plane.scale.x = this.camera.aspect;
    // } else {
    //   this.plane.scale.y = 1 / this.camera.aspect;
    // }

    this.camera.updateProjectionMatrix();
  }

  addLights() {
    const dirLight = new THREE.DirectionalLight('#526cff', 0.6);
    const ambientLight = new THREE.AmbientLight('#4255ff', 0.5);
    dirLight.position.set(2, 2, 2);

    this.scene.add(dirLight, ambientLight);
  }

  addMesh() {
    this.geometry = new THREE.SphereGeometry(1, 100, 100);
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      fragmentShader: fragment,
      vertexShader: vertex,
    });

    this.sphere = new THREE.Mesh(this.geometry, this.material);

    const wireframe = new THREE.LineSegments(this.geometry, this.material);
    const WIREFRAME_DELTA = 0.015;
    wireframe.scale.setScalar(1 + WIREFRAME_DELTA);

    // visualizer
    this.visualizer = new Visualizer(this.sphere, 'uAudioFrequency');
    this.visualizer.load(TRACK);

    this.sphere.add(wireframe);
    this.scene.add(this.sphere);
  }

  render() {
    this.time += 0.012;
    this.material.uniforms.uTime.value = this.time;

    this.visualizer.update();

    this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(this.render.bind(this));
  }
}

new Sketch();
