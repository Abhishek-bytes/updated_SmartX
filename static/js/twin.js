// Global variables
let engine, scene, camera, sensorData = {};
let machineGroup, currentMachine = 'robot';
let animationRunning = true;
let rotatingParts = [];
let vrHelper = null;
let ground; // Store ground reference

// Initialize Babylon.js scene
function initBabylonScene() {
    const canvas = document.getElementById('twin-canvas');
    engine = new BABYLON.Engine(canvas, true, { 
        preserveDrawingBuffer: true, 
        stencil: true 
    });

    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.05, 0.09, 0.16);

    // Create ground before machines
    createEnhancedGround();

    // Enhanced camera
    camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3, 15, BABYLON.Vector3.Zero(), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);
    camera.minZ = 0.1;
    camera.wheelPrecision = 50;

    // Enhanced lighting
    setupEnhancedLighting();

    // Create machine
    createEnhancedMachine();

    // Start render loop
    engine.runRenderLoop(() => {
        updatePerformanceDisplay();
        if (animationRunning) {
            animateMachine();
        }
        scene.render();
    });

    // Handle resize
    window.addEventListener("resize", () => {
        engine.resize();
    });

    // Setup VR
    setupVR();
}

function setupVR() {
    // VR initialization remains the same
}

function setupEnhancedLighting() {
    // Ambient light
    const ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.4;

    // Main directional light with shadows
    const directionalLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -1, -1), scene);
    directionalLight.intensity = 1.2;
    directionalLight.position = new BABYLON.Vector3(0, 10, 0);

    // Enable shadows
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, directionalLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;
}

function createEnhancedMachine() {
    // Clean up previous machine
    if (machineGroup) {
        machineGroup.dispose();
    }

    machineGroup = new BABYLON.TransformNode("machineGroup", scene);
    rotatingParts = [];

    // Create different machine types
    switch(currentMachine) {
        case 'robot':
            createRoboticArm();
            break;
        case 'cnc':
            createCNCMachine();
            break;
        case 'turbine':
            createWindTurbine();
            break;
        case 'conveyor':
            createConveyorSystem();
            break;
        case 'assembly':
            createAssemblyStation();
            break;
        case 'press':
            createHydraulicPress();
            break;
        case 'reactor':
            createChemicalReactor();
            break;
        default:
            createRoboticArm();
    }
}

function createRoboticArm() {
    // Base
    const base = BABYLON.MeshBuilder.CreateCylinder("base", {height: 1, diameter: 2}, scene);
    base.position.y = 0.5;
    base.parent = machineGroup;

    // Material
    const baseMaterial = new BABYLON.StandardMaterial("baseMaterial", scene);
    baseMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.8);
    baseMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    base.material = baseMaterial;

    // Rotating base
    const rotatingBase = BABYLON.MeshBuilder.CreateCylinder("rotatingBase", {height: 0.2, diameter: 1.8}, scene);
    rotatingBase.position.y = 1.1;
    rotatingBase.parent = machineGroup;
    rotatingBase.material = baseMaterial;
    rotatingParts.push({mesh: rotatingBase, axis: 'y', speed: 0.02});

    // Arm segments with joints
    for (let i = 0; i < 3; i++) {
        const segment = BABYLON.MeshBuilder.CreateBox("segment" + i, {width: 0.3, height: 1.5, depth: 0.3}, scene);
        segment.position.y = 1.5 + (i * 1.2);
        segment.rotation.z = Math.sin(Date.now() * 0.001 + i) * 0.3;
        segment.parent = machineGroup;

        const segmentMaterial = new BABYLON.StandardMaterial("segmentMaterial" + i, scene);
        segmentMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.6);
        segmentMaterial.specularColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        segment.material = segmentMaterial;

        rotatingParts.push({mesh: segment, axis: 'z', speed: 0.01 + i * 0.005});

        // Joint
        const joint = BABYLON.MeshBuilder.CreateSphere("joint" + i, {diameter: 0.4}, scene);
        joint.position.y = segment.position.y - 0.6;
        joint.parent = machineGroup;
        joint.material = baseMaterial;
    }

    // End effector
    const endEffector = BABYLON.MeshBuilder.CreateBox("endEffector", {width: 0.5, height: 0.2, depth: 0.2}, scene);
    endEffector.position.y = 5;
    endEffector.parent = machineGroup;
    endEffector.material = baseMaterial;
    rotatingParts.push({mesh: endEffector, axis: 'x', speed: 0.03});
}

// Other machine creation functions remain similar but ensure proper parenting to machineGroup

function createEnhancedGround() {
    if (ground) ground.dispose();

    ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, scene);
    const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.15, 0.2);
    ground.material = groundMaterial;
}

function animateMachine() {
    if (rotatingParts.length > 0) {
        const time = performance.now() * 0.001;

        rotatingParts.forEach(part => {
            if (part.axis === 'x') {
                part.mesh.rotation.x += part.speed;
            } else if (part.axis === 'y') {
                part.mesh.rotation.y += part.speed;
            } else if (part.axis === 'z') {
                part.mesh.rotation.z += part.speed;
            } else if (part.axis === 'move') {
                if (part.oscillate) {
                    const oscillation = Math.sin(time * part.speed * 10);
                    part.mesh.position.y = part.originalY + oscillation * 0.5;
                } else {
                    part.mesh.position.x += part.speed;
                    if (part.mesh.position.x > 3) {
                        part.mesh.position.x = -3;
                    }
                }
            }
        });
    }

    // Update sensor-based effects
    updateSensorEffects();
}

