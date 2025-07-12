// Enhanced Babylon.js Digital Twin JavaScript
let engine, scene, camera, sensorData = {};
let machineGroup, currentMachine = 'robot';
let animationRunning = true;
let rotatingParts = [];
let shadowGenerator = null;

// Initialize Babylon.js scene when page loads
document.addEventListener('DOMContentLoaded', function() {
    initBabylonScene();
    setupEventListeners();
    startDataUpdates();
});

// Initialize Babylon.js scene
function initBabylonScene() {
    const canvas = document.getElementById('twin-canvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    try {
        engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
        scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color3(0.05, 0.09, 0.16);

        // Create camera - using proper Babylon.js syntax
        camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3, 10, BABYLON.Vector3.Zero(), scene);
        camera.setTarget(BABYLON.Vector3.Zero());

        // Properly attach controls
        if (camera.attachControls) {
            camera.attachControls(canvas, true);
        }

        // Enhanced lighting
        setupEnhancedLighting();

        // Create machine
        createEnhancedMachine();

        // Start render loop
        engine.runRenderLoop(() => {
            if (animationRunning) {
                animateMachine();
            }
            updatePerformanceDisplay();
            scene.render();
        });

        // Handle resize
        window.addEventListener("resize", () => {
            engine.resize();
        });

        // Setup VR
        setupVR();

        console.log("Babylon.js scene initialized successfully");

    } catch (error) {
        console.error('Error initializing Babylon.js scene:', error);
    }
}

function setupVR() {
    // Initialize VR helper
    if (scene.createDefaultXRExperienceAsync) {
        scene.createDefaultXRExperienceAsync().then((xrExperience) => {
            vrHelper = xrExperience;
            console.log("VR initialized successfully");
        }).catch((error) => {
            console.log("VR not supported:", error);
            setupBasicVR();
        });
    } else {
        setupBasicVR();
    }
}

function setupBasicVR() {
    // Basic VR fallback using device orientation
    if (BABYLON.DeviceOrientationCamera) {
        const vrCamera = new BABYLON.DeviceOrientationCamera("vrCamera", new BABYLON.Vector3(0, 5, -10), scene);
        vrCamera.setTarget(BABYLON.Vector3.Zero());
    }
}

function setupEnhancedLighting() {
    // Ambient light
    const ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.4;

    // Main directional light
    const directionalLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -1, -1), scene);
    directionalLight.intensity = 1.2;
    directionalLight.shadowMinZ = 1;
    directionalLight.shadowMaxZ = 2500;

    // Create shadow generator if supported
    try {
        shadowGenerator = new BABYLON.ShadowGenerator(1024, directionalLight);
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.blurKernel = 32;
    } catch (error) {
        console.log("Shadow generation not supported");
    }

    // Point lights for atmosphere
    const pointLight1 = new BABYLON.PointLight("pointLight1", new BABYLON.Vector3(10, 10, 0), scene);
    pointLight1.diffuse = new BABYLON.Color3(0.2, 0.4, 1);
    pointLight1.intensity = 0.6;

    const pointLight2 = new BABYLON.PointLight("pointLight2", new BABYLON.Vector3(-10, 5, 10), scene);
    pointLight2.diffuse = new BABYLON.Color3(1, 0.4, 0.2);
    pointLight2.intensity = 0.4;
}

function createEnhancedMachine() {
    // Clear existing machine
    if (machineGroup) {
        machineGroup.dispose();
    }

    machineGroup = new BABYLON.TransformNode("machineGroup", scene);
    rotatingParts = [];

    // Create different machine types based on selection
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

    // Add ground
    createEnhancedGround();

    // Add shadows if available
    if (shadowGenerator) {
        scene.meshes.forEach(mesh => {
            if (mesh.name !== 'ground') {
                shadowGenerator.addShadowCaster(mesh);
            }
        });
    }
}

