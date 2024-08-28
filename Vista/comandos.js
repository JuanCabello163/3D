import * as THREE from "../three.module.js";
import { OrbitControls } from "../OrbitControls.js";

// Solicitar al usuario la dimensión del cubo
const size = parseFloat(prompt("Ingrese el tamaño del cubo (en unidades):", "5")) || 20;
const halfSize = size ;

// Crear la escena
const scene = new THREE.Scene();
scene.background = new THREE.Color('#b3deff');

// Crear la grilla
const gridSize = size *2;
const divisions = size *2;
const colorCenterLine = 0x000000;
const colorGrid = '#e4e4e4';
const gridHelper = new THREE.GridHelper(gridSize, divisions, colorCenterLine, colorGrid);
gridHelper.position.y = -halfSize;
scene.add(gridHelper);

// Lista para guardar puntos de trazos existentes
const existingPoints = [];
const markers = []; // Añade esta variable para almacenar los puntos

// Crear el cubo de límites
const boundarySize = size * 2; // Ajusta según sea necesario
const boundaryGeometry = new THREE.BoxGeometry(boundarySize, boundarySize, boundarySize);
const boundaryMaterial = new THREE.MeshBasicMaterial({
  color: 0x0000ff,
  wireframe: true,
  transparent: true,
  opacity: 0.2,
});

// Crear un plano de intersección
const intersectionPlaneGeometry = new THREE.PlaneGeometry(size * 2, size * 2);
const intersectionPlaneMaterial = new THREE.MeshBasicMaterial({ visible: false }); // El plano no será visible
const intersectionPlane = new THREE.Mesh(intersectionPlaneGeometry, intersectionPlaneMaterial);
intersectionPlane.rotation.x = -Math.PI / 2; // Alineado con el plano de dibujo
intersectionPlane.position.y = -halfSize; // Posición en el centro del área de dibujo
scene.add(intersectionPlane);

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

const cornerX = -size ;
const cornerY = -size ;
const cornerZ = -size ;

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
let temporaryLine = null; // Variable para almacenar la línea temporal

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

// Función para crear un marcador y agregarlo a la lista
function createMarker(position) {
  const markerGeometry = new THREE.SphereGeometry(0.1, 16, 16);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
  markerMesh.position.copy(position);
  markers.push(markerMesh); // Guarda el marcador en la lista
  return markerMesh;
}

function clearMarker() {
  if (marker) {
    scene.remove(marker);
    marker.geometry.dispose();
    marker.material.dispose();
    marker = null;
  }
}

function onMouseDown(event) {
  if (!drawingEnabled) return;
  clearMarker(); // Eliminar el marcador existente
  isDrawing = true;

  // Calcular la posición del mouse en el espacio de la ventana y luego en el espacio 3D
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Intersectar el rayo con el plano de intersección
  const intersects = raycaster.intersectObject(intersectionPlane);

  if (intersects.length > 0) {
    startPoint = intersects[0].point.clone(); // Clonar para asegurar que obtenemos una copia exacta
    console.log("Start Point Set: ", startPoint);
  } else {
    isDrawing = false; // Si no hay intersección, deshabilitamos el dibujo
  }
}
let marker = null; // Variable para almacenar el marcador actual

