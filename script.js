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
        
        // Color cycling
        this.colors = [
            '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
            '#ff8800', '#8800ff', '#ffffff', '#000000', '#888888', '#ff0088'
        ];
        this.currentColorIndex = 0;
        
        this.init();
        this.setupEventListeners();
        this.animate();
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
    }
    
    setupGrid() {
        // Create a grid helper
        const gridHelper = new THREE.GridHelper(this.gridSize, this.gridSize, 0x444444, 0x222222);
        gridHelper.position.y = -0.5;
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
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }
    
    setupEventListeners() {
        // Mouse click events
        this.renderer.domElement.addEventListener('click', (event) => {
            this.onMouseClick(event);
        });
        
        this.renderer.domElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            this.onRightClick(event);
        });
        
        // Mouse move for preview
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            this.onMouseMove(event);
        });
        
        // Scroll wheel for color cycling
        this.renderer.domElement.addEventListener('wheel', (event) => {
            this.onWheel(event);
        });
        
        // First person controls
        this.renderer.domElement.addEventListener('click', () => {
            if (!this.controls.isLocked) {
                this.controls.lock();
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
        
        // Set initial color
        this.selectColor('#ff0000');
    }
    
    onMouseMove(event) {
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Calculate intersections with the ground plane
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectionPoint = new THREE.Vector3();
        
        this.raycaster.ray.intersectPlane(groundPlane, intersectionPoint);
        
        if (intersectionPoint) {
            // Snap to grid
            const x = Math.round(intersectionPoint.x / this.cubeSize) * this.cubeSize;
            const z = Math.round(intersectionPoint.z / this.cubeSize) * this.cubeSize;
            
            // Find the highest cube at this x,z position
            const y = this.findHighestCubeAt(x, z);
            
            const key = `${x},${y},${z}`;
            
            // Show preview cube above the highest existing cube (if within height limit)
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
    }
    
    onMouseClick(event) {
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Calculate intersections with the ground plane
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectionPoint = new THREE.Vector3();
        
        this.raycaster.ray.intersectPlane(groundPlane, intersectionPoint);
        
        if (intersectionPoint) {
            // Snap to grid
            const x = Math.round(intersectionPoint.x / this.cubeSize) * this.cubeSize;
            const z = Math.round(intersectionPoint.z / this.cubeSize) * this.cubeSize;
            
            // Find the highest cube at this x,z position
            const y = this.findHighestCubeAt(x, z);
            
            // Place cube on top of the highest existing cube (if within height limit)
            if (y < this.maxHeight) {
                this.placeCube(x, y, z);
            }
        }
    }
    
    onRightClick(event) {
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Check for intersections with existing cubes
        const intersects = this.raycaster.intersectObjects(Array.from(this.cubes.values()));
        
        if (intersects.length > 0) {
            const intersectedCube = intersects[0].object;
            
            // Find the cube in our map and remove it
            this.cubes.forEach((cube, key) => {
                if (cube === intersectedCube) {
                    this.removeCubeByKey(key);
                }
            });
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
            this.cubeCount--;
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
            '#ff0000': 'Red',
            '#00ff00': 'Green',
            '#0000ff': 'Blue',
            '#ffff00': 'Yellow',
            '#ff00ff': 'Magenta',
            '#00ffff': 'Cyan',
            '#ff8800': 'Orange',
            '#8800ff': 'Purple',
            '#ffffff': 'White',
            '#000000': 'Black',
            '#888888': 'Gray',
            '#ff0088': 'Pink'
        };
        
        document.getElementById('current-color').textContent = `Selected: ${colorNames[color] || color}`;
        
        // Update preview cube color
        if (this.previewCube) {
            this.previewCube.material.color.setHex(color.replace('#', '0x'));
        }
    }
    
    onKeyDown(event) {
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
        if (confirm('Are you sure you want to clear all cubes?')) {
            this.cubes.forEach((cube) => {
                this.scene.remove(cube);
            });
            this.cubes.clear();
            this.cubeCount = 0;
            this.updateStats();
        }
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
        this.controls.unlock();
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
        
        if (this.controls.isLocked) {
            // First person movement
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
        // Update preview cube position based on current mouse position
        if (this.mouse && this.raycaster) {
            this.raycaster.setFromCamera(this.mouse, this.camera);
            
            const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const intersectionPoint = new THREE.Vector3();
            
            this.raycaster.ray.intersectPlane(groundPlane, intersectionPoint);
            
            if (intersectionPoint) {
                const x = Math.round(intersectionPoint.x / this.cubeSize) * this.cubeSize;
                const z = Math.round(intersectionPoint.z / this.cubeSize) * this.cubeSize;
                const y = this.findHighestCubeAt(x, z);
                
                if (y < this.maxHeight) {
                    this.previewCube.position.set(x, y, z);
                    this.previewCube.visible = true;
                } else {
                    this.previewCube.visible = false;
                }
            }
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Place3D();
});