function createRoboticArm() {
    // Base
    const base = BABYLON.MeshBuilder.CreateCylinder("base", {height: 1, diameter: 2}, scene);
    base.position.y = 0.5;
    base.parent = machineGroup;

    // Enhanced material
    const baseMaterial = new BABYLON.StandardMaterial("baseMaterial", scene);
    baseMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.8);
    baseMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    base.material = baseMaterial;

    // Rotating base
    const rotatingBase = BABYLON.MeshBuilder.CreateCylinder("rotatingBase", {height: 0.2, diameter: 1.8}, scene);
    rotatingBase.position.y = 1.1;
    rotatingBase.parent = machineGroup;
    rotatingBase.material = baseMaterial;
    rotatingParts.push({mesh: rotatingBase, axis: 'y', speed: 0.02, originalPosition: rotatingBase.position.clone()});

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

        rotatingParts.push({mesh: segment, axis: 'z', speed: 0.01 + i * 0.005, originalPosition: segment.position.clone()});

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
    rotatingParts.push({mesh: endEffector, axis: 'x', speed: 0.03, originalPosition: endEffector.position.clone()});

    // Add sensor indicators
    createSensorIndicators();
}

function createWindTurbine() {
    // Tower
    const tower = BABYLON.MeshBuilder.CreateCylinder("tower", {height: 8, diameterTop: 0.8, diameterBottom: 1.2}, scene);
    tower.position.y = 4;
    tower.parent = machineGroup;

    const towerMaterial = new BABYLON.StandardMaterial("towerMaterial", scene);
    towerMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);
    tower.material = towerMaterial;

    // Nacelle
    const nacelle = BABYLON.MeshBuilder.CreateBox("nacelle", {width: 3, height: 1, depth: 1}, scene);
    nacelle.position.y = 8;
    nacelle.parent = machineGroup;
    nacelle.material = towerMaterial;

    // Hub
    const hub = BABYLON.MeshBuilder.CreateSphere("hub", {diameter: 0.8}, scene);
    hub.position = new BABYLON.Vector3(1.5, 8, 0);
    hub.parent = machineGroup;

    const hubMaterial = new BABYLON.PBRMaterial("hubMaterial", scene);
    hubMaterial.baseColor = new BABYLON.Color3(0.8, 0.8, 0.9);
    hubMaterial.metallic = 0.9;
    hubMaterial.roughness = 0.1;
    hub.material = hubMaterial;

    rotatingParts.push({mesh: hub, axis: 'x', speed: 0.05, originalPosition: hub.position.clone()});

    // Blades
    for (let i = 0; i < 3; i++) {
        const blade = BABYLON.MeshBuilder.CreateBox("blade" + i, {width: 0.1, height: 4, depth: 0.5}, scene);
        blade.position = new BABYLON.Vector3(1.5, 10, 0);
        blade.rotation.x = (i * Math.PI * 2 / 3);
        blade.parent = hub;

        const bladeMaterial = new BABYLON.PBRMaterial("bladeMaterial", scene);
        bladeMaterial.baseColor = new BABYLON.Color3(0.8, 0.8, 0.9);
        bladeMaterial.metallic = 0.2;
        bladeMaterial.roughness = 0.8;
        blade.material = bladeMaterial;
    }

    createSensorIndicators();
}

function createCNCMachine() {
    // CNC Base
    const base = BABYLON.MeshBuilder.CreateBox("cncBase", {width: 3, height: 0.5, depth: 2}, scene);
    base.position.y = 0.25;
    base.parent = machineGroup;

    const baseMaterial = new BABYLON.StandardMaterial("cncBaseMaterial", scene);
    baseMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.8);
    base.material = baseMaterial;

    // Spindle housing
    const housing = BABYLON.MeshBuilder.CreateBox("housing", {width: 0.8, height: 1.5, depth: 0.8}, scene);
    housing.position.set(0, 1.25, 0);
    housing.parent = machineGroup;
    housing.material = baseMaterial;

    // Rotating spindle
    const spindle = BABYLON.MeshBuilder.CreateCylinder("spindle", {height: 1, diameter: 0.1}, scene);
    spindle.position.set(0, 0.75, 0);
    spindle.parent = machineGroup;

    const spindleMaterial = new BABYLON.StandardMaterial("spindleMaterial", scene);
    spindleMaterial.diffuseColor = new BABYLON.Color3(1, 0.3, 0.3);
    spindle.material = spindleMaterial;
    rotatingParts.push({mesh: spindle, axis: 'y', speed: 0.3, originalPosition: spindle.position.clone()});

    // Work table
    const table = BABYLON.MeshBuilder.CreateBox("table", {width: 2, height: 0.2, depth: 1.5}, scene);
    table.position.y = 0.6;
    table.parent = machineGroup;

    const tableMaterial = new BABYLON.StandardMaterial("tableMaterial", scene);
    tableMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.6);
    table.material = tableMaterial;

    createSensorIndicators();
}

