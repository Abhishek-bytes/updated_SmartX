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
    // Fixed: Use attachControl (singular) not attachControls
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
    // VR initialization - basic setup
    try {
        if (scene.createDefaultXRExperienceAsync) {
            scene.createDefaultXRExperienceAsync().then((xrExperience) => {
                vrHelper = xrExperience;
                console.log("VR initialized successfully");
            }).catch((error) => {
                console.log("VR not supported:", error);
            });
        }
    } catch (error) {
        console.log("VR setup error:", error);
    }
}

function setupEnhancedLighting() {
    // Ambient light
    const ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.6;

    // Main directional light with shadows
    const directionalLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -1, -1), scene);
    directionalLight.intensity = 1.5;
    directionalLight.position = new BABYLON.Vector3(0, 15, 0);

    // Additional lighting for better visibility
    const pointLight1 = new BABYLON.PointLight("pointLight1", new BABYLON.Vector3(10, 8, 5), scene);
    pointLight1.diffuse = new BABYLON.Color3(1, 1, 1);
    pointLight1.intensity = 0.8;

    const pointLight2 = new BABYLON.PointLight("pointLight2", new BABYLON.Vector3(-10, 8, -5), scene);
    pointLight2.diffuse = new BABYLON.Color3(0.8, 0.9, 1);
    pointLight2.intensity = 0.6;

    // Enable shadows
    try {
        const shadowGenerator = new BABYLON.ShadowGenerator(2048, directionalLight);
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.blurKernel = 32;
    } catch (error) {
        console.log("Shadow setup error:", error);
    }
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
            createAdvancedRoboticArm();
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
            createAdvancedRoboticArm();
    }
}

function createAdvancedRoboticArm() {
    // Create realistic 6-DOF robotic arm based on the GitHub repository design

    // Base platform
    const basePlatform = BABYLON.MeshBuilder.CreateCylinder("basePlatform", {
        height: 0.3, 
        diameterTop: 3.5, 
        diameterBottom: 4, 
        tessellation: 32
    }, scene);
    basePlatform.position.y = 0.15;
    basePlatform.parent = machineGroup;

    const baseMaterial = new BABYLON.StandardMaterial("baseMaterial", scene);
    baseMaterial.diffuseColor = new BABYLON.Color3(0.15, 0.2, 0.35);
    baseMaterial.specularColor = new BABYLON.Color3(0.8, 0.8, 0.9);
    baseMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.1);
    basePlatform.material = baseMaterial;

    // Main base column
    const baseColumn = BABYLON.MeshBuilder.CreateCylinder("baseColumn", {
        height: 2, 
        diameter: 2.5,
        tessellation: 24
    }, scene);
    baseColumn.position.y = 1.3;
    baseColumn.parent = machineGroup;
    baseColumn.material = baseMaterial;

    // Rotating base (Joint 1)
    const rotatingBase = BABYLON.MeshBuilder.CreateCylinder("rotatingBase", {
        height: 0.4, 
        diameter: 2.2,
        tessellation: 24
    }, scene);
    rotatingBase.position.y = 2.5;
    rotatingBase.parent = machineGroup;

    const joint1Material = new BABYLON.StandardMaterial("joint1Material", scene);
    joint1Material.diffuseColor = new BABYLON.Color3(0.8, 0.3, 0.2);
    joint1Material.specularColor = new BABYLON.Color3(1, 1, 1);
    joint1Material.emissiveColor = new BABYLON.Color3(0.1, 0.02, 0.02);
    rotatingBase.material = joint1Material;
    rotatingParts.push({mesh: rotatingBase, axis: 'y', speed: 0.015, name: 'base_rotation'});

    // Shoulder mount
    const shoulderMount = BABYLON.MeshBuilder.CreateBox("shoulderMount", {
        width: 1.8, 
        height: 1.2, 
        depth: 1.8
    }, scene);
    shoulderMount.position.y = 3.2;
    shoulderMount.parent = rotatingBase;

    const shoulderMaterial = new BABYLON.StandardMaterial("shoulderMaterial", scene);
    shoulderMaterial.diffuseColor = new BABYLON.Color3(0.25, 0.35, 0.6);
    shoulderMaterial.specularColor = new BABYLON.Color3(0.9, 0.9, 1);
    shoulderMaterial.emissiveColor = new BABYLON.Color3(0.02, 0.03, 0.06);
    shoulderMount.material = shoulderMaterial;

    // Shoulder joint (Joint 2)
    const shoulderJoint = BABYLON.MeshBuilder.CreateSphere("shoulderJoint", {
        diameter: 0.8,
        segments: 16
    }, scene);
    shoulderJoint.position.set(1.2, 0.6, 0);
    shoulderJoint.parent = shoulderMount;
    shoulderJoint.material = joint1Material;

    // Upper arm
    const upperArm = BABYLON.MeshBuilder.CreateBox("upperArm", {
        width: 0.6, 
        height: 3.5, 
        depth: 0.6
    }, scene);
    upperArm.position.set(1.2, 2.4, 0);
    upperArm.rotation.z = Math.PI / 6; // Initial angle
    upperArm.parent = shoulderMount;

    const armMaterial = new BABYLON.StandardMaterial("armMaterial", scene);
    armMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.75, 0.8);
    armMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
    armMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.08);
    upperArm.material = armMaterial;
    rotatingParts.push({mesh: upperArm, axis: 'z', speed: 0.008, name: 'shoulder_rotation'});

    // Elbow joint (Joint 3)
    const elbowJoint = BABYLON.MeshBuilder.CreateSphere("elbowJoint", {
        diameter: 0.7,
        segments: 16
    }, scene);
    elbowJoint.position.y = 1.8;
    elbowJoint.parent = upperArm;
    elbowJoint.material = joint1Material;

    // Forearm
    const forearm = BABYLON.MeshBuilder.CreateBox("forearm", {
        width: 0.5, 
        height: 2.8, 
        depth: 0.5
    }, scene);
    forearm.position.y = 2.2;
    forearm.rotation.z = -Math.PI / 8; // Initial angle
    forearm.parent = upperArm;
    forearm.material = armMaterial;
    rotatingParts.push({mesh: forearm, axis: 'z', speed: 0.012, name: 'elbow_rotation'});

    // Wrist assembly (Joint 4, 5, 6)
    const wristBase = BABYLON.MeshBuilder.CreateCylinder("wristBase", {
        height: 0.6, 
        diameter: 0.8,
        tessellation: 16
    }, scene);
    wristBase.position.y = 1.6;
    wristBase.parent = forearm;
    wristBase.material = shoulderMaterial;
    rotatingParts.push({mesh: wristBase, axis: 'y', speed: 0.025, name: 'wrist_rotation'});

    // Wrist pitch
    const wristPitch = BABYLON.MeshBuilder.CreateBox("wristPitch", {
        width: 0.7, 
        height: 0.4, 
        depth: 0.4
    }, scene);
    wristPitch.position.y = 0.4;
    wristPitch.parent = wristBase;
    wristPitch.material = armMaterial;
    rotatingParts.push({mesh: wristPitch, axis: 'x', speed: 0.018, name: 'wrist_pitch'});

    // End effector mount
    const endEffectorMount = BABYLON.MeshBuilder.CreateCylinder("endEffectorMount", {
        height: 0.3, 
        diameter: 0.6,
        tessellation: 12
    }, scene);
    endEffectorMount.position.y = 0.35;
    endEffectorMount.parent = wristPitch;
    endEffectorMount.material = joint1Material;
    rotatingParts.push({mesh: endEffectorMount, axis: 'z', speed: 0.035, name: 'end_effector_rotation'});

    // Gripper/End effector
    createGripper(endEffectorMount);

    // Add hydraulic/pneumatic cylinders for realism
    createHydraulicCylinders(shoulderMount, upperArm, forearm);

    // Add cables and conduits
    createCablesAndConduits(upperArm, forearm, wristBase);

    // Add control panel
    createControlPanel();
}

