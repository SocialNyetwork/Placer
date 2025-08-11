class Place3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.raycaster = null;
        this.mouse = null;
        this.selectedColor = '#ff0000';
        this.cubeCount = 0;
        this.cubes = new Map(); // Store placed cubes
        this.gridSize = 50; // Size of the 3D grid
        this.cubeSize = 1;
        this.maxHeight = 20; // Maximum height for stacking
        this.previewCube = null; // Preview cube outline
        this.isFirstPerson = true; // First person mode
        this.isPointerLocked = false;
        this.isDestructionMode = false;
        this.highlightedCube = null;
        this.highlightOutline = null;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Color cycling
        this.colors = [
            '#f2ffe8', // Light mint green
            '#c2bfc8', // Light grey
            '#a8d3e1', // Light blue
            '#acce71', // Lime green
            '#eeca6f', // Golden yellow
            '#ef9e6d', // Peach orange
            '#dea999', // Light terracotta
            '#ee9489', // Coral pink
            '#dea9d2', // Light lavender
            '#83758b', // Muted purple
            '#6f8be6', // Periwinkle blue
            '#498f94', // Teal
            '#8c6a61', // Brown
            '#986075', // Mauve
            '#7767a6', // Purple
            '#322f3d'  // Dark grey
        ];
        this.currentColorIndex = 0;
        this.selectedColor = this.colors[0]; // Light Mint Green
        
        this.init();
        this.setupEventListeners();
        this.animate();
        
        // Initialize UI state
        this.updateUIForPointerLock();
    }
    
    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 2, 10); // First person position
        
        // Renderer setup
        const canvas = document.getElementById('canvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Controls setup - First person controls
        this.controls = new THREE.PointerLockControls(this.camera, this.renderer.domElement);
        
        // Mouse movement for first person
        this.mouseX = 0;
        this.mouseY = 0;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false;
        this.moveDown = false;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.previousTime = performance.now();
        
        // Raycaster for mouse interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.setupLights();
        this.setupGrid();
        this.setupGround();
        this.setupPreviewCube();
    }
    
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -25;
        directionalLight.shadow.camera.right = 25;
        directionalLight.shadow.camera.top = 25;
        directionalLight.shadow.camera.bottom = -25;
        this.scene.add(directionalLight);
        
        // Point lights for better illumination
        const pointLight1 = new THREE.PointLight(0xffffff, 0.5, 30);
        pointLight1.position.set(0, 15, 0);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xffffff, 0.3, 40);
        pointLight2.position.set(20, 10, 20);
        this.scene.add(pointLight2);
    }
    
    setupPreviewCube() {
        // Create a wireframe cube for preview
        const geometry = new THREE.BoxGeometry(this.cubeSize, this.cubeSize, this.cubeSize);
        const material = new THREE.MeshBasicMaterial({ 
            color: this.selectedColor,
            wireframe: true,
            transparent: true,
            opacity: 0.9,
            depthTest: false
        });
        this.previewCube = new THREE.Mesh(geometry, material);
        this.previewCube.visible = false;
        this.previewCube.renderOrder = 999; // Render on top
        this.scene.add(this.previewCube);
        
        // Create highlight outline for destruction mode
        const highlightGeometry = new THREE.BoxGeometry(this.cubeSize, this.cubeSize, this.cubeSize);
        const highlightMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6,
            wireframe: true
        });
        this.highlightOutline = new THREE.Mesh(highlightGeometry, highlightMaterial);
        this.highlightOutline.visible = false;
        this.scene.add(this.highlightOutline);
    }
    
    setupGrid() {
        // Create a grid helper
        const gridHelper = new THREE.GridHelper(this.gridSize, this.gridSize, 0x444444, 0x222222);
        gridHelper.position.y = 0; // Align with cube placement
        this.scene.add(gridHelper);
    }
    
    setupGround() {
        // Create a ground plane for reference
        const groundGeometry = new THREE.PlaneGeometry(this.gridSize, this.gridSize);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x333333,
            transparent: true,
            opacity: 0.3
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0; // Align with grid and cube placement
        ground.receiveShadow = true;
        this.scene.add(ground);
    }
    
    setupEventListeners() {
        // Mouse click events for cube placement (only when pointer is locked)
        this.renderer.domElement.addEventListener('click', (event) => {
            // If pointer is locked, place cube; otherwise, try to lock
            if (this.controls.isLocked) {
                if (this.isDestructionMode && this.highlightedCube) {
                    // Destroy the highlighted cube
                    this.destroyCube(this.highlightedCube);
                    this.highlightedCube = null;
                    this.highlightOutline.visible = false;
                } else {
                    this.onMouseClick(event);
                }
            } else {
                this.hidePromptOverlay();
                // Ensure canvas is focused before attempting to lock
                this.renderer.domElement.focus();
                this.controls.lock();
            }
        });
        
        // Ensure canvas can receive focus
        this.renderer.domElement.tabIndex = 0;
        this.renderer.domElement.style.outline = 'none';
        
        // Right click for destruction mode
        this.renderer.domElement.addEventListener('mousedown', (event) => {
            if (event.button === 2 && this.controls.isLocked) { // Right mouse button
                event.preventDefault();
                this.isDestructionMode = true;
                this.previewCube.visible = false;
            }
        });
        
        this.renderer.domElement.addEventListener('mouseup', (event) => {
            if (event.button === 2) { // Right mouse button
                event.preventDefault();
                this.isDestructionMode = false;
                this.highlightOutline.visible = false;
                this.highlightedCube = null;
                this.previewCube.visible = true;
            }
        });
        
        // Prevent context menu on right click
        this.renderer.domElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        
        // Mouse move for preview
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            if (this.controls.isLocked) {
                this.onMouseMove(event);
            }
        });
        
        // Scroll wheel for color cycling
        this.renderer.domElement.addEventListener('wheel', (event) => {
            if (this.controls.isLocked) {
                this.onWheel(event);
            }
        });
        
        // Pointer lock state change events
        this.controls.addEventListener('lock', () => {
            this.isPointerLocked = true;
            this.updateUIForPointerLock();
        });
        
        this.controls.addEventListener('unlock', () => {
            this.isPointerLocked = false;
            this.updateUIForPointerLock();
            if (this.previewCube) {
                this.previewCube.visible = false;
            }
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            this.onKeyDown(event);
        });
        
        document.addEventListener('keyup', (event) => {
            this.onKeyUp(event);
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.onWindowResize();
        });
        
        // Color selection
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectColor(e.target.dataset.color);
            });
        });
        
        // Button events
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.clearCanvas();
        });
        
        document.getElementById('save-btn').addEventListener('click', () => {
            this.saveImage();
        });
        
        document.getElementById('reset-camera-btn').addEventListener('click', () => {
            this.resetCamera();
        });
        
        // Prompt overlay event listener
        document.getElementById('enter-first-person-btn').addEventListener('click', () => {
            this.hidePromptOverlay();
            this.controls.lock();
        });
        
        // Set initial color
        this.selectColor(this.colors[0]);
    }
    
    onMouseMove(event) {
        if (!this.controls.isLocked) return;
        
        // Track mouse position
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
        
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(mouse, this.camera);
        
        if (this.isDestructionMode) {
            // In destruction mode, highlight existing cubes
            const intersects = this.raycaster.intersectObjects(Array.from(this.cubes.values()));
            
            if (intersects.length > 0) {
                const closestCube = intersects[0].object;
                if (closestCube !== this.highlightedCube) {
                    this.highlightedCube = closestCube;
                    this.highlightOutline.position.copy(closestCube.position);
                    this.highlightOutline.visible = true;
                }
            } else {
                this.highlightedCube = null;
                this.highlightOutline.visible = false;
            }
        } else {
            // Normal placement mode
            const cubeIntersects = this.raycaster.intersectObjects(Array.from(this.cubes.values()));
            
            if (cubeIntersects.length > 0) {
                // Place on side of existing cube
                const intersect = cubeIntersects[0];
                const face = intersect.face;
                const cube = intersect.object;
                
                // Get the cube's position
                const cubePos = cube.position;
                
                // Determine which face was hit and calculate placement position
                const placementPos = this.calculateSidePlacement(cubePos, face);
                
                if (placementPos && this.isValidPlacement(placementPos.x, placementPos.y, placementPos.z)) {
                    this.previewCube.position.set(placementPos.x, placementPos.y, placementPos.z);
                    this.previewCube.material.color.setHex(this.selectedColor.replace('#', '0x'));
                    this.previewCube.visible = true;
                } else {
                    this.previewCube.visible = false;
                }
            } else {
                // Fall back to ground plane intersection
                const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
                const intersectionPoint = new THREE.Vector3();
                
                this.raycaster.ray.intersectPlane(groundPlane, intersectionPoint);
                
                if (intersectionPoint) {
                    // Snap to grid - place in center of grid squares
                    const x = Math.floor(intersectionPoint.x / this.cubeSize) * this.cubeSize + this.cubeSize / 2;
                    const z = Math.floor(intersectionPoint.z / this.cubeSize) * this.cubeSize + this.cubeSize / 2;
                    
                    // Check if the snapped position is within grid bounds
                    const halfGrid = this.gridSize / 2;
                    if (x >= -halfGrid && x <= halfGrid && z >= -halfGrid && z <= halfGrid) {
                        // Find the highest cube at this x,z position
                        const y = this.findHighestCubeAt(x, z);
                        
                        if (y < this.maxHeight) {
                            this.previewCube.position.set(x, y, z);
                            this.previewCube.material.color.setHex(this.selectedColor.replace('#', '0x'));
                            this.previewCube.visible = true;
                        } else {
                            this.previewCube.visible = false;
                        }
                    } else {
                        this.previewCube.visible = false;
                    }
                } else {
                    this.previewCube.visible = false;
                }
            }
        }
        // Animate highlight outline pulsing
        if (this.highlightOutline && this.highlightOutline.visible) {
            const time = Date.now() * 0.003;
            const pulse = 0.5 + 0.3 * Math.sin(time * 4);
            this.highlightOutline.material.opacity = 0.3 + 0.4 * pulse;
            this.highlightOutline.scale.setScalar(1 + 0.05 * pulse);
        }
    }
    
    onMouseClick(event) {
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // First, check for intersections with existing cubes
        const cubeIntersects = this.raycaster.intersectObjects(Array.from(this.cubes.values()));
        
        if (cubeIntersects.length > 0) {
            // Place on side of existing cube
            const intersect = cubeIntersects[0];
            const face = intersect.face;
            const cube = intersect.object;
            
            // Get the cube's position
            const cubePos = cube.position;
            
            // Determine which face was hit and calculate placement position
            const placementPos = this.calculateSidePlacement(cubePos, face);
            
            if (placementPos && this.isValidPlacement(placementPos.x, placementPos.y, placementPos.z)) {
                this.placeCube(placementPos.x, placementPos.y, placementPos.z);
            }
        } else {
            // Fall back to ground plane intersection
            const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const intersectionPoint = new THREE.Vector3();
            
            this.raycaster.ray.intersectPlane(groundPlane, intersectionPoint);
            
            if (intersectionPoint) {
                // Snap to grid - place in center of grid squares
                const x = Math.floor(intersectionPoint.x / this.cubeSize) * this.cubeSize + this.cubeSize / 2;
                const z = Math.floor(intersectionPoint.z / this.cubeSize) * this.cubeSize + this.cubeSize / 2;
                
                // Check if the snapped position is within grid bounds
                const halfGrid = this.gridSize / 2;
                if (x >= -halfGrid && x <= halfGrid && z >= -halfGrid && z <= halfGrid) {
                    // Find the highest cube at this x,z position
                    const y = this.findHighestCubeAt(x, z);
                    
                    // Place cube on top of the highest existing cube (if within height limit)
                    if (y < this.maxHeight) {
                        this.placeCube(x, y, z);
                    }
                }
            }
        }
    }
    

    
    onWheel(event) {
        event.preventDefault();
        
        // Determine scroll direction
        if (event.deltaY > 0) {
            // Scroll down - next color
            this.currentColorIndex = (this.currentColorIndex + 1) % this.colors.length;
        } else {
            // Scroll up - previous color
            this.currentColorIndex = (this.currentColorIndex - 1 + this.colors.length) % this.colors.length;
        }
        
        // Update selected color
        const newColor = this.colors[this.currentColorIndex];
        this.selectColor(newColor);
    }
    
    calculateSidePlacement(cubePos, face) {
        // Determine which face was hit based on the face normal
        const normal = face.normal;
        
        // Calculate the placement position based on the face normal
        let x = cubePos.x;
        let y = cubePos.y;
        let z = cubePos.z;
        
        if (Math.abs(normal.x) > 0.5) {
            // X face (left or right)
            x = cubePos.x + (normal.x * this.cubeSize);
        } else if (Math.abs(normal.y) > 0.5) {
            // Y face (top or bottom)
            y = cubePos.y + (normal.y * this.cubeSize);
        } else if (Math.abs(normal.z) > 0.5) {
            // Z face (front or back)
            z = cubePos.z + (normal.z * this.cubeSize);
        }
        
        // Snap to grid
        x = Math.floor(x / this.cubeSize) * this.cubeSize + this.cubeSize / 2;
        y = Math.round(y / this.cubeSize) * this.cubeSize;
        z = Math.floor(z / this.cubeSize) * this.cubeSize + this.cubeSize / 2;
        
        return { x, y, z };
    }
    
    isValidPlacement(x, y, z) {
        // Check if position is within bounds
        const halfGrid = this.gridSize / 2;
        // Use strict boundary checking - cubes must be within the grid bounds
        if (x < -halfGrid || x > halfGrid || z < -halfGrid || z > halfGrid || y < 0 || y > this.maxHeight) {
            return false;
        }
        
        // Check if there's already a cube at this position
        const key = `${x},${y},${z}`;
        return !this.cubes.has(key);
    }
    
    placeCube(x, y, z) {
        const geometry = new THREE.BoxGeometry(this.cubeSize, this.cubeSize, this.cubeSize);
        const material = new THREE.MeshLambertMaterial({ color: this.selectedColor });
        const cube = new THREE.Mesh(geometry, material);
        
        // Position cube so it sits directly on top of the previous cube
        cube.position.set(x, y, z);
        cube.castShadow = true;
        cube.receiveShadow = true;
        
        this.scene.add(cube);
        
        const key = `${x},${y},${z}`;
        this.cubes.set(key, cube);
        
        this.cubeCount++;
        this.updateStats();
        
        // Add placement animation
        cube.scale.set(0, 0, 0);
        this.animateCubePlacement(cube);
        
        // Update preview cube position after placing
        this.updatePreviewCube();
    }
    
    removeCube(x, y, z) {
        const key = `${x},${y},${z}`;
        this.removeCubeByKey(key);
    }
    
    removeCubeByKey(key) {
        const cube = this.cubes.get(key);
        
        if (cube) {
            this.scene.remove(cube);
            this.cubes.delete(key);
            this.cubeCount = Math.max(0, this.cubeCount - 1);
            this.updateStats();
            
            // Update preview cube position after removing
            this.updatePreviewCube();
        }
    }
    
    animateCubePlacement(cube) {
        const targetScale = 1;
        const duration = 300; // milliseconds
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutBack = (t) => {
                const c1 = 1.70158;
                const c3 = c1 + 1;
                return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
            };
            
            const scale = targetScale * easeOutBack(progress);
            cube.scale.set(scale, scale, scale);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    selectColor(color) {
        this.selectedColor = color;
        
        // Update current color index
        const colorIndex = this.colors.indexOf(color);
        if (colorIndex !== -1) {
            this.currentColorIndex = colorIndex;
        }
        
        // Update UI
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`[data-color="${color}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        // Update stats
        const colorNames = {
            '#f2ffe8': 'Light Mint Green',
            '#c2bfc8': 'Light Grey',
            '#a8d3e1': 'Light Blue',
            '#acce71': 'Lime Green',
            '#eeca6f': 'Golden Yellow',
            '#ef9e6d': 'Peach Orange',
            '#dea999': 'Light Terracotta',
            '#ee9489': 'Coral Pink',
            '#dea9d2': 'Light Lavender',
            '#83758b': 'Muted Purple',
            '#6f8be6': 'Periwinkle Blue',
            '#498f94': 'Teal',
            '#8c6a61': 'Brown',
            '#986075': 'Mauve',
            '#7767a6': 'Purple',
            '#322f3d': 'Dark Grey'
        };
        
        document.getElementById('current-color').textContent = `Selected: ${colorNames[color] || color}`;
        
        // Update preview cube color
        if (this.previewCube) {
            this.previewCube.material.color.setHex(color.replace('#', '0x'));
        }
    }
    
    onKeyDown(event) {
        // Check for Ctrl key combinations first (these work regardless of pointer lock state)
        if (event.ctrlKey) {
            switch (event.code) {
                case 'KeyC':
                    event.preventDefault();
                    this.clearCanvas();
                    return;
                case 'KeyS':
                    event.preventDefault();
                    this.saveImage();
                    return;
                case 'KeyR':
                    event.preventDefault();
                    this.resetCamera();
                    return;
            }
        }
        
        // Only process movement controls if pointer is locked (in first-person mode)
        if (!this.controls.isLocked) { // Changed from this.isPointerLocked to this.controls.isLocked
            return;
        }
        
        // Regular movement controls
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'Space':
                this.moveDown = true;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.moveUp = true;
                break;
        }
    }
    
    onKeyUp(event) {
        // Only process movement controls if pointer is locked (in first-person mode)
        if (!this.controls.isLocked) { // Changed from this.isPointerLocked to this.controls.isLocked
            return;
        }
        
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = false;
                break;
            case 'Space':
                this.moveDown = false;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.moveUp = false;
                break;
        }
    }
    
    clearCanvas() {
        // Remove all cubes from the scene and map
        this.cubes.forEach((cube) => {
            this.scene.remove(cube);
        });
        this.cubes.clear();
        this.cubeCount = 0;
        this.updateStats();
        this.updatePreviewCube(); // Update preview after clearing
    }
    
    saveImage() {
        this.renderer.render(this.scene, this.camera);
        const dataURL = this.renderer.domElement.toDataURL('image/png');
        
        const link = document.createElement('a');
        link.download = '3d-place-canvas.png';
        link.href = dataURL;
        link.click();
    }
    
    resetCamera() {
        this.camera.position.set(0, 2, 10);
        this.camera.lookAt(0, 2, 0);
        // Unlock pointer when resetting camera
        if (this.controls.isLocked) { // Changed from this.isPointerLocked to this.controls.isLocked
            this.controls.unlock();
        }
    }
    
    updateUIForPointerLock() {
        const crosshair = document.getElementById('crosshair');
        const canvas = document.getElementById('canvas');
        const modeIndicator = document.getElementById('mode-indicator');
        
        if (this.controls.isLocked) { // Changed from this.isPointerLocked to this.controls.isLocked
            // In first-person mode
            crosshair.style.display = 'block';
            canvas.style.cursor = 'none';
            modeIndicator.textContent = 'First-person mode (ESC to exit)';
            // Add a subtle visual indicator that we're in first-person mode
            document.body.classList.add('first-person-mode');
        } else {
            // In escape menu / UI mode
            crosshair.style.display = 'none';
            canvas.style.cursor = 'pointer';
            modeIndicator.textContent = 'Click to enter first-person mode';
            document.body.classList.remove('first-person-mode');
        }
    }
    
    hidePromptOverlay() {
        const overlay = document.getElementById('prompt-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            // Remove the overlay from DOM after animation
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.remove();
                }
            }, 500);
        }
    }
    
    updateStats() {
        document.getElementById('cube-count').textContent = `Cubes placed: ${this.cubeCount}`;
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.controls.isLocked) { // Changed from this.isPointerLocked to this.controls.isLocked
            // First person movement - only when pointer is locked
            const time = performance.now();
            const delta = (time - this.previousTime) / 1000;
            
            this.velocity.x -= this.velocity.x * 10.0 * delta;
            this.velocity.z -= this.velocity.z * 10.0 * delta;
            this.velocity.y -= this.velocity.y * 10.0 * delta;
            
            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.y = Number(this.moveUp) - Number(this.moveDown);
            this.direction.normalize();
            
            if (this.moveForward || this.moveBackward) {
                this.velocity.z -= this.direction.z * 400.0 * delta;
            }
            if (this.moveLeft || this.moveRight) {
                this.velocity.x -= this.direction.x * 400.0 * delta;
            }
            if (this.moveUp || this.moveDown) {
                this.velocity.y -= this.direction.y * 400.0 * delta;
            }
            
            this.controls.moveRight(-this.velocity.x * delta);
            this.controls.moveForward(-this.velocity.z * delta);
            
            // Handle vertical movement manually since PointerLockControls doesn't support it
            this.camera.position.y += this.velocity.y * delta;
            
            this.previousTime = time;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    findHighestCubeAt(x, z) {
        let highestY = 0;
        
        // Check all cubes at this x,z position
        this.cubes.forEach((cube, key) => {
            const [cubeX, cubeY, cubeZ] = key.split(',').map(Number);
            if (cubeX === x && cubeZ === z) {
                highestY = Math.max(highestY, cubeY + this.cubeSize);
            }
        });
        
        return highestY;
    }
    
    updatePreviewCube() {
        // Get current mouse position
        const mouse = new THREE.Vector2();
        mouse.x = (this.lastMouseX / window.innerWidth) * 2 - 1;
        mouse.y = -(this.lastMouseY / window.innerHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(mouse, this.camera);
        
        // First, check for intersections with existing cubes
        const cubeIntersects = this.raycaster.intersectObjects(Array.from(this.cubes.values()));
        
        if (cubeIntersects.length > 0) {
            // Place on side of existing cube
            const intersect = cubeIntersects[0];
            const face = intersect.face;
            const cube = intersect.object;
            
            // Get the cube's position
            const cubePos = cube.position;
            
            // Determine which face was hit and calculate placement position
            const placementPos = this.calculateSidePlacement(cubePos, face);
            
            if (placementPos && this.isValidPlacement(placementPos.x, placementPos.y, placementPos.z)) {
                this.previewCube.position.set(placementPos.x, placementPos.y, placementPos.z);
                this.previewCube.visible = true;
            } else {
                this.previewCube.visible = false;
            }
        } else {
            // Fall back to ground plane intersection
            const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const intersectionPoint = new THREE.Vector3();
            
            this.raycaster.ray.intersectPlane(groundPlane, intersectionPoint);
            
            if (intersectionPoint) {
                const x = Math.floor(intersectionPoint.x / this.cubeSize) * this.cubeSize + this.cubeSize / 2;
                const z = Math.floor(intersectionPoint.z / this.cubeSize) * this.cubeSize + this.cubeSize / 2;
                
                // Check if the snapped position is within grid bounds
                const halfGrid = this.gridSize / 2;
                if (x >= -halfGrid && x <= halfGrid && z >= -halfGrid && z <= halfGrid) {
                    const y = this.findHighestCubeAt(x, z);
                    
                    if (y < this.maxHeight) {
                        this.previewCube.position.set(x, y, z);
                        this.previewCube.visible = true;
                    } else {
                        this.previewCube.visible = false;
                    }
                } else {
                    this.previewCube.visible = false;
                }
            } else {
                this.previewCube.visible = false;
            }
        }
    }

    destroyCube(cube) {
        // Find the cube's key in the Map
        let cubeKey = null;
        this.cubes.forEach((mapCube, key) => {
            if (mapCube === cube) {
                cubeKey = key;
            }
        });
        
        if (cubeKey) {
            // Remove from scene
            this.scene.remove(cube);
            
            // Remove from cubes Map using the correct key
            this.cubes.delete(cubeKey);
            
            // Update cube count (ensure it doesn't go negative)
            this.cubeCount = Math.max(0, this.cubeCount - 1);
            document.getElementById('cube-count').textContent = `Cubes placed: ${this.cubeCount}`;
            
            // Dispose of geometry and material to free memory
            if (cube.geometry) cube.geometry.dispose();
            if (cube.material) cube.material.dispose();
            
            // Update preview cube position after removing
            this.updatePreviewCube();
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Place3D();
});
