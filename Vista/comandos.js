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

// Crear el botón de alternar grillas
const toggleGridButton = document.getElementById('toggleGridButton');

// Bandera para controlar la visibilidad de las grillas
let gridsVisible = true;

// Función para alternar la visibilidad de las grillas
function toggleGridsVisibility() {
    gridsVisible = !gridsVisible;
    grid3D.visible = gridsVisible;
}

// Asignar la función al botón
toggleGridButton.addEventListener('click', toggleGridsVisibility);
// Crear la grilla
const gridSize = size *2;
const divisions = size *2;
const colorCenterLine = 0x000000;
const colorGrid = '#e4e4e4';
const gridHelper = new THREE.GridHelper(gridSize, divisions, colorCenterLine, colorGrid);
gridHelper.position.y = 0;
scene.add(gridHelper);
//Grilla de piso
const gridSize_1 = size *20;
const divisions_1 = size *20;
const colorGrid_1 = '#e4e4e4';
const colorCenterLine_1 = 0x000000;
const gridHelper_1 = new THREE.GridHelper(gridSize_1, divisions_1,colorCenterLine_1, colorGrid_1);
gridHelper_1.position.y = 0;
scene.add(gridHelper_1);
//Grilla interna
// Función para crear una grilla en 3D
function create3DGrid(size, divisions, color) {
  const material = new THREE.LineBasicMaterial({ color: color });
  const gridPoints = [];
  const step = size / divisions;

  // Crear líneas en el plano XY
  for (let i = -size / 2; i <= size / 2; i += step) {
      for (let j = -size / 2; j <= size / 2; j += step) {
          gridPoints.push(new THREE.Vector3(-size / 2, i, j));
          gridPoints.push(new THREE.Vector3(size / 2, i, j));

          gridPoints.push(new THREE.Vector3(i, -size / 2, j));
          gridPoints.push(new THREE.Vector3(i, size / 2, j));

          gridPoints.push(new THREE.Vector3(i, j, -size / 2));
          gridPoints.push(new THREE.Vector3(i, j, size / 2));
      }
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(gridPoints);
  const grid = new THREE.LineSegments(geometry, material);

  return grid;
}

// Crear la grilla 3D dentro del cubo
const gridSize_3 = size * 2; // Asegúrate de ajustar el tamaño según tu cubo
const divisions_3 = size * 2;
const colorGrid_3 = '#e4e4e4';
const grid3D = create3DGrid(gridSize_3, divisions_3, colorGrid_3);

scene.add(grid3D);


// Lista para guardar puntos de trazos existentes
const existingPoints = [];
const markers = [];
const boundaryGeometry = new THREE.BoxGeometry(boundarySize, boundarySize, boundarySize);
const boundaryMaterial = new THREE.MeshBasicMaterial({
  color: 0x0000ff,
  wireframe: true,
  transparent: true,
  opacity: 0,
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
  yLevelSlider.min = 0;
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
floor.position.y = 0;
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
const cornerY = 0 ;
const cornerZ =   -size ;

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
camera.position.y = 2;

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
function limitCameraPosition() {
  if (camera.position.y < 1) {
      camera.position.y = 1;  // Limita la cámara para que no baje de Y=0
  }
}
// Si estás utilizando OrbitControls, puedes agregar un evento para limitar la cámara:
controls.addEventListener('change', limitCameraPosition);

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

let creatingSurface = false;  // Estado para controlar la creación de superficies
let surfacePoints = [];  // Array para almacenar los puntos seleccionados para la superficie
let selectedMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });  // Material por defecto

// Evento de clic para el botón "Crear Superficie"
// Evento de clic para el botón "Crear superficie"
createSurfaceButton.addEventListener('click', () => {
  creatingSurface = !creatingSurface;  // Cambiar el estado al presionar el botón

  if (creatingSurface) {
      // Mostrar todos los puntos creados en color rojo
      existingPoints.forEach(point => {
          if (point instanceof THREE.Mesh) {  // Verifica que sea un Mesh
              point.visible = true;
              point.material.color.set(0xff0000);  // Cambia el color a rojo
          }
      });
      alert('Selecciona los puntos para crear una superficie.');
  } else {
      // Resetear los puntos y ocultarlos si se cancela la creación de superficie
      existingPoints.forEach(point => {
          if (point instanceof THREE.Mesh) {  // Verifica que sea un Mesh
              point.visible = false;
          }
      });
      surfacePoints = [];  // Reiniciar la lista de puntos seleccionados
  }
});
// Evento de clic para seleccionar puntos al crear una superficie
renderer.domElement.addEventListener('click', (event) => {
  if (creatingSurface) {
      const mouse = new THREE.Vector2(
          (event.clientX / window.innerWidth) * 2 - 0.5,
          -(event.clientY / window.innerHeight) * 2 + 0.5
      );

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(existingPoints);

      console.log('Intersects:', intersects); // Verifica si hay intersecciones

      if (intersects.length > 0) {
          const selectedPoint = intersects[0].object;
          console.log('Selected Point:', selectedPoint); // Verifica el punto seleccionado

          if (!selectedSurfacePoints.includes(selectedPoint)) {
              selectedSurfacePoints.push(selectedPoint);
              console.log('Changing color of point:', selectedPoint); // Verifica si se está cambiando el color

              selectedPoint.material.color.set(0x00ff00);  // Cambia el color a verde
          } else {
              console.log('Point already selected:', selectedPoint); // Verifica si el punto ya está en la lista
          }
      } else {
          console.log('No point intersected'); // Verifica si no hay puntos intersectados
      }
  }
});
// Maneja la selección de puntos
function onMouseClick(event) {
  if (creatingSurface) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(existingPoints);

    if (intersects.length > 0) {
      const point = intersects[0].object;
      if (!surfacePoints.includes(point)) {
        surfacePoints.push(point);
      }
    }
  }
}
function createSurfaceFromPoints(points) {
  if (points.length < 3) {
    alert('Necesitas al menos 3 puntos para crear una superficie.');
    return;
  }

  // Extrae las coordenadas de los puntos seleccionados
  const geometry = new THREE.Geometry();
  points.forEach(point => {
    geometry.vertices.push(point.position);
  });

  // Crea la superficie (esto es una simplificación, puedes necesitar un algoritmo más complejo para crear una malla)
  geometry.faces.push(new THREE.Face3(0, 1, 2));  // Asumiendo que tienes al menos 3 puntos, ajusta según sea necesario

  geometry.computeFaceNormals();
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, selectedMaterial);
  scene.add(mesh);
}
// Evento de clic para el botón "Seleccionar Material"
selectMaterialButton.addEventListener('click', () => {
  // Puedes implementar un método para seleccionar el material, por ejemplo, un prompt para el color
  const color = prompt('Ingrese el color en formato hexadecimal (por ejemplo, #ff0000):', '#0000ff');
  selectedMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(color) });
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
    // Asegurar que el valor Y sea positivo
    if (sliderYValue < 0) return;

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

    // Asegurar que Y sea el del slider y positivo
    startPoint.y = Math.max(sliderYValue, 0);

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
  // Asegurar que Y sea positivo
  endPoint.y = Math.max(sliderYValue, 0);

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
    resetButtonColor(); // Cambia el color del botón de vuelta a azul
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

function enableDrawing() {
  drawingEnabled = true;
  document.getElementById("drawButton").style.backgroundColor = "#28a745";
}
function resetButtonColor() {
  document.getElementById("drawButton").style.backgroundColor = "#007bff"; // Azul por defecto
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
      start.y >= 0 && start.y <= halfSize &&
      start.z >= -halfSize && start.z <= halfSize &&
      end.x >= -halfSize && end.x <= halfSize &&
      end.y >= 0 && end.y <= halfSize &&
      end.z >= -halfSize && end.z <= halfSize
    ) {
      const lineMaterial = new THREE.LineBasicMaterial({ color: '#000000' });
      const points = [start, end];  // Aquí es donde se corrige
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(lineGeometry, lineMaterial);
      scene.add(line);
      lines.push(line);
      // Crear puntos visuales
  createPointMesh(start);
  createPointMesh(end);

  // Almacenar puntos en la lista
  existingPoints.push(start);
  existingPoints.push(end);
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