function createGripper(parent) {
    // Gripper palm
    const gripperPalm = BABYLON.MeshBuilder.CreateBox("gripperPalm", {
        width: 0.4, 
        height: 0.6, 
        depth: 0.2
    }, scene);
    gripperPalm.position.y = 0.4;
    gripperPalm.parent = parent;

    const gripperMaterial = new BABYLON.StandardMaterial("gripperMaterial", scene);
    gripperMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.2);
    gripperMaterial.specularColor = new BABYLON.Color3(1, 1, 0.8);
    gripperMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.02);
    gripperPalm.material = gripperMaterial;

    // Gripper fingers
    for (let i = 0; i < 2; i++) {
        const finger = BABYLON.MeshBuilder.CreateBox("finger" + i, {
            width: 0.15, 
            height: 0.8, 
            depth: 0.1
        }, scene);
        finger.position.set((i - 0.5) * 0.3, 0.6, 0);
        finger.parent = gripperPalm;
        finger.material = gripperMaterial;

        // Animate gripper opening/closing
        rotatingParts.push({
            mesh: finger, 
            axis: 'gripper', 
            speed: 0.02, 
            name: 'gripper_finger_' + i,
            fingerIndex: i,
            originalX: finger.position.x
        });

        // Finger tips
        const fingerTip = BABYLON.MeshBuilder.CreateBox("fingerTip" + i, {
            width: 0.1, 
            height: 0.3, 
            depth: 0.05
        }, scene);
        fingerTip.position.y = 0.4;
        fingerTip.parent = finger;
        fingerTip.material = gripperMaterial;
    }
}