function createConveyorSystem() {
    // Belt
    const belt = BABYLON.MeshBuilder.CreateBox("belt", {width: 6, height: 0.2, depth: 1}, scene);
    belt.position.y = 0.6;
    belt.parent = machineGroup;

    const beltMaterial = new BABYLON.StandardMaterial("beltMaterial", scene);
    beltMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    belt.material = beltMaterial;

    // Rollers
    for (let i = 0; i < 7; i++) {
        const roller = BABYLON.MeshBuilder.CreateCylinder("roller" + i, {height: 1.2, diameter: 0.2}, scene);
        roller.position.set(-2.5 + i * 0.8, 0.5, 0);
        roller.rotation.z = Math.PI / 2;
        roller.parent = machineGroup;

        const rollerMaterial = new BABYLON.StandardMaterial("rollerMaterial", scene);
        rollerMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.7);
        roller.material = rollerMaterial;
        rotatingParts.push({mesh: roller, axis: 'z', speed: 0.05, originalPosition: roller.position.clone()});
    }

    // Moving packages
    for (let i = 0; i < 3; i++) {
        const package = BABYLON.MeshBuilder.CreateBox("package" + i, {width: 0.3, height: 0.3, depth: 0.3}, scene);
        package.position.set(-2 + i * 1.5, 0.85, 0);
        package.parent = machineGroup;

        const packageMaterial = new BABYLON.StandardMaterial("packageMaterial", scene);
        packageMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.5, 0.2);
        package.material = packageMaterial;
        rotatingParts.push({
            mesh: package, 
            axis: 'move', 
            speed: 0.02, 
            moveDirection: new BABYLON.Vector3(1, 0, 0),
            originalPosition: package.position.clone()
        });
    }

    createSensorIndicators();
}

function createAssemblyStation() {
    // Platform
    const platform = BABYLON.MeshBuilder.CreateBox("platform", {width: 2.5, height: 0.3, depth: 2.5}, scene);
    platform.position.y = 0.15;
    platform.parent = machineGroup;

    const platformMaterial = new BABYLON.StandardMaterial("platformMaterial", scene);
    platformMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.8);
    platform.material = platformMaterial;

    // Assembly arms
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const armBase = BABYLON.MeshBuilder.CreateCylinder("armBase" + i, {height: 0.5, diameter: 0.2}, scene);
        armBase.position.set(Math.cos(angle) * 0.8, 0.55, Math.sin(angle) * 0.8);
        armBase.parent = machineGroup;

        const arm = BABYLON.MeshBuilder.CreateBox("arm" + i, {width: 0.8, height: 0.1, depth: 0.1}, scene);
        arm.position.set(Math.cos(angle) * 1.2, 0.8, Math.sin(angle) * 1.2);
        arm.parent = machineGroup;

        const armMaterial = new BABYLON.StandardMaterial("armMaterial", scene);
        armMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.3, 0.8);
        arm.material = armMaterial;
        armBase.material = armMaterial;

        rotatingParts.push({mesh: arm, axis: 'y', speed: 0.02 + i * 0.01, originalPosition: arm.position.clone()});
    }

    // Central assembly point
    const center = BABYLON.MeshBuilder.CreateCylinder("center", {height: 0.3, diameter: 0.4}, scene);
    center.position.y = 0.45;
    center.parent = machineGroup;

    const centerMaterial = new BABYLON.StandardMaterial("centerMaterial", scene);
    centerMaterial.diffuseColor = new BABYLON.Color3(1, 0.3, 0.3);
    center.material = centerMaterial;
    rotatingParts.push({mesh: center, axis: 'y', speed: 0.08, originalPosition: center.position.clone()});

    createSensorIndicators();
}

