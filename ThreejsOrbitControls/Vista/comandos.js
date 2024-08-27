import * as THREE from "../three.module.js";
import { OrbitControls } from "../OrbitControls.js";

// Solicitar al usuario la dimensión del cubo
const size = parseFloat(prompt("Ingrese el tamaño del cubo (en unidades):", "20")) || 20;
const halfSize = size / 2;

// Crear la escena
const scene = new THREE.Scene();
scene.background = new THREE.Color('#b3deff');

// Crear la grilla
const gridSize = 50;
const divisions = 50;
const colorCenterLine = 0x000000;
const colorGrid = '#e4e4e4';
const gridHelper = new THREE.GridHelper(gridSize, divisions, colorCenterLine, colorGrid);
gridHelper.position.y = -halfSize;
scene.add(gridHelper);

// Crear el cubo de límites
const boundaryGeometry = new THREE.BoxGeometry(size, size, size);
const boundaryMaterial = new THREE.MeshBasicMaterial({
  color: 0x0000ff,
  wireframe: true,
  transparent: true,
  opacity: 0.2,
});
const boundaryCube = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
scene.add(boundaryCube);

// Configurar el piso
const floorSize = Math.max(size * 2, 1000);
const floorGeometry = new THREE.PlaneGeometry(floorSize, floorSize);
const floorMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -halfSize;
scene.add(floor);

// Crear ejes de coordenadas
function createAxisLine(start, end, color) {
  const points = [start, end];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: color });
  return new THREE.Line(geometry, material);
}

const axisLength = size * 1.5;
const offset = 2;

const cornerX = -size / 2;
const cornerY = -size / 2;
const cornerZ = -size / 2;

const axisX = createAxisLine(
  new THREE.Vector3(cornerX - offset, cornerY, cornerZ),
  new THREE.Vector3(cornerX + axisLength, cornerY, cornerZ),
  0xff0000
);
const axisY = createAxisLine(
  new THREE.Vector3(cornerX, cornerY - offset, cornerZ),
  new THREE.Vector3(cornerX, cornerY + axisLength, cornerZ),
  0x00ff00
);
const axisZ = createAxisLine(
  new THREE.Vector3(cornerX, cornerY, cornerZ - offset),
  new THREE.Vector3(cornerX, cornerY, cornerZ + axisLength),
  0x0000ff
);
scene.add(axisX);
scene.add(axisY);
scene.add(axisZ);

// Crear líneas discontinuas
const dashedMaterial = new THREE.LineDashedMaterial({
  color: 0xff0000,
  dashSize: 0.5,
  gapSize: 0.5,
  linewidth: 2
});

function createDashedLine(start, end) {
  const points = [start, end];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  geometry.computeBoundingSphere();
  const line = new THREE.LineSegments(geometry, dashedMaterial);
  line.computeLineDistances();
  return line;
}

// Ejemplo de línea discontinua
const dashedLine = createDashedLine(new THREE.Vector3(-5, 0, 0), new THREE.Vector3(5, 0, 0));
scene.add(dashedLine);

// Añadir cámara
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Añadir controles orbitales
const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 3;
controls.maxDistance = 10;
controls.enableDamping = true;
controls.dampingFactor = 0.5;
controls.maxPolarAngle = Math.PI;
controls.screenSpacePanning = true;

let areControlsEnabled = false;
function updateControls() {
  controls.enabled = areControlsEnabled;
  document.getElementById("toggleControlsButton").classList.toggle("active", areControlsEnabled);
}
function toggleControls(event) {
  event.stopPropagation();
  areControlsEnabled = !areControlsEnabled;
  updateControls();
}
document.getElementById("toggleControlsButton").addEventListener("click", toggleControls);

// Variables para el dibujo
let isDrawing = false;
let drawingEnabled = false;
let startPoint = null;
let endPoint = null;
const lines = [];
const texts = [];

// Función para ajustar un valor a la grilla más cercana
function snapToGrid(value, gridSize) {
  return Math.round(value / gridSize) * gridSize;
}