function createHydraulicCylinders(shoulderMount, upperArm, forearm) {
    // Shoulder hydraulic cylinder
    const shoulderCylinder = BABYLON.MeshBuilder.CreateCylinder("shoulderCylinder", {
        height: 2, 
        diameter: 0.3,
        tessellation: 12
    }, scene);
    shoulderCylinder.position.set(0.5, 1.5, 0.5);
    shoulderCylinder.rotation.z = Math.PI / 4;
    shoulderCylinder.parent = shoulderMount;

    const cylinderMaterial = new BABYLON.StandardMaterial("cylinderMaterial", scene);
    cylinderMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.7);
    cylinderMaterial.specularColor = new BABYLON.Color3(0.9, 0.9, 1);
    shoulderCylinder.material = cylinderMaterial;

    // Elbow hydraulic cylinder
    const elbowCylinder = BABYLON.MeshBuilder.CreateCylinder("elbowCylinder", {
        height: 1.5, 
        diameter: 0.25,
        tessellation: 12
    }, scene);
    elbowCylinder.position.set(0.3, 1, 0.3);
    elbowCylinder.rotation.z = Math.PI / 6;
    elbowCylinder.parent = upperArm;
    elbowCylinder.material = cylinderMaterial;
}

function createCablesAndConduits(upperArm, forearm, wristBase) {
    // Power cables
    const cable1 = BABYLON.MeshBuilder.CreateTube("cable1", {
        path: [
            new BABYLON.Vector3(0, 0, 0.35),
            new BABYLON.Vector3(0, 1, 0.35),
            new BABYLON.Vector3(0, 2, 0.35),
            new BABYLON.Vector3(0, 3, 0.35)
        ],
        radius: 0.05,
        tessellation: 8
    }, scene);
    cable1.parent = upperArm;

    const cableMaterial = new BABYLON.StandardMaterial("cableMaterial", scene);
    cableMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    cable1.material = cableMaterial;

    // Data cables
    const cable2 = BABYLON.MeshBuilder.CreateTube("cable2", {
        path: [
            new BABYLON.Vector3(0, 1.5, 0.3),
            new BABYLON.Vector3(0, 2.2, 0.3),
            new BABYLON.Vector3(0, 2.5, 0.3)
        ],
        radius: 0.03,
        tessellation: 6
    }, scene);
    cable2.parent = forearm;
    cable2.material = cableMaterial;
}

function createControlPanel() {
    // Control panel base
    const controlPanel = BABYLON.MeshBuilder.CreateBox("controlPanel", {
        width: 2, 
        height: 3, 
        depth: 0.3
    }, scene);
    controlPanel.position.set(-6, 1.5, 0);
    controlPanel.parent = machineGroup;

    const panelMaterial = new BABYLON.StandardMaterial("panelMaterial", scene);
    panelMaterial.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.2);
    panelMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.6);
    controlPanel.material = panelMaterial;

    // Control panel screen
    const screen = BABYLON.MeshBuilder.CreateBox("screen", {
        width: 1.5, 
        height: 1, 
        depth: 0.05
    }, scene);
    screen.position.set(0, 0.5, 0.18);
    screen.parent = controlPanel;

    const screenMaterial = new BABYLON.StandardMaterial("screenMaterial", scene);
    screenMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.3, 0.1);
    screenMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.15, 0.05);
    screen.material = screenMaterial;

    // Control buttons
    for (let i = 0; i < 6; i++) {
        const button = BABYLON.MeshBuilder.CreateCylinder("button" + i, {
            height: 0.1, 
            diameter: 0.2,
            tessellation: 12
        }, scene);
        button.position.set(-0.6 + (i % 3) * 0.6, -0.8 + Math.floor(i / 3) * 0.4, 0.18);
        button.parent = controlPanel;

        const buttonMaterial = new BABYLON.StandardMaterial("buttonMaterial" + i, scene);
        const colors = [
            new BABYLON.Color3(1, 0.3, 0.3), // Red
            new BABYLON.Color3(0.3, 1, 0.3), // Green
            new BABYLON.Color3(0.3, 0.3, 1), // Blue
            new BABYLON.Color3(1, 1, 0.3),   // Yellow
            new BABYLON.Color3(1, 0.3, 1),   // Magenta
            new BABYLON.Color3(0.3, 1, 1)    // Cyan
        ];
        buttonMaterial.diffuseColor = colors[i];
        buttonMaterial.emissiveColor = colors[i].scale(0.3);
        button.material = buttonMaterial;
    }
}