function createHydraulicPress() {
    // Frame
    const frame = BABYLON.MeshBuilder.CreateBox("frame", {width: 2, height: 3, depth: 1.5}, scene);
    frame.position.y = 1.5;
    frame.parent = machineGroup;

    const frameMaterial = new BABYLON.StandardMaterial("frameMaterial", scene);
    frameMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.2, 0.3);
    frame.material = frameMaterial;

    // Hydraulic cylinder
    const cylinder = BABYLON.MeshBuilder.CreateCylinder("cylinder", {height: 1.5, diameter: 0.4}, scene);
    cylinder.position.set(0, 2.5, 0);
    cylinder.parent = machineGroup;

    const cylinderMaterial = new BABYLON.StandardMaterial("cylinderMaterial", scene);
    cylinderMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.7);
    cylinder.material = cylinderMaterial;

    // Press head (moving part)
    const head = BABYLON.MeshBuilder.CreateBox("head", {width: 1.5, height: 0.3, depth: 1.2}, scene);
    head.position.set(0, 1.8, 0);
    head.parent = machineGroup;

    const headMaterial = new BABYLON.StandardMaterial("headMaterial", scene);
    headMaterial.diffuseColor = new BABYLON.Color3(1, 0.3, 0.3);
    head.material = headMaterial;
    rotatingParts.push({
        mesh: head, 
        axis: 'oscillate', 
        speed: 0.03, 
        oscillateAxis: 'y',
        oscillateAmount: 0.5,
        originalPosition: head.position.clone()
    });

    // Base plate
    const baseplate = BABYLON.MeshBuilder.CreateBox("baseplate", {width: 1.8, height: 0.2, depth: 1.4}, scene);
    baseplate.position.y = 0.6;
    baseplate.parent = machineGroup;

    const baseMaterial = new BABYLON.StandardMaterial("baseMaterial", scene);
    baseMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.5);
    baseplate.material = baseMaterial;

    createSensorIndicators();
}

function createChemicalReactor() {
    // Main reactor vessel
    const vessel = BABYLON.MeshBuilder.CreateCylinder("vessel", {height: 4, diameter: 2.5}, scene);
    vessel.position.y = 2;
    vessel.parent = machineGroup;

    const vesselMaterial = new BABYLON.StandardMaterial("vesselMaterial", scene);
    vesselMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.9);
    vessel.material = vesselMaterial;

    // Stirrer
    const stirrer = BABYLON.MeshBuilder.CreateCylinder("stirrer", {height: 3.5, diameter: 0.1}, scene);
    stirrer.position.y = 2;
    stirrer.parent = machineGroup;

    const stirrerMaterial = new BABYLON.StandardMaterial("stirrerMaterial", scene);
    stirrerMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    stirrer.material = stirrerMaterial;
    rotatingParts.push({mesh: stirrer, axis: 'y', speed: 0.15, originalPosition: stirrer.position.clone()});

    // Stirrer blades
    for (let i = 0; i < 4; i++) {
        const blade = BABYLON.MeshBuilder.CreateBox("stirrerBlade" + i, {width: 0.8, height: 0.1, depth: 0.05}, scene);
        blade.position.set(0, 0.5 + i * 0.8, 0);
        blade.rotation.y = (i * Math.PI / 2);
        blade.parent = stirrer;

        const bladeMaterial = new BABYLON.StandardMaterial("bladeMaterial", scene);
        bladeMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        blade.material = bladeMaterial;
    }

    // Pipes
    for (let i = 0; i < 3; i++) {
        const pipe = BABYLON.MeshBuilder.CreateCylinder("pipe" + i, {height: 1, diameter: 0.2}, scene);
        const angle = (i / 3) * Math.PI * 2;
        pipe.position.set(Math.cos(angle) * 1.5, 3 + i * 0.3, Math.sin(angle) * 1.5);
        pipe.rotation.z = Math.PI / 2;
        pipe.parent = machineGroup;

        const pipeMaterial = new BABYLON.StandardMaterial("pipeMaterial", scene);
        pipeMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.6, 0.3);
        pipe.material = pipeMaterial;
    }

    createSensorIndicators();
}

