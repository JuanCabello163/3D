import * as THREE from "../three.module.js";
import { OrbitControls } from "../OrbitControls.js";

// Solicitar al usuario la dimensión del cubo
const size = parseFloat(prompt("Ingrese el tamaño del cubo (en unidades):", "5")) || 20;
const halfSize = size ;
const boundarySize = size * 2; // Ajusta según sea necesario

// Crear la escena
const scene = new THREE.Scene();
scene.background = new THREE.Color('#b3deff');
let currentYLevel = 0;

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
const markers = [];
const boundaryGeometry = new THREE.BoxGeometry(boundarySize, boundarySize, boundarySize);
const boundaryMaterial = new THREE.MeshBasicMaterial({
  color: 0x0000ff,
  wireframe: true,
  transparent: true,
  opacity: 0.2,
});
const boundaryCube = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
scene.add(boundaryCube);

// Crear un plano de intersección
const intersectionPlaneGeometry = new THREE.PlaneGeometry(size * 2, size * 2);
const intersectionPlaneMaterial = new THREE.MeshBasicMaterial({ visible: false }); // El plano no será visible
const intersectionPlane = new THREE.Mesh(intersectionPlaneGeometry, intersectionPlaneMaterial);
intersectionPlane.rotation.x = -Math.PI / 2; // Alineado con el plano de dibujo
intersectionPlane.position.y = 0; // Posición inicial del plano de intersección
scene.add(intersectionPlane);

// Inicializar el slider
const yLevelSlider = document.getElementById('yLevelSlider');
const sliderValue = document.getElementById('sliderValue');
// Función para actualizar el rango del slider
function updateSliderRange(newSize) {
  const newHalfSize = newSize; // Usa el tamaño completo del cubo
  yLevelSlider.min = -newHalfSize;
  yLevelSlider.max = newHalfSize;
  yLevelSlider.value = 0; // Valor inicial del slider
  updateGridAndDrawingPlane(parseFloat(yLevelSlider.value)); // Asegúrate de que el plano y la grilla se actualicen
  sliderValue.textContent = `Nivel Y: ${yLevelSlider.value}`; // Actualiza el texto del slider
}

// Función para actualizar la grilla y el plano de dibujo según el nivel Y
function updateGridAndDrawingPlane(yLevel) {
  gridHelper.position.y = yLevel;
  intersectionPlane.position.y = yLevel;
  sliderValue.textContent = `Nivel Y: ${yLevel}`; // Actualiza el texto del slider
}

// Actualiza el rango del slider después de crear el cubo y el plano
updateSliderRange(size);

// Configura el evento del slider
yLevelSlider.addEventListener('input', (event) => {
  currentYLevel = parseFloat(event.target.value);
  updateGridAndDrawingPlane(currentYLevel);
});

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

// Variables para el dibujo (declarar fuera de funciones)
let isDrawing = false;
let drawingEnabled = false;
let startPoint = null; // Ahora es global
let endPoint = null;
const lines = [];
const texts = [];
let temporaryLine = null; // Variable para almacenar la línea temporal
let marker = null; // Variable para almacenar el marcador actual
const connectedLines = []; // Lista para almacenar las líneas creadas con "Conectar Puntos"

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

// Variables para almacenar el estado de conexión de puntos y los puntos seleccionados
let connectingPoints = false;
let selectedPoints = [];

// Obtener referencia al botón "Conectar Puntos"
const connectPointsButton = document.getElementById('connectPointsButton');

// Evento de clic para el botón "Conectar Puntos"
connectPointsButton.addEventListener('click', () => {
  connectingPoints = !connectingPoints;  // Cambiar el estado al presionar el botón

  if (connectingPoints) {
      // Mostrar todos los puntos creados
      existingPoints.forEach(point => {
          if (point instanceof THREE.Mesh) {  // Verifica que sea un Mesh
              point.visible = true;  // Asegura que sean visibles
          }
      });
      alert('Selecciona dos puntos para conectar.');
  } else {
      // Ocultar puntos y resetear selección si se cancela la conexión
      existingPoints.forEach(point => {
          if (point instanceof THREE.Mesh) {  // Verifica que sea un Mesh
              point.visible = false;
          }
      });
      selectedPoints = [];  // Reiniciar la lista de puntos seleccionados
  }
});

window.addEventListener('click', (event) => {
  if (connectingPoints && selectedPoints.length < 2) {
      // Realizar un raycasting para detectar el punto más cercano al clic del mouse
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      // Filtrar los objetos para asegurarse de que solo los meshes sean intersectados y sean visibles
      const meshes = existingPoints.filter(point => point instanceof THREE.Mesh && point.visible);
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
          const intersectedPoint = intersects[0].object;

          if (!selectedPoints.includes(intersectedPoint)) {
              selectedPoints.push(intersectedPoint);
              // Cambiar el color del punto seleccionado para destacarlo
              intersectedPoint.material.color.set(0x00ff00);  // Cambia el color del punto seleccionado a verde
          }
      }

      // Conectar los dos puntos seleccionados
      if (selectedPoints.length === 2) {
          const geometry = new THREE.BufferGeometry().setFromPoints([
              selectedPoints[0].position,
              selectedPoints[1].position
          ]);
          const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
          const line = new THREE.Line(geometry, material);
          scene.add(line);
          // Guardar la línea en la lista de líneas conectadas
          connectedLines.push(line);

          // Reiniciar selección y volver a estado inicial
          selectedPoints = [];
          connectingPoints = false;
          connectPointsButton.click();  // Simula otro clic para volver a modo inicial
      }
  }
});

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
const drawingPlaneGeometry = new THREE.PlaneGeometry(size * 2, size * 2);
const drawingPlaneMaterial = new THREE.MeshBasicMaterial({ visible: false });
const drawingPlane = new THREE.Mesh(drawingPlaneGeometry, drawingPlaneMaterial);
drawingPlane.rotation.x = -Math.PI / 2;
drawingPlane.position.y = -halfSize;
scene.add(drawingPlane);