function updatePerformanceDisplay() {
    document.getElementById('fpsDisplay').textContent = Math.round(engine.getFps());
    document.getElementById('drawCallsDisplay').textContent = scene.getActiveMeshes().length;
    document.getElementById('trianglesDisplay').textContent = scene.getTotalVertices();
}

// Event listeners and API calls
document.addEventListener('DOMContentLoaded', function() {
    initBabylonScene();
    setupEventListeners();
    startDataUpdates();
});

function setupEventListeners() {
    // Machine selection
    document.getElementById('machineSelect').addEventListener('change', function(e) {
        currentMachine = e.target.value;
        switchMachine(currentMachine);
    });

    // VR toggle
    document.getElementById('toggleVR').addEventListener('click', function() {
        // VR implementation remains the same
    });

    // Graphics controls
    document.getElementById('lightingControl').addEventListener('input', function(e) {
        const intensity = e.target.value / 100;
        scene.lights.forEach(light => {
            if (light instanceof BABYLON.DirectionalLight) {
                light.intensity = intensity * 1.2;
            }
        });
        document.getElementById('lightingValue').textContent = e.target.value + '%';
    });

    document.getElementById('fovControl').addEventListener('input', function(e) {
        camera.fov = (e.target.value * Math.PI) / 180;
        document.getElementById('fovValue').textContent = e.target.value + '°';
    });

    // Animation toggle
    document.getElementById('animationToggle').addEventListener('change', function(e) {
        animationRunning = e.target.checked;
    });

    // Screenshot
    document.getElementById('captureScreenshot').addEventListener('click', function() {
        BABYLON.ScreenshotTools.CreateScreenshotUsingRenderTarget(engine, camera, 1920);
    });

    // Reset view
    document.getElementById('resetView').addEventListener('click', resetView);

    // View buttons
    document.getElementById('frontView').addEventListener('click', () => setView('front'));
    document.getElementById('topView').addEventListener('click', () => setView('top'));
    document.getElementById('sideView').addEventListener('click', () => setView('side'));
    document.getElementById('isoView').addEventListener('click', () => setView('iso'));
}

function switchMachine(machineType) {
    currentMachine = machineType;
    createEnhancedMachine();
}

function setView(viewType) {
    switch (viewType) {
        case 'front':
            camera.position = new BABYLON.Vector3(0, 2, 12);
            camera.setTarget(BABYLON.Vector3.Zero());
            break;
        case 'top':
            camera.position = new BABYLON.Vector3(0, 15, 0);
            camera.setTarget(BABYLON.Vector3.Zero());
            break;
        case 'side':
            camera.position = new BABYLON.Vector3(12, 2, 0);
            camera.setTarget(BABYLON.Vector3.Zero());
            break;
        case 'iso':
            camera.position = new BABYLON.Vector3(8, 8, 8);
            camera.setTarget(BABYLON.Vector3.Zero());
            break;
    }
}

function resetView() {
    camera.position = new BABYLON.Vector3(8, 8, 8);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.fov = Math.PI / 4;
}

// Data updates
function startDataUpdates() {
    updateSensorData();
    setInterval(updateSensorData, 3000);
}

async function updateSensorData() {
    try {
        // Simulated sensor data
        sensorData = {
            temperature: 75 + Math.random() * 10,
            pressure: 1.2 + Math.random() * 0.5,
            vibration: 0.5 + Math.random() * 0.5,
            rpm: 1200 + Math.random() * 600,
            power: 45 + Math.random() * 20,
            status: 'Operating'
        };

        updateSensorDisplay(sensorData);
        updateSensorVisualization(sensorData);

    } catch (error) {
        console.error('Error updating twin data:', error);
    }
}

function updateSensorDisplay(data) {
    document.getElementById('twinTemp').textContent = `${Math.round(data.temperature)}°F`;
    document.getElementById('twinPressure').textContent = `${data.pressure.toFixed(1)} bar`;
    document.getElementById('twinVibration').textContent = data.vibration.toFixed(2);
    document.getElementById('twinRpm').textContent = `${Math.round(data.rpm)} rpm`;
    document.getElementById('twinPower').textContent = `${Math.round(data.power)} kW`;

    // Update progress bars
    document.getElementById('tempBar').style.width = `${Math.min(100, (data.temperature / 100) * 100)}%`;
    document.getElementById('pressureBar').style.width = `${Math.min(100, (data.pressure / 3) * 100)}%`;
    document.getElementById('vibrationBar').style.width = `${Math.min(100, (data.vibration / 1.5) * 100)}%`;
    document.getElementById('rpmBar').style.width = `${Math.min(100, (data.rpm / 3000) * 100)}%`;
    document.getElementById('powerBar').style.width = `${Math.min(100, (data.power / 200) * 100)}%`;

    // Update status
    const statusElement = document.getElementById('twinStatus');
    statusElement.textContent = data.status;
    statusElement.className = `px-2 py-1 rounded-full text-xs font-semibold bg-${data.status.toLowerCase() === 'operating' ? 'green' : 'red'}-500/20 text-${data.status.toLowerCase() === 'operating' ? 'green' : 'red'}-400`;
}

function updateSensorVisualization(data) {
    // Add visual effects based on sensor data
    if (data.vibration > 0.8 && machineGroup) {
        const vibrationIntensity = (data.vibration - 0.8) * 0.5;
        machineGroup.position.x = Math.sin(Date.now() * 0.01) * vibrationIntensity;
        machineGroup.position.z = Math.cos(Date.now() * 0.01) * vibrationIntensity;
    } else {
        machineGroup.position.x = 0;
        machineGroup.position.z = 0;
    }
}