function createSensorIndicators() {
    // Temperature sensor - glowing red
    const tempSensor = BABYLON.MeshBuilder.CreateSphere("tempSensor", {diameter: 0.2}, scene);
    tempSensor.position.set(0.8, 1.2, 0.8);
    tempSensor.parent = machineGroup;

    const tempMaterial = new BABYLON.StandardMaterial("tempMaterial", scene);
    tempMaterial.diffuseColor = new BABYLON.Color3(1, 0.3, 0.3);
    tempMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.1, 0.1);
    tempSensor.material = tempMaterial;
    rotatingParts.push({mesh: tempSensor, axis: 'pulse', speed: 0.05, originalPosition: tempSensor.position.clone()});

    // Pressure sensor - glowing blue
    const pressureSensor = BABYLON.MeshBuilder.CreateSphere("pressureSensor", {diameter: 0.2}, scene);
    pressureSensor.position.set(-0.8, 1.2, 0.8);
    pressureSensor.parent = machineGroup;

    const pressureMaterial = new BABYLON.StandardMaterial("pressureMaterial", scene);
    pressureMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 1);
    pressureMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.5);
    pressureSensor.material = pressureMaterial;
    rotatingParts.push({mesh: pressureSensor, axis: 'pulse', speed: 0.07, originalPosition: pressureSensor.position.clone()});

    // Vibration sensor - constantly moving
    const vibrationSensor = BABYLON.MeshBuilder.CreateSphere("vibrationSensor", {diameter: 0.2}, scene);
    vibrationSensor.position.set(0, 1.2, -0.8);
    vibrationSensor.parent = machineGroup;

    const vibrationMaterial = new BABYLON.PBRMaterial("vibrationMaterial", scene);
    vibrationMaterial.baseColor = new BABYLON.Color3(1, 0.7, 0.2);
    vibrationMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.3, 0.1);
    vibrationSensor.material = vibrationMaterial;
    rotatingParts.push({mesh: vibrationSensor, axis: 'vibrate', speed: 0.1, originalPosition: vibrationSensor.position.clone()});
}

function createEnhancedGround() {
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, scene);

    const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.15, 0.2);
    ground.material = groundMaterial;

    if (shadowGenerator) {
        ground.receiveShadows = true;
    }
}

function animateMachine() {
    const time = performance.now() * 0.001;

    rotatingParts.forEach(part => {
        switch(part.axis) {
            case 'x':
                part.mesh.rotation.x += part.speed;
                break;
            case 'y':
                part.mesh.rotation.y += part.speed;
                break;
            case 'z':
                part.mesh.rotation.z += part.speed;
                break;
            case 'move':
                part.mesh.position.x += part.speed;
                if (part.mesh.position.x > 3) {
                    part.mesh.position.x = -3;
                }
                break;
            case 'oscillate':
                const oscillation = Math.sin(time * part.speed * 10) * part.oscillateAmount;
                if (part.oscillateAxis === 'y') {
                    part.mesh.position.y = part.originalPosition.y + oscillation;
                }
                break;
            case 'pulse':
                const pulse = Math.sin(time * part.speed * 20) * 0.1 + 1;
                part.mesh.scaling = new BABYLON.Vector3(pulse, pulse, pulse);
                break;
            case 'vibrate':
                const vibrateX = (Math.random() - 0.5) * 0.02;
                const vibrateZ = (Math.random() - 0.5) * 0.02;
                part.mesh.position.x = part.originalPosition.x + vibrateX;
                part.mesh.position.z = part.originalPosition.z + vibrateZ;
                break;
        }
    });

    // Update sensor-based effects
    updateSensorEffects();
}

function updateSensorEffects() {
    if (sensorData.vibration > 0.8 && machineGroup) {
        // Add machine vibration effect
        const vibrationOffset = (Math.random() - 0.5) * 0.02;
        machineGroup.position.x = vibrationOffset;
        machineGroup.position.z = vibrationOffset;
    } else if (machineGroup) {
        // Reset position when vibration is low
        machineGroup.position.x = 0;
        machineGroup.position.z = 0;
    }
}

function updatePerformanceDisplay() {
    try {
        const fpsElement = document.getElementById('fpsDisplay');
        const drawCallsElement = document.getElementById('drawCallsDisplay');
        const trianglesElement = document.getElementById('trianglesDisplay');

        if (fpsElement) fpsElement.textContent = Math.round(engine.getFps());
        if (drawCallsElement) drawCallsElement.textContent = scene.getActiveMeshes().length;
        if (trianglesElement) trianglesElement.textContent = scene.getTotalVertices();
    } catch (error) {
        // Silently handle display update errors
    }
}