function createCNCMachine() {
    // CNC Base
    const base = BABYLON.MeshBuilder.CreateBox("cncBase", {width: 4, height: 0.8, depth: 3}, scene);
    base.position.y = 0.4;
    base.parent = machineGroup;

    const baseMaterial = new BABYLON.StandardMaterial("cncBaseMaterial", scene);
    baseMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.8);
    baseMaterial.specularColor = new BABYLON.Color3(0.8, 0.8, 1);
    baseMaterial.emissiveColor = new BABYLON.Color3(0.02, 0.03, 0.08);
    base.material = baseMaterial;

    // Spindle housing with enhanced detail
    const housing = BABYLON.MeshBuilder.CreateBox("housing", {width: 1.2, height: 2, depth: 1.2}, scene);
    housing.position.set(0, 1.8, 0);
    housing.parent = machineGroup;
    housing.material = baseMaterial;

    // Rotating spindle with tool
    const spindle = BABYLON.MeshBuilder.CreateCylinder("spindle", {height: 1.5, diameter: 0.15}, scene);
    spindle.position.set(0, 1, 0);
    spindle.parent = machineGroup;

    const spindleMaterial = new BABYLON.StandardMaterial("spindleMaterial", scene);
    spindleMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.95);
    spindleMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
    spindle.material = spindleMaterial;
    rotatingParts.push({mesh: spindle, axis: 'y', speed: 0.5, name: 'cnc_spindle'});

    // Cutting tool
    const tool = BABYLON.MeshBuilder.CreateCylinder("tool", {height: 0.8, diameter: 0.05}, scene);
    tool.position.y = -0.6;
    tool.parent = spindle;
    tool.material = spindleMaterial;

    // Work table with enhanced detail
    const table = BABYLON.MeshBuilder.CreateBox("table", {width: 3, height: 0.3, depth: 2.5}, scene);
    table.position.y = 0.95;
    table.parent = machineGroup;

    const tableMaterial = new BABYLON.StandardMaterial("tableMaterial", scene);
    tableMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.45, 0.5);
    tableMaterial.specularColor = new BABYLON.Color3(0.8, 0.8, 0.9);
    table.material = tableMaterial;

    // Workpiece
    const workpiece = BABYLON.MeshBuilder.CreateBox("workpiece", {width: 1, height: 0.4, depth: 0.8}, scene);
    workpiece.position.y = 1.3;
    workpiece.parent = machineGroup;

    const workpieceMaterial = new BABYLON.StandardMaterial("workpieceMaterial", scene);
    workpieceMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.6, 0.2);
    workpieceMaterial.specularColor = new BABYLON.Color3(1, 0.8, 0.4);
    workpiece.material = workpieceMaterial;
}

function createWindTurbine() {
    // Enhanced tower with realistic proportions
    const tower = BABYLON.MeshBuilder.CreateCylinder("tower", {
        height: 12, 
        diameterTop: 1.2, 
        diameterBottom: 2,
        tessellation: 24
    }, scene);
    tower.position.y = 6;
    tower.parent = machineGroup;

    const towerMaterial = new BABYLON.StandardMaterial("towerMaterial", scene);
    towerMaterial.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.98);
    towerMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
    tower.material = towerMaterial;

    // Nacelle with enhanced detail
    const nacelle = BABYLON.MeshBuilder.CreateBox("nacelle", {width: 4, height: 1.5, depth: 1.5}, scene);
    nacelle.position.y = 12;
    nacelle.parent = machineGroup;
    nacelle.material = towerMaterial;

    // Hub with enhanced detail
    const hub = BABYLON.MeshBuilder.CreateSphere("hub", {diameter: 1.2, segments: 16}, scene);
    hub.position = new BABYLON.Vector3(2, 12, 0);
    hub.parent = machineGroup;

    const hubMaterial = new BABYLON.StandardMaterial("hubMaterial", scene);
    hubMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.85);
    hubMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
    hub.material = hubMaterial;
    rotatingParts.push({mesh: hub, axis: 'x', speed: 0.08, name: 'turbine_hub'});

    // Enhanced blades with aerodynamic shape
    for (let i = 0; i < 3; i++) {
        // Blade root
        const bladeRoot = BABYLON.MeshBuilder.CreateBox("bladeRoot" + i, {
            width: 0.3, 
            height: 0.8, 
            depth: 0.2
        }, scene);
        bladeRoot.position = new BABYLON.Vector3(0.8, 0, 0);
        bladeRoot.rotation.x = (i * Math.PI * 2 / 3);
        bladeRoot.parent = hub;

        // Main blade with taper
        const blade = BABYLON.MeshBuilder.CreateBox("blade" + i, {
            width: 0.15, 
            height: 6, 
            depth: 0.8
        }, scene);
        blade.position = new BABYLON.Vector3(0, 3.5, 0);
        blade.parent = bladeRoot;

        const bladeMaterial = new BABYLON.StandardMaterial("bladeMaterial", scene);
        bladeMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.95);
        bladeMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
        blade.material = bladeMaterial;
        bladeRoot.material = bladeMaterial;
    }

    // Tower base platform
    const base = BABYLON.MeshBuilder.CreateCylinder("turbineBase", {
        height: 0.5, 
        diameter: 3,
        tessellation: 24
    }, scene);
    base.position.y = 0.25;
    base.parent = machineGroup;
    base.material = towerMaterial;
}