function onMouseDown(event) {
  if (!drawingEnabled) return;

  // Obtener el valor del slider para Y
  const sliderYValue = parseFloat(document.getElementById('yLevelSlider').value);

  // Calcular la posición del mouse en el espacio de la ventana y luego en el espacio 3D
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Intersectar el rayo con el plano de intersección
  const intersects = raycaster.intersectObject(intersectionPlane);

  if (intersects.length > 0) {
    startPoint = intersects[0].point.clone();

    // Ajustar el punto al grid más cercano
    snapVector3ToGrid(startPoint, 1);

    // Asegurar que Y sea el del slider
    startPoint.y = sliderYValue;

    // Ajustar el punto dentro del área del cubo
    startPoint.x = Math.max(-halfSize, Math.min(halfSize, startPoint.x));
    startPoint.z = Math.max(-halfSize, Math.min(halfSize, startPoint.z));

    // Actualizar el marcador y la línea temporal
    clearMarker(); // Eliminar el marcador existente
    marker = createMarker(startPoint);
    scene.add(marker);

    if (temporaryLine) {
      scene.remove(temporaryLine);
      temporaryLine.geometry.dispose();
      temporaryLine.material.dispose();
    }
    temporaryLine = null;

    isDrawing = true;
  } else {
    isDrawing = false; // Si no hay intersección, deshabilitamos el dibujo
  }
}

function onMouseMove(event) {
  if (!isDrawing || !drawingEnabled) return;

  const mousePos = getMousePosition(event.clientX, event.clientY);
  endPoint = new THREE.Vector3(mousePos.x, mousePos.y, mousePos.z);
  snapVector3ToGrid(endPoint, 1);

  // Obtener el valor del slider para Y
  const sliderYValue = parseFloat(document.getElementById('yLevelSlider').value);

  // Ajustar el punto final para estar dentro del área del cubo y en el nivel Y del slider
  endPoint.x = Math.max(-halfSize, Math.min(halfSize, endPoint.x));
  endPoint.y = sliderYValue; // Fijar la coordenada Y al valor del slider
  endPoint.z = Math.max(-halfSize, Math.min(halfSize, endPoint.z));

  // Buscar el punto más cercano
  const threshold = 0.5; // Ajusta según sea necesario
  const closestPoint = findClosestPoint(endPoint, threshold);

  if (closestPoint) {
    endPoint.copy(closestPoint);
  }

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
      // Obtener el valor del slider para Y
      const sliderYValue = parseFloat(document.getElementById('yLevelSlider').value);

      // Ajustar puntos al límite del cubo y al valor Y del slider
      startPoint.x = Math.max(-halfSize, Math.min(halfSize, startPoint.x));
      startPoint.y = sliderYValue; // Fijar la coordenada Y al valor del slider
      startPoint.z = Math.max(-halfSize, Math.min(halfSize, startPoint.z));

      endPoint.x = Math.max(-halfSize, Math.min(halfSize, endPoint.x));
      endPoint.y = sliderYValue; // Fijar la coordenada Y al valor del slider
      endPoint.z = Math.max(-halfSize, Math.min(halfSize, endPoint.z));

      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
      const points = [startPoint, endPoint];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      lines.push(line);

      // Crear un punto visual para el punto de inicio
      createPointMesh(startPoint);

      // Crear un punto visual para el punto final
      createPointMesh(endPoint);

      // Función para crear texto con coordenadas
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

// Nueva función para crear un mesh para cada punto
function createPointMesh(position) {
  const geometry = new THREE.SphereGeometry(0.1, 32, 32); // Tamaño y detalle de la esfera
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Color rojo para los puntos
  const pointMesh = new THREE.Mesh(geometry, material);
  pointMesh.position.copy(position); // Asigna la posición del punto de origen
  scene.add(pointMesh); // Agregar a la escena

  // Agregar el punto mesh a la lista de puntos existentes
  existingPoints.push(pointMesh);
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
  lines.forEach((line) => {
    scene.remove(line);
    line.geometry.dispose(); // Liberar recursos de geometría
    line.material.dispose(); // Liberar recursos de material
  });
  lines.length = 0; // Limpiar la lista de líneas

  // Eliminar textos
  texts.forEach((text) => {
    scene.remove(text);
    text.geometry.dispose(); // Liberar recursos de geometría
    text.material.dispose(); // Liberar recursos de material
  });
  texts.length = 0; // Limpiar la lista de textos

  // Eliminar puntos (marcadores)
  markers.forEach((marker) => {
    scene.remove(marker);
    marker.geometry.dispose(); // Liberar recursos de geometría
    marker.material.dispose(); // Liberar recursos de material
  });
  markers.length = 0; // Limpiar la lista de marcadores

  // Eliminar puntos existentes
  existingPoints.forEach((point) => {
    if (point instanceof THREE.Mesh) { // Verificar si es un mesh
      scene.remove(point);
      point.geometry.dispose(); // Liberar recursos de geometría
      point.material.dispose(); // Liberar recursos de material
    }
  });
  existingPoints.length = 0; // Limpiar la lista de puntos existentes
  // Eliminar líneas conectadas
  connectedLines.forEach((line) => {
    scene.remove(line);
    line.geometry.dispose(); // Liberar recursos de geometría
    line.material.dispose(); // Liberar recursos de material
  });
  connectedLines.length = 0; // Limpiar la lista de líneas conectadas

  // Asegurar que todos los recursos estén liberados y las listas estén vacías
  console.log("Líneas, textos, marcadores y puntos eliminados.");
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