// Event listeners setup
function setupEventListeners() {
    // Machine selection
    const machineSelect = document.getElementById('machineSelect');
    if (machineSelect) {
        machineSelect.addEventListener('change', function(e) {
            currentMachine = e.target.value;
            switchMachine(currentMachine);
        });
    }

    // VR toggle
    document.getElementById('toggleVR').addEventListener('click', function() {
        if (vrHelper && vrHelper.baseExperience) {
            vrHelper.baseExperience.enterXRAsync("immersive-vr", "local-floor").then(() => {
                console.log("Entered VR mode");
            }).catch((error) => {
                console.log("VR entry failed:", error);
                simulateVRMode();
            });
        } else {
            simulateVRMode();
        }
    });

    // Graphics controls
    const lightingControl = document.getElementById('lightingControl');
    if (lightingControl) {
        lightingControl.addEventListener('input', function(e) {
            const intensity = e.target.value / 100;
            scene.lights.forEach(light => {
                if (light instanceof BABYLON.DirectionalLight) {
                    light.intensity = intensity * 1.2;
                }
            });
            const lightingValue = document.getElementById('lightingValue');
            if (lightingValue) lightingValue.textContent = e.target.value + '%';
        });
    }

    document.getElementById('fovControl').addEventListener('input', function(e) {
        camera.fov = (e.target.value * Math.PI) / 180;
        document.getElementById('fovValue').textContent = e.target.value + '°';
    });

    // Animation toggle
    const animationToggle = document.getElementById('animationToggle');
    if (animationToggle) {
        animationToggle.addEventListener('change', function(e) {
            animationRunning = e.target.checked;
        });
    }

    // Screenshot
    document.getElementById('captureScreenshot').addEventListener('click', function() {
        BABYLON.ScreenshotTools.CreateScreenshotUsingRenderTarget(engine, camera, 1920);
    });

    // Reset view
    document.getElementById('resetView').addEventListener('click', resetView);

    // View buttons
    const frontView = document.getElementById('frontView');
    const topView = document.getElementById('topView');
    const sideView = document.getElementById('sideView');
    const isoView = document.getElementById('isoView');
    const resetViewButton = document.getElementById('resetView');

    if (frontView) frontView.addEventListener('click', () => setView('front'));
    if (topView) topView.addEventListener('click', () => setView('top'));
    if (sideView) sideView.addEventListener('click', () => setView('side'));
    if (isoView) isoView.addEventListener('click', () => setView('iso'));
    if (resetViewButton) resetViewButton.addEventListener('click', resetCameraView);

    // Additional controls
    setupAdditionalControls();

    console.log("Event listeners setup complete");
}

function setupAdditionalControls() {
    // Wireframe toggle
    const wireframeToggle = document.getElementById('wireframeToggle');
    if (wireframeToggle) {
        wireframeToggle.addEventListener('change', function(e) {
            scene.meshes.forEach(mesh => {
                if (mesh.material) {
                    mesh.material.wireframe = e.target.checked;
                }
            });
        });
    }

    // Particles toggle
    const particlesToggle = document.getElementById('particlesToggle');
    if (particlesToggle) {
        particlesToggle.addEventListener('change', function(e) {
            // Add particle system toggle logic here
            console.log('Particles toggled:', e.target.checked);
        });
    }

    // Material selection
    const materialSelect = document.getElementById('materialSelect');
    if (materialSelect) {
        materialSelect.addEventListener('change', function(e) {
            updateMaterialStyle(e.target.value);
        });
    }

    // Post-processing effects
    const postProcessSelect = document.getElementById('postProcessSelect');
    if (postProcessSelect) {
        postProcessSelect.addEventListener('change', function(e) {
            updatePostProcessing(e.target.value);
        });
    }

    // Quality settings
    const qualitySelect = document.getElementById('qualitySelect');
    if (qualitySelect) {
        qualitySelect.addEventListener('change', function(e) {
            updateQuality(e.target.value);
        });
    }
}