function createConveyorSystem() {
    // Enhanced belt system
    const belt = BABYLON.MeshBuilder.CreateBox("belt", {width: 8, height: 0.3, depth: 1.5}, scene);
    belt.position.y = 0.8;
    belt.parent = machineGroup;

    const beltMaterial = new BABYLON.StandardMaterial("beltMaterial", scene);
    beltMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.25);
    beltMaterial.specularColor = new BABYLON.Color3(0.4, 0.4, 0.5);
    belt.material = beltMaterial;

    // Enhanced rollers with realistic detail
    for (let i = 0; i < 9; i++) {
        const roller = BABYLON.MeshBuilder.CreateCylinder("roller" + i, {
            height: 1.8, 
            diameter: 0.3,
            tessellation: 16
        }, scene);
        roller.position.set(-3.5 + i * 0.9, 0.65, 0);
        roller.rotation.z = Math.PI / 2;
        roller.parent = machineGroup;

        const rollerMaterial = new BABYLON.StandardMaterial("rollerMaterial", scene);
        rollerMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.65, 0.7);
        rollerMaterial.specularColor = new BABYLON.Color3(0.9, 0.9, 1);
        roller.material = rollerMaterial;
        rotatingParts.push({mesh: roller, axis: 'z', speed: 0.1, name: 'conveyor_roller_' + i});
    }

    // Moving packages with variety
    const packageTypes = [
        {color: new BABYLON.Color3(0.8, 0.5, 0.2), size: {width: 0.4, height: 0.4, depth: 0.4}},
        {color: new BABYLON.Color3(0.2, 0.8, 0.3), size: {width: 0.6, height: 0.3, depth: 0.5}},
        {color: new BABYLON.Color3(0.3, 0.3, 0.8), size: {width: 0.3, height: 0.5, depth: 0.3}},
        {color: new BABYLON.Color3(0.8, 0.3, 0.8), size: {width: 0.5, height: 0.2, depth: 0.6}}
    ];

    for (let i = 0; i < 4; i++) {
        const packageType = packageTypes[i % packageTypes.length];
        const package = BABYLON.MeshBuilder.CreateBox("package" + i, packageType.size, scene);
        package.position.set(-3 + i * 2, 1.1, 0);
        package.parent = machineGroup;

        const packageMaterial = new BABYLON.StandardMaterial("packageMaterial" + i, scene);
        packageMaterial.diffuseColor = packageType.color;
        packageMaterial.specularColor = new BABYLON.Color3(0.8, 0.8, 0.9);
        package.material = packageMaterial;
        rotatingParts.push({mesh: package, axis: 'move', speed: 0.03, name: 'conveyor_package_' + i});
    }

    // Conveyor support structure
    for (let i = 0; i < 5; i++) {
        const support = BABYLON.MeshBuilder.CreateBox("support" + i, {width: 0.2, height: 1.5, depth: 0.2}, scene);
        support.position.set(-3 + i * 1.5, 0.4, 1);
        support.parent = machineGroup;

        const supportMaterial = new BABYLON.StandardMaterial("supportMaterial", scene);
        supportMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.35);
        support.material = supportMaterial;
    }
}

function createAssemblyStation() {
    // Enhanced platform
    const platform = BABYLON.MeshBuilder.CreateBox("platform", {width: 3.5, height: 0.4, depth: 3.5}, scene);
    platform.position.y = 0.2;
    platform.parent = machineGroup;

    const platformMaterial = new BABYLON.StandardMaterial("platformMaterial", scene);
    platformMaterial.diffuseColor = new BABYLON.Color3(0.15, 0.25, 0.6);
    platformMaterial.specularColor = new BABYLON.Color3(0.8, 0.8, 1);
    platform.material = platformMaterial;

    // Enhanced assembly arms with joints
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;

        // Arm base
        const armBase = BABYLON.MeshBuilder.CreateCylinder("armBase" + i, {
            height: 0.8, 
            diameter: 0.3,
            tessellation: 12
        }, scene);
        armBase.position.set(Math.cos(angle) * 1.2, 0.8, Math.sin(angle) * 1.2);
        armBase.parent = machineGroup;

        // Arm segment
        const arm = BABYLON.MeshBuilder.CreateBox("arm" + i, {width: 1.2, height: 0.2, depth: 0.2}, scene);
        arm.position.set(Math.cos(angle) * 1.8, 1.2, Math.sin(angle) * 1.8);
        arm.rotation.y = angle;
        arm.parent = machineGroup;

        const armMaterial = new BABYLON.StandardMaterial("armMaterial", scene);
        armMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.25, 0.7);
        armMaterial.specularColor = new BABYLON.Color3(1, 0.8, 1);
        arm.material = armMaterial;
        armBase.material = armMaterial;

        rotatingParts.push({mesh: arm, axis: 'y', speed: 0.015 + i * 0.008, name: 'assembly_arm_' + i});

        // Tool at end of arm
        const tool = BABYLON.MeshBuilder.CreateCylinder("tool" + i, {
            height: 0.3, 
            diameter: 0.1,
            tessellation: 8
        }, scene);
        tool.position.x = 0.6;
        tool.parent = arm;

        const toolMaterial = new BABYLON.StandardMaterial("toolMaterial", scene);
        toolMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.8, 0.2);
        toolMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.08, 0.02);
        tool.material = toolMaterial;
    }

    // Central rotating assembly point
    const center = BABYLON.MeshBuilder.CreateCylinder("center", {
        height: 0.4, 
        diameter: 0.8,
        tessellation: 16
    }, scene);
    center.position.y = 0.6;
    center.parent = machineGroup;

    const centerMaterial = new BABYLON.StandardMaterial("centerMaterial", scene);
    centerMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.3, 0.3);
    centerMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.03, 0.03);
    center.material = centerMaterial;
    rotatingParts.push({mesh: center, axis: 'y', speed: 0.12, name: 'assembly_center'});
}

