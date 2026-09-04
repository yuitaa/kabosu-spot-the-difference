import { CubePanorama, Viewer } from 'panolens';
import { decryptImage } from './decrypt.js';
import './style.css';

const FACES = ['1', '3', '4', '5', '0', '2'].map((n) => `panorama_${n}`);
const FORMAT = '.png';
const base = `${import.meta.env.BASE_URL}img/test/`;

const zoomSensitivity = 5;
const invertZoom = false;
const zoomMinFov = 30;
const zoomMaxFov = 120;

const container = document.querySelector('#container');

async function loadImages() {
  if (!import.meta.env.PROD) {
    return FACES.map((face) => base + face + FORMAT);
  }
  return Promise.all(
    FACES.map(async (face) => {
      const response = await fetch(base + face + '.bin');
      const buffer = await response.arrayBuffer();
      return decryptImage(buffer);
    })
  );
}

async function init() {
  const images = await loadImages();
  const panorama = new CubePanorama(images);

  const viewer = new Viewer({
    container,
    controlButtons: ['fullscreen'],
    cameraFov: 80,
    rotateSpeed: -2.5,
    viewIndicator: false,
  });
  setupWheelZoom(viewer);
  viewer.add(panorama);
}

function setupWheelZoom(viewer) {
  container.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      const delta = event.deltaY;
      if (delta === 0) return;
      let step = (delta > 0 ? 1 : -1) * zoomSensitivity;
      if (invertZoom) step = -step;
      viewer.camera.fov = Math.min(zoomMaxFov, Math.max(zoomMinFov, viewer.camera.fov + step));
      viewer.camera.updateProjectionMatrix();
      viewer.render();
    },
    { passive: false }
  );
}

init();