function snapVector3ToGrid(vector, gridSize) {
  vector.x = snapToGrid(vector.x, gridSize);
  vector.y = snapToGrid(vector.y, gridSize);
  vector.z = snapToGrid(vector.z, gridSize);
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseDown(event) {
  if (!drawingEnabled) return;
  isDrawing = true;
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([floor, boundaryCube], true);
  if (intersects.length > 0) {
    startPoint = intersects[0].point;
    console.log(startPoint);
  }
}

function onMouseMove(event) {
  if (!isDrawing || !drawingEnabled) return;
  
  const { x, y, z } = getMousePosition(event.clientX, event.clientY);
  endPoint = new THREE.Vector3(x, y, z);
  snapVector3ToGrid(endPoint, 1);

  if (lines.length > 0 && lines[lines.length - 1].isTemporary) {
    scene.remove(lines.pop());
  }

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const points = [startPoint, endPoint];
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(lineGeometry, lineMaterial);
  line.isTemporary = true;

  scene.add(line);
  lines.push(line);
}

function onMouseUp(event) {
  if (isDrawing) {
    isDrawing = false;
    if (lines.length > 0) {
      lines[lines.length - 1].isTemporary = false;
    }
    function createText(position, label) {
      const loader = new THREE.FontLoader();
      loader.load(
        "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
        (font) => {
          const textGeometry = new THREE.TextGeometry(label, {
            font: font,
            size: 0.1,
            height: 0.02,
          });
          const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const textMesh = new THREE.Mesh(textGeometry, textMaterial);
          textMesh.position.copy(position);
          textMesh.lookAt(camera.position);
          scene.add(textMesh);
          texts.push(textMesh);
        }
      );
    }
    createText(startPoint, `(${startPoint.x.toFixed(2)}, ${startPoint.y.toFixed(2)}, ${startPoint.z.toFixed(2)})`);
    createText(endPoint, `(${endPoint.x.toFixed(2)}, ${endPoint.y.toFixed(2)}, ${endPoint.z.toFixed(2)})`);
    drawingEnabled = false;
  }
}

function getMousePosition(x, y) {
  mouse.x = (x / window.innerWidth) * 2 - 1;
  mouse.y = - (y / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const intersect = new THREE.Vector3();
  raycaster.ray.intersectPlane(planeZ, intersect);
  intersect.x = Math.max(-halfSize, Math.min(halfSize, intersect.x));
  intersect.y = Math.max(-halfSize, Math.min(halfSize, intersect.y));
  intersect.z = Math.max(-halfSize, Math.min(halfSize, intersect.z));
  return intersect;
}

function clearLines() {
  lines.forEach((line) => scene.remove(line));
  texts.forEach((text) => scene.remove(text));
  lines.length = 0;
  texts.length = 0;
}

function enableDrawing() {
  drawingEnabled = true;
  document.getElementById("drawButton").style.backgroundColor = "#28a745";
}

function drawLineFromCode() {
  const input = document.getElementById("codeInput").value;
  const coords = input.split(',').map(Number);
  if (coords.length === 6 && coords.every(coord => !isNaN(coord))) {
    const [x1, y1, z1, x2, y2, z2] = coords;
    const start = new THREE.Vector3(x1, y1, z1);
    const end = new THREE.Vector3(x2, y2, z2);
    if (
      start.x >= -halfSize && start.x <= halfSize &&
      start.y >= -halfSize && start.y <= halfSize &&
      start.z >= -halfSize && start.z <= halfSize &&
      end.x >= -halfSize && end.x <= halfSize &&
      end.y >= -halfSize && end.y <= halfSize &&
      end.z >= -halfSize && end.z <= halfSize
    ) {
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
      const points = [start, end];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      lines.push(line);
      function createText(position, label) {
        const loader = new THREE.FontLoader();
        loader.load(
          "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
          (font) => {
            const textGeometry = new THREE.TextGeometry(label, {
              font: font,
              size: 0.1,
              height: 0.02,
            });
            const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            textMesh.position.copy(position);
            textMesh.lookAt(camera.position);
            scene.add(textMesh);
            texts.push(textMesh);
          }
        );
      }
      createText(start, `(${start.x.toFixed(2)}, ${start.y.toFixed(2)}, ${start.z.toFixed(2)})`);
      createText(end, `(${end.x.toFixed(2)}, ${end.y.toFixed(2)}, ${end.z.toFixed(2)})`);
    } else {
      alert("Las coordenadas deben estar dentro del cubo.");
    }
  } else {
    alert("Ingrese las coordenadas en el formato correcto: x1,y1,z1,x2,y2,z2");
  }
}

renderer.domElement.addEventListener("mousedown", onMouseDown);
renderer.domElement.addEventListener("mousemove", onMouseMove);
renderer.domElement.addEventListener("mouseup", onMouseUp);
document.getElementById("drawButton").addEventListener("click", enableDrawing);
document.getElementById("clearButton").addEventListener("click", clearLines);
document.getElementById("codeButton").addEventListener("click", drawLineFromCode);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const animate = function () {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
};

animate();