function createHydraulicPress() {
    // Enhanced frame structure
    const frame = BABYLON.MeshBuilder.CreateBox("frame", {width: 2.5, height: 4, depth: 2}, scene);
    frame.position.y = 2;
    frame.parent = machineGroup;

    const frameMaterial = new BABYLON.StandardMaterial("frameMaterial", scene);
    frameMaterial.diffuseColor = new BABYLON.Color3(0.08, 0.15, 0.25);
    frameMaterial.specularColor = new BABYLON.Color3(0.6, 0.6, 0.8);
    frame.material = frameMaterial;

    // Enhanced hydraulic cylinder
    const cylinder = BABYLON.MeshBuilder.CreateCylinder("cylinder", {
        height: 2, 
        diameter: 0.6,
        tessellation: 16
    }, scene);
    cylinder.position.set(0, 3.2, 0);
    cylinder.parent = machineGroup;

    const cylinderMaterial = new BABYLON.StandardMaterial("cylinderMaterial", scene);
    cylinderMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.55, 0.6);
    cylinderMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
    cylinder.material = cylinderMaterial;

    // Piston rod
    const pistonRod = BABYLON.MeshBuilder.CreateCylinder("pistonRod", {
        height: 1.5, 
        diameter: 0.2,
        tessellation: 12
    }, scene);
    pistonRod.position.set(0, 2.2, 0);
    pistonRod.parent = machineGroup;
    pistonRod.material = cylinderMaterial;

    // Press head with enhanced detail
    const head = BABYLON.MeshBuilder.CreateBox("head", {width: 2, height: 0.4, depth: 1.6}, scene);
    head.position.set(0, 2.4, 0);
    head.parent = machineGroup;

    const headMaterial = new BABYLON.StandardMaterial("headMaterial", scene);
    headMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.25, 0.25);
    headMaterial.specularColor = new BABYLON.Color3(1, 0.8, 0.8);
    head.material = headMaterial;
    rotatingParts.push({
        mesh: head, 
        axis: 'move', 
        speed: 0.015, 
        oscillate: true, 
        originalY: 2.4,
        name: 'press_head'
    });

    // Enhanced base plate
    const baseplate = BABYLON.MeshBuilder.CreateBox("baseplate", {width: 2.2, height: 0.3, depth: 1.8}, scene);
    baseplate.position.y = 0.8;
    baseplate.parent = machineGroup;

    const baseMaterial = new BABYLON.StandardMaterial("baseMaterial", scene);
    baseMaterial.diffuseColor = new BABYLON.Color3(0.35, 0.4, 0.45);
    baseMaterial.specularColor = new BABYLON.Color3(0.8, 0.8, 0.9);
    baseplate.material = baseMaterial;

    // Workpiece to be pressed
    const workpiece = BABYLON.MeshBuilder.CreateBox("workpiece", {width: 0.8, height: 0.2, depth: 0.6}, scene);
    workpiece.position.y = 1.05;
    workpiece.parent = machineGroup;

    const workpieceMaterial = new BABYLON.StandardMaterial("workpieceMaterial", scene);
    workpieceMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.5, 0.2);
    workpiece.material = workpieceMaterial;
}