function updateMaterialStyle(style) {
    scene.meshes.forEach(mesh => {
        if (mesh.material && mesh.material instanceof BABYLON.StandardMaterial) {
            switch(style) {
                case 'metallic':
                    mesh.material.specularColor = new BABYLON.Color3(0.9, 0.9, 0.9);
                    break;
                case 'carbon':
                    mesh.material.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                    break;
                case 'glass':
                    mesh.material.alpha = 0.3;
                    break;
                case 'ceramic':
                    mesh.material.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.8);
                    break;
                default:
                    mesh.material.alpha = 1.0;
                    break;
            }
        } else if (mesh.material && mesh.material instanceof BABYLON.PBRMaterial) {
            switch(style) {
                case 'metallic':
                    mesh.material.metallic = 0.9;
                    mesh.material.roughness = 0.1;
                    break;
                case 'carbon':
                    mesh.material.baseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                    mesh.material.metallic = 0.8;
                    mesh.material.roughness = 0.3;
                    break;
                case 'glass':
                    mesh.material.baseColor = new BABYLON.Color3(0.8, 0.9, 1);
                    mesh.material.metallic = 0.1;
                    mesh.material.roughness = 0.0;
                    mesh.material.alpha = 0.3;
                    break;
                case 'ceramic':
                    mesh.material.baseColor = new BABYLON.Color3(0.9, 0.9, 0.8);
                    mesh.material.metallic = 0.0;
                    mesh.material.roughness = 0.8;
                    break;
                default:
                    // Reset to standard
                    mesh.material.alpha = 1.0;
                    break;
            }
        }
    });
}

function updatePostProcessing(effect) {
    // Clear existing post-processing
    scene.postProcessRenderPipelineManager.dispose();

    switch(effect) {
        case 'bloom':
            const bloomPipeline = new BABYLON.DefaultRenderingPipeline("bloom", true, scene, [camera]);
            bloomPipeline.bloomEnabled = true;
            bloomPipeline.bloomThreshold = 0.8;
            bloomPipeline.bloomWeight = 0.3;
            break;
        case 'ssao':
            const ssaoPipeline = new BABYLON.DefaultRenderingPipeline("ssao", true, scene, [camera]);
            ssaoPipeline.samples = 32;
            break;
        case 'outline':
            // Enable outline rendering
            scene.meshes.forEach(mesh => {
                mesh.renderOutline = true;
                mesh.outlineColor = new BABYLON.Color3(1, 1, 0);
                mesh.outlineWidth = 0.02;
            });
            break;
        case 'all':
            const fullPipeline = new BABYLON.DefaultRenderingPipeline("full", true, scene, [camera]);
            fullPipeline.bloomEnabled = true;
            fullPipeline.samples = 32;
            break;
    }
}

function updateQuality(quality) {
    switch(quality) {
        case 'low':
            engine.setHardwareScalingLevel(2);
            if (shadowGenerator) shadowGenerator.mapSize = 512;
            break;
        case 'medium':
            engine.setHardwareScalingLevel(1);
            if (shadowGenerator) shadowGenerator.mapSize = 1024;
            break;
        case 'high':
            engine.setHardwareScalingLevel(0.5);
            if (shadowGenerator) shadowGenerator.mapSize = 2048;
            break;
        case 'ultra':
            engine.setHardwareScalingLevel(0.25);
            if (shadowGenerator) shadowGenerator.mapSize = 4096;
            break;
    }
}

function simulateVRMode() {
    // Simulate VR by changing camera position and FOV
    camera.fov = Math.PI / 2; // Wider FOV for VR feel
    camera.position = new BABYLON.Vector3(0, 2, -5);
    camera.setTarget(new BABYLON.Vector3(0, 1, 0));
    alert("VR Mode Simulated! Use mouse to look around in VR perspective.");
}

function switchMachine(machineType) {
    currentMachine = machineType;
    createEnhancedMachine();
    console.log("Switched to machine:", machineType);
}

function setView(viewType) {
    if (!camera) return;

    switch (viewType) {
        case 'front':
            camera.position = new BABYLON.Vector3(0, 2, 8);
            camera.setTarget(new BABYLON.Vector3(0, 1, 0));
            break;
        case 'top':
            camera.position = new BABYLON.Vector3(0, 10, 0);
            camera.setTarget(new BABYLON.Vector3(0, 0, 0));
            break;
        case 'side':
            camera.position = new BABYLON.Vector3(8, 2, 0);
            camera.setTarget(new BABYLON.Vector3(0, 1, 0));
            break;
        case 'iso':
            camera.position = new BABYLON.Vector3(5, 5, 5);
            camera.setTarget(new BABYLON.Vector3(0, 1, 0));
            break;
    }
}

function resetCameraView() {
    if (!camera) return;

    camera.position = new BABYLON.Vector3(5, 5, 5);
    camera.setTarget(new BABYLON.Vector3(0, 1, 0));
    if (camera.fov) camera.fov = Math.PI / 4;
}