function onMouseMove(event) {
  if (!isDrawing || !drawingEnabled) return;

  const mousePos = getMousePosition(event.clientX, event.clientY);
  endPoint = new THREE.Vector3(mousePos.x, mousePos.y, mousePos.z);
  snapVector3ToGrid(endPoint, 1);

  // Ajustar el punto final para estar dentro del área del cubo
  endPoint.x = Math.max(-halfSize, Math.min(halfSize, endPoint.x));
  endPoint.y = Math.max(-halfSize, Math.min(halfSize, endPoint.y));
  endPoint.z = Math.max(-halfSize, Math.min(halfSize, endPoint.z));

  // Actualizar el marcador
  if (marker) {
    marker.position.copy(endPoint);
  } else {
    marker = createMarker(endPoint);
    scene.add(marker);
  }

  // Crear o actualizar la línea temporal
  if (startPoint) {
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const points = [startPoint, endPoint];
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    if (temporaryLine) {
      scene.remove(temporaryLine);
    }
    temporaryLine = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(temporaryLine);
  }
}
function onMouseUp(event) {
  if (isDrawing) {
    isDrawing = false;

    if (temporaryLine) {
      scene.remove(temporaryLine);
      temporaryLine.geometry.dispose();
      temporaryLine.material.dispose();
      temporaryLine = null;
    }

    if (startPoint && endPoint) {
      // Ajustar puntos al límite del cubo
      startPoint.x = Math.max(-halfSize, Math.min(halfSize, startPoint.x));
      startPoint.y = Math.max(-halfSize, Math.min(halfSize, startPoint.y));
      startPoint.z = Math.max(-halfSize, Math.min(halfSize, startPoint.z));
      
      endPoint.x = Math.max(-halfSize, Math.min(halfSize, endPoint.x));
      endPoint.y = Math.max(-halfSize, Math.min(halfSize, endPoint.y));
      endPoint.z = Math.max(-halfSize, Math.min(halfSize, endPoint.z));
      
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
      const points = [startPoint, endPoint];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      lines.push(line);

      // Agregar los puntos a la lista de puntos existentes
      existingPoints.push(startPoint.clone());
      existingPoints.push(endPoint.clone());

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
            const textMaterial = new THREE.MeshBasicMaterial({ color: '#000000' });
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            textMesh.position.copy(position);
            textMesh.lookAt(camera.position);
            scene.add(textMesh);
            texts.push(textMesh);
          }
        );
      }

      createText(startPoint, `${startPoint.x.toFixed(2)}, ${startPoint.y.toFixed(2)}, ${startPoint.z.toFixed(2)}`);
      createText(endPoint, `${endPoint.x.toFixed(2)}, ${endPoint.y.toFixed(2)}, ${endPoint.z.toFixed(2)}`);
    }

    drawingEnabled = false;
  }
}

function findClosestPoint(point, threshold) {
  let closestPoint = null;
  let minDistance = threshold;

  existingPoints.forEach(existingPoint => {
    const distance = point.distanceTo(existingPoint);
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = existingPoint;
    }
  });

  return closestPoint;
}

function getMousePosition(x, y) {
  mouse.x = (x / window.innerWidth) * 2 - 1;
  mouse.y = - (y / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Intersectar el rayo con el plano de intersección
  const intersects = raycaster.intersectObject(intersectionPlane);

  if (intersects.length > 0) {
    return intersects[0].point;
  }

  return new THREE.Vector3(0, 0, 0);
}

// Función para eliminar todos los trazos, textos y puntos
function clearLines() {
  // Eliminar líneas
  lines.forEach((line) => scene.remove(line));
  lines.length = 0;

  // Eliminar textos
  texts.forEach((text) => scene.remove(text));
  texts.length = 0;

  // Eliminar puntos
  markers.forEach((marker) => {
    scene.remove(marker);
    marker.geometry.dispose();
    marker.material.dispose();
  });
  markers.length = 0;
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
      const lineMaterial = new THREE.LineBasicMaterial({ color: '#000000' });
      const points = [start && end];
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
            const textMaterial = new THREE.MeshBasicMaterial({ color: '#000000' });
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            textMesh.position.copy(position);
            textMesh.lookAt(camera.position);
            scene.add(textMesh);
            texts.push(textMesh);
          }
        );
      }

      createText(start, `${start.x.toFixed(2)}, ${start.y.toFixed(2)}, ${start.z.toFixed(2)}`);
      createText(end, `${end.x.toFixed(2)}, ${end.y.toFixed(2)}, ${end.z.toFixed(2)}`);
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