function createChemicalReactor() {
    // Enhanced main reactor vessel
    const vessel = BABYLON.MeshBuilder.CreateCylinder("vessel", {
        height: 5, 
        diameter: 3.5,
        tessellation: 24
    }, scene);
    vessel.position.y = 2.5;
    vessel.parent = machineGroup;

    const vesselMaterial = new BABYLON.StandardMaterial("vesselMaterial", scene);
    vesselMaterial.diffuseColor = new BABYLON.Color3(0.85, 0.85, 0.9);
    vesselMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
    vessel.material = vesselMaterial;

    // Enhanced stirrer system
    const stirrer = BABYLON.MeshBuilder.CreateCylinder("stirrer", {
        height: 4.5, 
        diameter: 0.15,
        tessellation: 12
    }, scene);
    stirrer.position.y = 2.5;
    stirrer.parent = machineGroup;

    const stirrerMaterial = new BABYLON.StandardMaterial("stirrerMaterial", scene);
    stirrerMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.25, 0.3);
    stirrerMaterial.specularColor = new BABYLON.Color3(0.8, 0.8, 0.9);
    stirrer.material = stirrerMaterial;
    rotatingParts.push({mesh: stirrer, axis: 'y', speed: 0.2, name: 'reactor_stirrer'});

    // Multiple stirrer blade levels
    for (let level = 0; level < 3; level++) {
        for (let i = 0; i < 4; i++) {
            const blade = BABYLON.MeshBuilder.CreateBox("stirrerBlade" + level + "_" + i, {
                width: 1.2, 
                height: 0.15, 
                depth: 0.08
            }, scene);
            blade.position.set(0, 0.8 + level * 1.2, 0);
            blade.rotation.y = (i * Math.PI / 2) + (level * Math.PI / 8);
            blade.parent = stirrer;

            const bladeMaterial = new BABYLON.StandardMaterial("bladeMaterial", scene);
            bladeMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.45, 0.5);
            bladeMaterial.specularColor = new BABYLON.Color3(0.9, 0.9, 1);
            blade.material = bladeMaterial;
        }
    }

    // Enhanced pipe system
    const pipeConfigs = [
        {pos: new BABYLON.Vector3(1.8, 4, 0), angle: 0, color: new BABYLON.Color3(0.2, 0.6, 0.2)},
        {pos: new BABYLON.Vector3(-1.8, 3.5, 0), angle: Math.PI, color: new BABYLON.Color3(0.6, 0.2, 0.2)},
        {pos: new BABYLON.Vector3(0, 4.5, 1.8), angle: Math.PI/2, color: new BABYLON.Color3(0.2, 0.2, 0.6)},
        {pos: new BABYLON.Vector3(0, 3, -1.8), angle: -Math.PI/2, color: new BABYLON.Color3(0.6, 0.6, 0.2)}
    ];

    pipeConfigs.forEach((config, i) => {
        const pipe = BABYLON.MeshBuilder.CreateCylinder("pipe" + i, {
            height: 1.5, 
            diameter: 0.3,
            tessellation: 12
        }, scene);
        pipe.position.copy(config.pos);
        pipe.rotation.z = Math.PI / 2;
        pipe.rotation.y = config.angle;
        pipe.parent = machineGroup;

        const pipeMaterial = new BABYLON.StandardMaterial("pipeMaterial" + i, scene);
        pipeMaterial.diffuseColor = config.color;
        pipeMaterial.specularColor = new BABYLON.Color3(0.8, 0.8, 0.9);
        pipe.material = pipeMaterial;

        // Pipe valves
        const valve = BABYLON.MeshBuilder.CreateSphere("valve" + i, {diameter: 0.4, segments: 12}, scene);
        valve.position.x = 0.6;
        valve.parent = pipe;
        valve.material = pipeMaterial;
    });

    // Reactor base and support
    const base = BABYLON.MeshBuilder.CreateCylinder("reactorBase", {
        height: 0.6, 
        diameter: 4,
        tessellation: 24
    }, scene);
    base.position.y = 0.3;
    base.parent = machineGroup;
    base.material = vesselMaterial;

    // Control instrumentation
    for (let i = 0; i < 3; i++) {
        const gauge = BABYLON.MeshBuilder.CreateCylinder("gauge" + i, {
            height: 0.1, 
            diameter: 0.3,
            tessellation: 16
        }, scene);
        gauge.position.set(Math.cos(i * Math.PI * 2 / 3) * 1.6, 3.5, Math.sin(i * Math.PI * 2 / 3) * 1.6);
        gauge.rotation.x = Math.PI / 2;
        gauge.parent = machineGroup;

        const gaugeMaterial = new BABYLON.StandardMaterial("gaugeMaterial", scene);
        gaugeMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.15);
        gaugeMaterial.emissiveColor = new BABYLON.Color3(0.02, 0.02, 0.03);
        gauge.material = gaugeMaterial;
    }
}