// Data updates
function startDataUpdates() {
    updateSensorData();
    setInterval(updateSensorData, 3000);
}

async function updateSensorData() {
    try {
        const response = await fetch('/api/twin-data');
        const data = await response.json();
        sensorData = data;

        updateSensorDisplay(data);
        updateSensorVisualization(data);

    } catch (error) {
        console.error('Error updating twin data:', error);
        // Use random data if API fails
        sensorData = {
            temperature: Math.random() * 100 + 50,
            pressure: Math.random() * 3 + 0.5,
            vibration: Math.random() * 1.5,
            rpm: Math.random() * 2000 + 1000,
            power: Math.random() * 150 + 50,
            status: ['Operating', 'Warning', 'Critical'][Math.floor(Math.random() * 3)]
        };
        updateSensorDisplay(sensorData);
        updateSensorVisualization(sensorData);
    }
}

function updateSensorDisplay(data) {
    const elements = {
        twinTemp: document.getElementById('twinTemp'),
        twinPressure: document.getElementById('twinPressure'),
        twinVibration: document.getElementById('twinVibration'),
        twinRpm: document.getElementById('twinRpm'),
        twinPower: document.getElementById('twinPower'),
        tempBar: document.getElementById('tempBar'),
        pressureBar: document.getElementById('pressureBar'),
        vibrationBar: document.getElementById('vibrationBar'),
        rpmBar: document.getElementById('rpmBar'),
        powerBar: document.getElementById('powerBar'),
        twinStatus: document.getElementById('twinStatus')
    };

    if (elements.twinTemp) elements.twinTemp.textContent = `${Math.round(data.temperature)}°F`;
    if (elements.twinPressure) elements.twinPressure.textContent = `${data.pressure.toFixed(1)} bar`;
    if (elements.twinVibration) elements.twinVibration.textContent = `${data.vibration.toFixed(2)}`;
    if (elements.twinRpm) elements.twinRpm.textContent = `${Math.round(data.rpm)} rpm`;
    if (elements.twinPower) elements.twinPower.textContent = `${Math.round(data.power)} kW`;

    // Update progress bars
    if (elements.tempBar) elements.tempBar.style.width = `${Math.min(100, (data.temperature / 150) * 100)}%`;
    if (elements.pressureBar) elements.pressureBar.style.width = `${Math.min(100, (data.pressure / 3) * 100)}%`;
    if (elements.vibrationBar) elements.vibrationBar.style.width = `${Math.min(100, (data.vibration / 1.5) * 100)}%`;
    if (elements.rpmBar) elements.rpmBar.style.width = `${Math.min(100, (data.rpm / 3000) * 100)}%`;
    if (elements.powerBar) elements.powerBar.style.width = `${Math.min(100, (data.power / 200) * 100)}%`;

    // Update status
    if (elements.twinStatus) {
        elements.twinStatus.innerHTML = `<i class="fas fa-circle mr-1"></i>${data.status}`;

        // Set status color based on status
        elements.twinStatus.className = 'px-2 py-1 rounded-full text-xs font-semibold';
        if (data.status === 'Operating') {
            elements.twinStatus.className += ' bg-green-500/20 text-green-400';
        } else if (data.status === 'Warning') {
            elements.twinStatus.className += ' bg-yellow-500/20 text-yellow-400';
        } else {
            elements.twinStatus.className += ' bg-red-500/20 text-red-400';
        }
    }
}

function updateSensorVisualization(data) {
    updateSensorEffects();

    // Update machine colors based on status
    if (machineGroup && machineGroup.getChildren) {
        machineGroup.getChildren().forEach(child => {
            if (child.material && child.material.baseColor) {
                switch (data.status) {
                    case 'Operating':
                        if (child.name.includes('base') || child.name.includes('main')) {
                            child.material.baseColor = new BABYLON.Color3(0.2, 0.8, 0.3);
                        }
                        break;
                    case 'Warning':
                        if (child.name.includes('base') || child.name.includes('main')) {
                            child.material.baseColor = new BABYLON.Color3(1, 0.7, 0.2);
                        }
                        break;
                    case 'Critical':
                        if (child.name.includes('base') || child.name.includes('main')) {
                            child.material.baseColor = new BABYLON.Color3(1, 0.3, 0.3);
                        }
                        break;
                }
            }
        });
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (engine) {
        engine.dispose();
    }
});