function createEnhancedGround() {
    if (ground) ground.dispose();

    ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 30, height: 30}, scene);
    const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.08, 0.12, 0.18);
    groundMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.3);
    ground.material = groundMaterial;
    ground.receiveShadows = true;

    // Add grid lines for industrial look
    const gridLines = [];
    for (let i = -15; i <= 15; i += 2) {
        // Horizontal lines
        gridLines.push(new BABYLON.Vector3(-15, 0.01, i));
        gridLines.push(new BABYLON.Vector3(15, 0.01, i));
        // Vertical lines
        gridLines.push(new BABYLON.Vector3(i, 0.01, -15));
        gridLines.push(new BABYLON.Vector3(i, 0.01, 15));
    }

    const gridSystem = BABYLON.MeshBuilder.CreateLineSystem("grid", {lines: [gridLines]}, scene);
    const gridMaterial = new BABYLON.StandardMaterial("gridMaterial", scene);
    gridMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.15, 0.2);
    gridSystem.color = new BABYLON.Color3(0.15, 0.2, 0.3);
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
                    const oscillation = Math.sin(time * part.speed * 15);
                    part.mesh.position.y = part.originalY + oscillation * 0.8;
                } else {
                    part.mesh.position.x += part.speed;
                    if (part.mesh.position.x > 4) {
                        part.mesh.position.x = -4;
                    }
                }
            } else if (part.axis === 'gripper') {
                // Animate gripper fingers opening/closing
                const openClose = Math.sin(time * part.speed * 5) * 0.15;
                if (part.fingerIndex === 0) {
                    part.mesh.position.x = part.originalX - openClose;
                } else {
                    part.mesh.position.x = part.originalX + openClose;
                }
            }
        });
    }

    // Update sensor-based effects
    updateSensorEffects();
}

function updateSensorEffects() {
    // Add visual effects based on sensor data
    if (sensorData.vibration > 0.8 && machineGroup) {
        const vibrationIntensity = (sensorData.vibration - 0.8) * 0.3;
        machineGroup.position.x = Math.sin(Date.now() * 0.015) * vibrationIntensity;
        machineGroup.position.z = Math.cos(Date.now() * 0.012) * vibrationIntensity;
    } else if (machineGroup) {
        machineGroup.position.x = 0;
        machineGroup.position.z = 0;
    }

    // Temperature effects
    if (sensorData.temperature > 85) {
        // Add heat shimmer effect by slightly varying object positions
        rotatingParts.forEach(part => {
            if (part.name && part.name.includes('joint')) {
                const heatEffect = Math.sin(Date.now() * 0.01) * 0.02;
                part.mesh.position.y += heatEffect;
            }
        });
    }
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
    document.getElementById('lightingControl').addEventListener('input', function(e) {
        const intensity = e.target.value / 100;
        scene.lights.forEach(light => {
            if (light instanceof BABYLON.DirectionalLight) {
                light.intensity = intensity * 1.5;
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

function simulateVRMode() {
    // Simulate VR by changing camera position and FOV
    camera.fov = Math.PI / 2;
    camera.position = new BABYLON.Vector3(0, 2, -5);
    camera.setTarget(new BABYLON.Vector3(0, 1, 0));
    alert("VR Mode Simulated! Use mouse to look around.");
}

function switchMachine(machineType) {
    currentMachine = machineType;
    createEnhancedMachine();
}

function setView(viewType) {
    switch (viewType) {
        case 'front':
            camera.position = new BABYLON.Vector3(0, 5, 15);
            camera.setTarget(new BABYLON.Vector3(0, 3, 0));
            break;
        case 'top':
            camera.position = new BABYLON.Vector3(0, 20, 0);
            camera.setTarget(new BABYLON.Vector3(0, 0, 0));
            break;
        case 'side':
            camera.position = new BABYLON.Vector3(15, 5, 0);
            camera.setTarget(new BABYLON.Vector3(0, 3, 0));
            break;
        case 'iso':
            camera.position = new BABYLON.Vector3(12, 10, 12);
            camera.setTarget(new BABYLON.Vector3(0, 3, 0));
            break;
    }
}

function resetView() {
    camera.position = new BABYLON.Vector3(12, 10, 12);
    camera.setTarget(new BABYLON.Vector3(0, 3, 0));
    camera.fov = Math.PI / 4;
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
        // Use simulated data when API fails
        sensorData = {
            temperature: 75 + Math.random() * 15,
            pressure: 1.2 + Math.random() * 0.8,
            vibration: 0.4 + Math.random() * 0.6,
            rpm: 1200 + Math.random() * 800,
            power: 45 + Math.random() * 30,
            status: Math.random() > 0.9 ? 'Warning' : 'Operating'
        };

        updateSensorDisplay(sensorData);
        updateSensorVisualization(sensorData);
    }
}

function updateSensorDisplay(data) {
    document.getElementById('twinTemp').textContent = `${Math.round(data.temperature)}°F`;
    document.getElementById('twinPressure').textContent = `${data.pressure.toFixed(1)} bar`;
    document.getElementById('twinVibration').textContent = data.vibration.toFixed(2);
    document.getElementById('twinRpm').textContent = `${Math.round(data.rpm)} rpm`;
    document.getElementById('twinPower').textContent = `${Math.round(data.power)} kW`;

    // Update progress bars
    document.getElementById('tempBar').style.width = `${Math.min(100, (data.temperature / 120) * 100)}%`;
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
    updateSensorEffects();
}