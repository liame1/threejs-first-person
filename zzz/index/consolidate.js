// Combined JavaScript file for Train Station VR experience

// Asset Loading Manager for A-Frame
// Add this to consolidate.js

// Create a new component for managing asset loading
AFRAME.registerComponent('asset-loading-manager', {
  schema: {
    debug: {type: 'boolean', default: true}
  },

  init: function() {
    // Track loading state
    this.assetsLoaded = false;
    this.sceneReady = false;
    
    // Create loading overlay
    this.createLoadingOverlay();
    
    // Get reference to the scene
    const scene = this.el.sceneEl;
    
    // Track loading assets
    this.assetItems = [];
    this.loadedItems = 0;
    
    // Find all assets that need loading
    this.collectAssets();
    
    // If no assets to load, scene is ready
    if (this.assetItems.length === 0) {
      this.log('No assets to load, scene ready!');
      this.sceneReady = true;
      this.removeLoadingOverlay();
      return;
    }
    
    // Set up event listeners for assets
    this.setupAssetListeners();
    
    // Set up a safety timeout
    this.setupSafetyTimeout();
    
    // Listen for scene loaded event
    scene.addEventListener('loaded', () => {
      this.log('Scene loaded event fired');
      this.checkIfReady();
    });
    
    this.log(`Initialized asset manager. Found ${this.assetItems.length} assets to load.`);
  },
  
  // Collect all assets that need to be loaded
  collectAssets: function() {
    const scene = this.el.sceneEl;
    
    // Find all a-assets elements
    const assetContainers = scene.querySelectorAll('a-assets');
    assetContainers.forEach(container => {
      const items = container.querySelectorAll('*');
      items.forEach(item => this.assetItems.push(item));
    });
    
    // Find all gltf models
    const gltfModels = scene.querySelectorAll('a-gltf-model');
    gltfModels.forEach(model => this.assetItems.push(model));
    
    // Find all images used in textures
    const entitiesWithTextures = scene.querySelectorAll('[material*="src:"]');
    entitiesWithTextures.forEach(entity => this.assetItems.push(entity));
    
    // Find all images in HTML to be rendered as texture
    const htmlImages = document.querySelectorAll('#html-container img');
    htmlImages.forEach(img => this.assetItems.push(img));
    
    this.log(`Collected assets: ${this.assetItems.length} items to load`);
  },
  
  // Setup listeners for all assets
  setupAssetListeners: function() {
    this.assetItems.forEach((item, index) => {
      // Tag the item for debugging
      item.dataset.assetIndex = index;
      
      // Different elements have different load events
      if (item.tagName === 'IMG' || 
          item.tagName === 'AUDIO' || 
          item.tagName === 'VIDEO') {
        // For media elements
        if (item.complete || item.readyState >= 4) {
          // Already loaded
          this.onAssetLoaded(item);
        } else {
          item.addEventListener('load', () => this.onAssetLoaded(item));
          item.addEventListener('error', (e) => this.onAssetError(item, e));
        }
      } else if (item.tagName === 'A-GLTF-MODEL') {
        // For A-Frame GLTF models
        item.addEventListener('model-loaded', () => this.onAssetLoaded(item));
        item.addEventListener('model-error', (e) => this.onAssetError(item, e));
      } else {
        // For other A-Frame entities with textures
        if (item.getAttribute('material')) {
          // Use a timeout to check if material is loaded
          setTimeout(() => {
            if (item.components && 
                item.components.material && 
                item.components.material.material && 
                item.components.material.material.map && 
                item.components.material.material.map.image) {
              this.onAssetLoaded(item);
            } else {
              // Material didn't load properly, but we'll continue anyway
              this.log(`Warning: Material might not be fully loaded for ${item.id || 'unnamed entity'}`);
              this.onAssetLoaded(item);
            }
          }, 1000); // Check after 1 second
        } else {
          // Count it as loaded if it's not a material we can check
          this.onAssetLoaded(item);
        }
      }
    });
  },
  
  // Handle successful asset load
  onAssetLoaded: function(item) {
    this.loadedItems++;
    this.log(`Asset loaded (${this.loadedItems}/${this.assetItems.length}): ${item.id || item.getAttribute('src') || 'unnamed'}`);
    
    // Update loading progress
    this.updateLoadingProgress(this.loadedItems / this.assetItems.length);
    
    // Check if all assets are loaded
    this.checkIfReady();
  },
  
  // Handle asset loading error
  onAssetError: function(item, error) {
    this.log(`Error loading asset: ${item.id || item.getAttribute('src') || 'unnamed'}`, error);
    
    // Count it as "loaded" anyway so we don't hang
    this.loadedItems++;
    this.updateLoadingProgress(this.loadedItems / this.assetItems.length);
    this.checkIfReady();
  },
  
  // Check if everything is loaded and ready
  checkIfReady: function() {
    if (this.assetsLoaded) {
      return; // Already marked as loaded
    }
    
    if (this.loadedItems >= this.assetItems.length) {
      this.log('All assets loaded!');
      this.assetsLoaded = true;
      
      // Give a moment for everything to render
      setTimeout(() => {
        this.sceneReady = true;
        this.removeLoadingOverlay();
        this.log('Scene is ready!');
        
        // Initialize the HTML texture once all assets are loaded
        this.initializeHtmlTexture();
        
        // Emit an event that the scene is fully loaded
        this.el.sceneEl.emit('assets-loaded', {count: this.loadedItems});
      }, 500);
    }
  },
  
  // Create a loading overlay to hide scene until ready
  createLoadingOverlay: function() {
    // Create overlay div
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgb(71, 83, 107, 0.9);;
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      font-family: Arial, sans-serif;
    `;
    
    // Add loading text
    const loadingText = document.createElement('h1');
    loadingText.textContent = 'LOADING';
    overlay.appendChild(loadingText);
    
    // Add progress bar container
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      width: 50%;
      height: 30px;
      background-color: rgb(11, 58, 90,);;
      overflow: hidden;
      margin-top: 20px;
    `;
    
    // Add progress bar
    const progressBar = document.createElement('div');
    progressBar.id = 'loading-progress';
    progressBar.style.cssText = `
      width: 0%;
      height: 100%;
      background-color:rgb(255, 255, 255);
      transition: width 0.3s ease;
    `;
    
    progressContainer.appendChild(progressBar);
    overlay.appendChild(progressContainer);
    
    // Add to body
    document.body.appendChild(overlay);
    this.overlay = overlay;
  },
  
  // Update loading progress bar
  updateLoadingProgress: function(percentage) {
    const progressBar = document.getElementById('loading-progress');
    if (progressBar) {
      progressBar.style.width = `${percentage * 100}%`;
    }
  },
  
  // Remove loading overlay when ready
  removeLoadingOverlay: function() {
    if (this.overlay && this.overlay.parentNode) {
      // Fade out overlay
      this.overlay.style.transition = 'opacity 0.5s ease';
      this.overlay.style.opacity = '0';
      
      // Remove after transition
      setTimeout(() => {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
      }, 500);
    }
  },
  
  // Setup a safety timeout to prevent infinite loading
  setupSafetyTimeout: function() {
    // After 15 seconds, show the scene anyway
    setTimeout(() => {
      if (!this.sceneReady) {
        this.log('Safety timeout reached. Showing scene anyway.');
        this.sceneReady = true;
        this.removeLoadingOverlay();
        this.el.sceneEl.emit('assets-timeout', {
          loaded: this.loadedItems, 
          total: this.assetItems.length
        });
      }
    }, 15000);
  },
  
  // Initialize HTML texture after everything else is loaded
  initializeHtmlTexture: function() {
    const htmlContainer = document.getElementById('html-container');
    const htmlDisplay = document.getElementById('html-display');
    
    if (htmlContainer && htmlDisplay) {
      setTimeout(() => {
        // Use dom-to-image to capture the HTML as an image
        domtoimage.toPng(htmlContainer)
          .then(function(dataUrl) {
            // Create a new image element
            const img = new Image();
            img.onload = function() {
              // Create a new texture from the image
              const texture = new THREE.Texture(img);
              texture.needsUpdate = true;
              
              // Get the Three.js object from A-Frame entity
              const mesh = htmlDisplay.getObject3D('mesh');
              if (mesh) {
                // Update the material with the new texture
                mesh.material.map = texture;
                mesh.material.needsUpdate = true;
              }
              console.log("HTML Texture initialized at " + new Date().toLocaleTimeString());
            };
            img.src = dataUrl;
          })
          .catch(function(error) {
            console.error('Error rendering HTML to image:', error);
          });
      }, 100); // Short delay to ensure DOM is fully ready
    }
  },
  
  // Utility for logging messages
  log: function(message, error) {
    if (this.data.debug) {
      if (error) {
        console.error('[Asset Manager]', message, error);
      } else {
        console.log('[Asset Manager]', message);
      }
    }
  }
});

// Modify setupTrainBoard to return a promise that resolves when complete
function setupTrainBoard() {
  return new Promise((resolve, reject) => {
    try {
      // Ensure elements are available
      if(!document.querySelectorAll('.row:not(:first-child)').length) {
        console.error('Train rows not found');
        reject('Train rows not found');
        return;
      }

      // Get updated reference to train rows
      trainRows = document.querySelectorAll('.row:not(:first-child)');
      
      // Create a list of times 0-4 that we'll use for departure times
      const times = [0, 1, 2, 3, 4];
      
      // Loop through each row in our train board
      trainRows.forEach(function(row) {
        // 1. Pick a random train from our list
        const randomNumber = Math.floor(Math.random() * trainData.length);
        const chosenTrain = trainData[randomNumber];
        
        // 2. Set the train's link
        const trainLink = row.querySelector('a');
        if(trainLink) {
          trainLink.href = chosenTrain.link;
          trainLink.textContent = chosenTrain.link;
        }
        
        // 3. Set a unique departure time
        // If we still have times available, pick one randomly
        let departureTime = 0;  // Default time if we run out
        
        if (times.length > 0) {
          // Pick a random position from our times list
          const randomPosition = Math.floor(Math.random() * times.length);
          // Get the time at that position
          departureTime = times[randomPosition];
          // Remove that time from our list so it's not used again
          times.splice(randomPosition, 1);
        }
        
        // Update the display with our chosen time
        const timeDisplay = row.querySelector('.depart-time');
        if(timeDisplay) {
          timeDisplay.textContent = departureTime + " min";
          timeDisplay.dataset.timeLeft = departureTime;
        }
      });
      
      resolve('Train board setup complete');
    } catch (error) {
      reject(error);
    }
  });
}

// Modified DOM-loaded event handler
document.addEventListener('DOMContentLoaded', function() {
  // Initialize timer/clock elements
  clockDisplay = document.getElementById('timer');
  trainRows = document.querySelectorAll('.row:not(:first-child)');
  
  // Add the asset-loading-manager component to the scene
  const scene = document.querySelector('a-scene');
  if (scene) {
    // Add loading manager component to scene
    if (!scene.hasAttribute('asset-loading-manager')) {
      scene.setAttribute('asset-loading-manager', 'debug: true');
    }
    
    // Listen for when all assets are loaded
    scene.addEventListener('assets-loaded', function() {
      console.log('All assets loaded, initializing game systems');
      
      // Set up game systems only after assets are loaded
      setupTrainBoard()
        .then(() => {
          console.log('Train board initialized');
          startClock();
          console.log('Clock started');
        })
        .catch(error => {
          console.error('Error setting up train board:', error);
        });
    });
    
    // Handle timeout (if not all assets could be loaded)
    scene.addEventListener('assets-timeout', function(e) {
      console.warn(`Loading timeout reached. Loaded ${e.detail.loaded}/${e.detail.total} assets.`);
      
      // Initialize anyway
      setupTrainBoard()
        .then(() => {
          console.log('Train board initialized (after timeout)');
          startClock();
        })
        .catch(error => {
          console.error('Error setting up train board:', error);
        });
    });
  } else {
    // Fallback if scene not found
    console.error('A-Frame scene not found');
    
    // Initialize anyway
    setupTrainBoard()
      .then(() => {
        console.log('Train board initialized (fallback)');
        startClock();
      })
      .catch(error => {
        console.error('Error setting up train board:', error);
      });
  }
});

// ============================================================================
// HELPER UTILITIES
// ============================================================================

// Utility functions for common operations
const Utils = {
  // Get entity dimensions safely from geometry or direct attributes
  getDimensions: function(el) {
    const dims = { width: 1, height: 0.1, depth: 1 }; // Default fallbacks
    
    // Try to get from geometry component
    const geometry = el.getAttribute('geometry');
    if (geometry) {
      if (geometry.width) dims.width = geometry.width;
      if (geometry.depth) dims.depth = geometry.depth;
      if (geometry.height) dims.height = geometry.height;
    } else {
      // Try direct attributes
      const w = el.getAttribute('width');
      const h = el.getAttribute('height');
      const d = el.getAttribute('depth');
      
      if (w) dims.width = w;
      if (h) dims.height = h;
      if (d) dims.depth = d;
    }
    
    return dims;
  }
};

// ========== TRAIN INFORMATION ==========
// This is our list of train data - each train has an image, a link, and a time
const trainData = [
  {name: 'baoledesigns', link: 'https://baoledesigns.github.io/Art-109/main-website/' },
  {name: 'andremation', link: 'https://andremation.com/' },
  {name: 'melt-the-summit', link: 'https://zorzini.itch.io/melt-the-summit' },
  {name: 'clarencehoang', link: 'https://clarencehoang.myportfolio.com/work' },
  {name: 'emmamorales', link: 'https://emmamorales.myportfolio.com/' },
  {name: 'hxu01', link: 'https://hxu01.github.io/index.html' },
  {name: 'nickzorzi', link: 'https://nickzorzi.github.io/' },
  {name: 'sejeongpark', link: 'https://sejeong021213.wixsite.com/sejeongpark' },
  {name: 'rinihimme', link: 'https://rinihimme.com/' },
  {name: 'dannydaodma', link: 'https://dannydaodma.github.io/Portfolio/' },
  {name: 'jessept', link: 'https://jessept.carrd.co/#' },
  {name: 'devyn-bui', link: 'https://sites.google.com/view/devyn-bui/home?authuser=0' },
  {name: 'angeliquejoy', link: 'https://angeliquejoypf21.myportfolio.com/work' },
  {name: 'makenaalowe', link: 'https://makenaalowe.wixsite.com/makena-lowe-portfoli' },
  {name: 'ceruleanmoon', link: 'https://ceruleanmoon.weebly.com/' },
  {name: 'fictionalspace', link: 'https://fictionalspace.github.io/Portfolio/index.html' },
  {name: 'ssgraphicsdesign', link: 'https://ssgraphicsdesign.com/' },
  {name: 'daledeguzman', link: 'https://daledeguzman.carrd.co/' },
  {name: 'dietrichsteinberg', link: 'https://dietrichsteinberg.github.io/' },
  {name: 'joeyluv03', link: 'https://joeyluv03.github.io/portfolio/index.html' }
];

// ========== GAME SETTINGS ==========
// These variables control how our train board works
let timerIsRunning = true;     // Is the clock running?
let playerIsBoarded = false;   // Player is not boarded by default
let countdownTimer = 23;       // Seconds counter (resets to 10)
let clockDisplay, trainRows;   // DOM elements we'll need to update

// ============================================================================
// POSITION LOGGER COMPONENT
// ============================================================================

AFRAME.registerComponent('position-logger', {
  schema: {
    target: {type: 'selector', default: '#rig'}, // Default to #rig but can be any entity
    interval: {type: 'number', default: 500},    // How often to log (ms)
    precision: {type: 'number', default: 2},     // Decimal places to include
    showOnScreen: {type: 'boolean', default: true}, // Whether to show position on screen
    logToConsole: {type: 'boolean', default: true}, // Whether to log to console
    xThreshold: {type: 'number', default: 70}    // Threshold for custom logs
  },

  init: function() {
    this.lastLogTime = 0;
    this.hasBoarded = false; // Track if player has already boarded
  },
  
  tick: function(time) {
    // Only log at the specified interval
    if (time - this.lastLogTime < this.data.interval) return;
    this.lastLogTime = time;
    
    // Get the target element (usually the camera rig)
    const target = this.data.target || this.el;
    if (!target) return;
    
    // Get position
    const position = target.object3D.position;
    
    // Format position with specified precision
    const x = position.x.toFixed(this.data.precision);
    const y = position.y.toFixed(this.data.precision);
    const z = position.z.toFixed(this.data.precision);
    
    // Format the position string
    const posStr = `Position: x:${x} y:${y} z:${z}`;
    
    // Log to console if enabled
    if (this.data.logToConsole) {
      console.log(posStr);
    }
    
    // Set playerIsBoarded based on x position and open link if first time boarding
    if (position.x >= 60) {
      // Only do this if player wasn't boarded before
      if (!this.hasBoarded) {
        console.log("PASSED x60! Player is now boarded.");
        playerIsBoarded = true;
        this.hasBoarded = true;
        
        // Open the first available link immediately
        openEarliestTrainLink();
      }
    } else {
      playerIsBoarded = false;
      this.hasBoarded = false;
    }
    
    // Check for threshold events
    if (position.x >= this.data.xThreshold) {
      console.log(`PASSED x${this.data.xThreshold}!`);
    }
  }
});

// Function to find and open the train link with the earliest departure time
function openEarliestTrainLink() {
  // Get all train rows
  const trainRows = document.querySelectorAll('.row:not(:first-child)');
  let earliestTrain = null;
  let earliestTime = Infinity;
  
  // Find the train with the earliest departure time
  trainRows.forEach(function(row) {
    const timeDisplay = row.querySelector('.depart-time');
    if (!timeDisplay) return;
    
    const departureTime = parseInt(timeDisplay.dataset.timeLeft);
    
    // Update if this train departs sooner than the current earliest
    if (departureTime < earliestTime) {
      earliestTime = departureTime;
      earliestTrain = row;
    }
  });
  
  // Open the link of the earliest train
  if (earliestTrain) {
    const linkElement = earliestTrain.querySelector('a');
    if (linkElement) {
      const linkToOpen = linkElement.href;
      open(linkToOpen);
      console.log("Opening link for earliest departing train (time: " + earliestTime + "):", linkToOpen);
    }
  }
}

// ============================================================================
// PLATFORM CARRIER COMPONENT
// ============================================================================

AFRAME.registerComponent('platform-carrier', {
  schema: {
    playerSelector: {type: 'string', default: '#rig'}
  },

  init: function() {
    this.player = document.querySelector(this.data.playerSelector);
    this.isPlayerRiding = false;
    this.platformVelocity = new THREE.Vector3();
    this.lastPosition = new THREE.Vector3();
    this.currentPosition = new THREE.Vector3();
    this.yOffset = 0;
    
    // Store initial position
    this.el.object3D.getWorldPosition(this.lastPosition);
    this.currentPosition.copy(this.lastPosition);
    
    // Set up collision detection
    this.el.addEventListener('collide', this.checkCollision.bind(this));
    
    console.log("Platform carrier initialized", this.el.id || "unnamed platform");
  },

  checkCollision: function(event) {
    // Check if collision is with the player
    if (event.detail.body.el.id === 'rig') {
      console.log("Collision detected with player");
      
      // Calculate if player is on top of platform
      const playerPos = this.player.object3D.position;
      const platformPos = this.el.object3D.position;
      
      // Get platform dimensions
      const dims = Utils.getDimensions(this.el);
      const platformTop = platformPos.y + (dims.height / 2);
      
      // Check if player is standing on top (with some tolerance)
      const tolerance = 0.5; // Adjust based on scene scale
      if (playerPos.y >= platformTop - tolerance) {
        if (!this.isPlayerRiding) {
          this.isPlayerRiding = true;
          // Calculate initial Y offset when first steps on platform
          this.yOffset = playerPos.y - platformTop;
          console.log("Player started riding platform, yOffset:", this.yOffset);
        }
      }
    }
  },

  tick: function(time, delta) {
    // Update current position
    this.lastPosition.copy(this.currentPosition);
    this.el.object3D.getWorldPosition(this.currentPosition);
    
    // Calculate platform velocity
    this.platformVelocity.subVectors(this.currentPosition, this.lastPosition);
    
    // Only proceed if platform is actually moving
    if (this.platformVelocity.lengthSq() > 0.00001 && time % 1000 < 20) {
      // Log occasionally
      console.log("Platform moving:", this.platformVelocity);
    }
    
    // Check if player is still on platform
    if (this.isPlayerRiding) {
      const playerPos = this.player.object3D.position;
      const platformPos = this.el.object3D.position;
      
      // Get platform dimensions
      const dims = Utils.getDimensions(this.el);
      
      // Check if player is still above platform bounds
      const halfWidth = dims.width / 2;
      const halfDepth = dims.depth / 2;
      
      if (playerPos.x < platformPos.x - halfWidth || playerPos.x > platformPos.x + halfWidth ||
          playerPos.z < platformPos.z - halfDepth || playerPos.z > platformPos.z + halfDepth ||
          playerPos.y > platformPos.y + dims.height + 3) { // Allow some vertical room
        this.isPlayerRiding = false;
        console.log("Player left platform");
      } else {
        // Move player with platform
        this.player.object3D.position.add(this.platformVelocity);
        
        // Maintain Y offset from platform top (so they don't sink in)
        const platformTop = platformPos.y + (dims.height / 2);
        this.player.object3D.position.y = platformTop + this.yOffset;
        
        // Force update player physics body position if it exists
        if (this.player.body) {
          const playerBody = this.player.body;
          playerBody.position.copy(this.player.object3D.position);
          playerBody.velocity.set(0, 0, 0); // Prevent physics from fighting us
        }
      }
    }
  }
});

// ============================================================================
// LOOPING PLATFORM COMPONENT
// ============================================================================

AFRAME.registerComponent('looping-platform', {
  schema: {
    fromPosition: { type: 'vec3', default: {x: 0, y: -0.4, z: -14.75} },
    toPosition: { type: 'vec3', default: {x: 92, y: -0.4, z: -14.75} },
    duration: { type: 'number', default: 700 },
    delayBeforeMoving: { type: 'number', default: 14800 },
    delayBeforeReset: { type: 'number', default: 2000 }
  },
  
  init: function() {
    // Store the initial and destination positions
    this.startPos = new THREE.Vector3(
      this.data.fromPosition.x,
      this.data.fromPosition.y,
      this.data.fromPosition.z
    );
    
    this.endPos = new THREE.Vector3(
      this.data.toPosition.x,
      this.data.toPosition.y,
      this.data.toPosition.z
    );
    
    // Set initial position
    this.el.setAttribute('position', this.startPos);
    
    // Initialize state
    this.animationState = 'waiting';
    this.startTime = null;
    this.currentDelay = this.data.delayBeforeMoving;
    this.pausedTime = null;
    this.positionBeforePause = new THREE.Vector3();
    
    // Start the animation cycle
    this.startAnimationCycle();
    
    // Listen for scene-wide animation pause/resume events
    const scene = this.el.sceneEl;
    scene.addEventListener('animations-paused', () => {
      if (this.animationState !== 'paused') {
        // Store current state before pausing
        this.stateBeforePause = this.animationState;
        this.positionBeforePause.copy(this.el.object3D.position);
        this.pausedTime = performance.now();
        this.animationState = 'paused';
        console.log("Platform animation paused");
      }
    });
    
    scene.addEventListener('animations-resumed', () => {
      if (this.animationState === 'paused') {
        // Calculate time adjustment for resuming
        const pauseDuration = performance.now() - this.pausedTime;
        if (this.startTime) this.startTime += pauseDuration;
        this.animationState = this.stateBeforePause || 'waiting';
        console.log("Platform animation resumed to state:", this.animationState);
      }
    });
  },
  
  startAnimationCycle: function() {
    // Reset state
    this.animationState = 'waiting';
    this.startTime = null;
    this.currentDelay = this.data.delayBeforeMoving;
    
    // Set to starting position immediately
    this.el.setAttribute('position', this.startPos);
    
    console.log("Platform ready, waiting for delay before movement");
  },
  
  tick: function(time, deltaTime) {
    // First call, set the reference time
    if (this.startTime === null) {
      this.startTime = time;
      return;
    }
    
    // Skip updates while paused
    if (this.animationState === 'paused') {
      return;
    }
    
    // Calculate elapsed time
    const elapsed = time - this.startTime;
    
    // State machine for the animation
    switch (this.animationState) {
      case 'waiting':
        // Wait for the specified delay before moving
        if (elapsed >= this.currentDelay) {
          this.animationState = 'moving';
          this.startTime = time; // Reset timer for the movement phase
          console.log("Platform starting to move");
        }
        break;
        
      case 'moving':
        // Move from start to end position over the duration
        if (elapsed < this.data.duration) {
          // Calculate progress (0 to 1)
          const progress = elapsed / this.data.duration;
          
          // Interpolate position
          const newPos = new THREE.Vector3().lerpVectors(
            this.startPos,
            this.endPos,
            progress
          );
          
          // Update position
          this.el.setAttribute('position', newPos);
        } else {
          // Reached the end position, wait before resetting
          this.el.setAttribute('position', this.endPos);
          this.animationState = 'completed';
          this.startTime = time; // Reset timer for the reset delay
          console.log("Platform reached destination, waiting before reset");
        }
        break;
        
      case 'completed':
        // Wait for a delay before resetting
        if (elapsed >= this.data.delayBeforeReset) {
          console.log("Platform resetting");
          this.startAnimationCycle();
        }
        break;
    }
  }
});

// ============================================================================
// ANIMATION PAUSER COMPONENT
// ============================================================================

AFRAME.registerComponent('animation-pauser', {
  schema: {
    target: {type: 'selector', default: '#rig'}, // Entity to track (player rig)
    xThreshold: {type: 'number', default: 70},   // X position threshold to trigger pause
    resumeThreshold: {type: 'number', default: 65}, // X position to resume animations
    targetAnimations: {type: 'array', default: ['*']}, // Which animations to pause
    affectMixers: {type: 'boolean', default: true}, // Pause animation-mixer components
    affectAnimations: {type: 'boolean', default: true} // Pause animation components
  },
  
  init: function() {
    this.isPaused = false;
    this.lastCheckTime = 0;
    this.checkInterval = 250; // ms between checks
    
    console.log("Animation pauser initialized - will pause at x:", this.data.xThreshold);
  },
  
  tick: function(time) {
    // Check position periodically (not every frame for performance)
    if (time - this.lastCheckTime < this.checkInterval) return;
    this.lastCheckTime = time;
    
    // Get target position (usually player rig)
    const target = this.data.target;
    if (!target || !target.object3D) return;
    
    const position = target.object3D.position;
    
    // Check threshold
    if (!this.isPaused && position.x >= this.data.xThreshold) {
      // Pause animations
      this.pauseAllAnimations();
      this.isPaused = true;
      console.log("Animations paused at x:", position.x.toFixed(2));
    } 
    // Optional: Resume when moving back
    else if (this.isPaused && position.x < this.data.resumeThreshold) {
      // Resume animations
      this.resumeAllAnimations();
      this.isPaused = false;
      console.log("Animations resumed at x:", position.x.toFixed(2));
    }
  },
  
  pauseAllAnimations: function() {
    const scene = this.el.sceneEl;
    
    // Pause animation-mixer components (for GLTF models)
    if (this.data.affectMixers) {
      const mixers = Array.from(document.querySelectorAll('[animation-mixer]'));
      mixers.forEach(el => {
        // Access the animation mixer component
        const mixer = el.components['animation-mixer'];
        if (mixer && mixer.mixer) {
          // Store current timeScale before pausing
          el.dataset.previousTimeScale = mixer.mixer.timeScale;
          mixer.mixer.timeScale = 0;
          console.log("Paused animation-mixer on:", el.id || "unnamed entity");
        }
      });
    }
    
    // Pause animation components
    if (this.data.affectAnimations) {
      const animations = Array.from(document.querySelectorAll('[animation]'));
      animations.forEach(el => {
        const animationComponents = Object.keys(el.components).filter(name => 
          name === 'animation' || name.startsWith('animation__'));
          
        animationComponents.forEach(name => {
          const anim = el.components[name];
          if (anim && !anim.paused) {
            anim.pause();
            console.log("Paused animation on:", el.id || "unnamed entity");
          }
        });
      });
    }
    
    // Emit a global event for other components to react to
    scene.emit('animations-paused');
  },
  
  resumeAllAnimations: function() {
    const scene = this.el.sceneEl;
    
    // Resume animation-mixer components
    if (this.data.affectMixers) {
      const mixers = Array.from(document.querySelectorAll('[animation-mixer]'));
      mixers.forEach(el => {
        const mixer = el.components['animation-mixer'];
        if (mixer && mixer.mixer) {
          // Restore previous timeScale or default to 1
          const prevTimeScale = parseFloat(el.dataset.previousTimeScale) || 1;
          mixer.mixer.timeScale = prevTimeScale;
          console.log("Resumed animation-mixer on:", el.id || "unnamed entity");
        }
      });
    }
    
    // Resume animation components
    if (this.data.affectAnimations) {
      const animations = Array.from(document.querySelectorAll('[animation]'));
      animations.forEach(el => {
        const animationComponents = Object.keys(el.components).filter(name => 
          name === 'animation' || name.startsWith('animation__'));
          
        animationComponents.forEach(name => {
          const anim = el.components[name];
          if (anim && anim.paused) {
            anim.resume();
            console.log("Resumed animation on:", el.id || "unnamed entity");
          }
        });
      });
    }
    
    // Emit a global event for other components to react to
    scene.emit('animations-resumed');
  },
  
  // Clean up when the component is removed
  remove: function() {
    // Make sure to resume animations if component is removed while paused
    if (this.isPaused) {
      this.resumeAllAnimations();
    }
  }
});

// ============================================================================
// DEBUG HELPER COMPONENT
// ============================================================================

// Helper to visualize collision events
AFRAME.registerComponent('debug-collision', {
  init: function() {
    this.el.addEventListener('collide', function(e) {
      console.log('Collision detected between:', 
                 this.id || 'unnamed', 'and', 
                 e.detail.body.el.id || 'unnamed');
    });
  }
});

// ========== TRAIN BOARD FUNCTIONS ==========
// This function sets up our train board when the page loads
function setupTrainBoard() {
  // Ensure elements are available
  if(!document.querySelectorAll('.row:not(:first-child)').length) {
    console.error('Train rows not found');
    return;
  }

  // Get updated reference to train rows
  trainRows = document.querySelectorAll('.row:not(:first-child)');
  
  // Create a list of times 0-4 that we'll use for departure times
  const times = [0, 1, 2, 3, 4];
  
  // Loop through each row in our train board
  trainRows.forEach(function(row) {
    // 1. Pick a random train from our list
    const randomNumber = Math.floor(Math.random() * trainData.length);
    const chosenTrain = trainData[randomNumber];
    
    // 2. Set the train's link
    const trainLink = row.querySelector('a');
    if(trainLink) {
      trainLink.href = chosenTrain.link;
      trainLink.textContent = chosenTrain.link;
    }
    
    // 3. Set a unique departure time
    // If we still have times available, pick one randomly
    let departureTime = 0;  // Default time if we run out
    
    if (times.length > 0) {
      // Pick a random position from our times list
      const randomPosition = Math.floor(Math.random() * times.length);
      // Get the time at that position
      departureTime = times[randomPosition];
      // Remove that time from our list so it's not used again
      times.splice(randomPosition, 1);
    }
    
    // Update the display with our chosen time
    const timeDisplay = row.querySelector('.depart-time');
    if(timeDisplay) {
      timeDisplay.textContent = departureTime + " min";
      timeDisplay.dataset.timeLeft = departureTime;
    }
  });
}

// ========== RUN THE CLOCK ==========
// This function runs our countdown timer
function startClock() {
  // Ensure the clock display element exists
  if(!document.getElementById('timer')) {
    console.error('Timer element not found');
    return;
  }
  
  clockDisplay = document.getElementById('timer');
  
  // This runs every second (1000 milliseconds)
  let timer = setInterval(function() {
    // Only count down if the game isn't paused
    if (timerIsRunning) {
      // Decrease our countdown by 1 second
      countdownTimer = countdownTimer - 1;
      
      // Update Clock Display
      clockDisplay.textContent = "00:" + String(countdownTimer).padStart(2, '0');
      
      // When we reach zero...
      if (countdownTimer <= 0) {
        // Reset the seconds counter
        countdownTimer = 23;
        
        // Update all the train departure times
        updateTrainTimes();
      }
    }
  }, 1000);
}

// ========== UPDATE TRAIN TIMES ==========
// This function updates the departure time for all trains
function updateTrainTimes() {
  // Get updated reference to train rows
  trainRows = document.querySelectorAll('.row:not(:first-child)');
  
  // Go through each train row
  trainRows.forEach(function(row) {
    // Get the time display element
    const timeDisplay = row.querySelector('.depart-time');
    if(!timeDisplay) return;
    
    // Get current time and subtract 1 minute
    let currentTime = parseInt(timeDisplay.dataset.timeLeft) - 1;
    
    // Save the new time
    timeDisplay.dataset.timeLeft = currentTime;
    
    // Note: We no longer check playerIsBoarded here because
    // link opening is now handled in the position-logger component
    
    // If the train is departing (time reached zero or less)
    if (currentTime < 0) {
      // Add a new train to replace this one
      addNewTrain(row);
    } else {
      // Otherwise just update the display
      timeDisplay.textContent = currentTime + " min";
    }
  });
}

// ========== ADD A NEW TRAIN ==========
// This function replaces a departing train with a new one
function addNewTrain(row) {
  // 1. Pick a random train from our list
  const randomNumber = Math.floor(Math.random() * trainData.length);
  const newTrain = trainData[randomNumber];
  
  // 2. Update the train's link
  const trainLink = row.querySelector('a');
  if(trainLink) {
    trainLink.href = newTrain.link;
    trainLink.textContent = newTrain.link;
  }
  
  // 3. Set the departure time (always 4 minutes)
  const timeDisplay = row.querySelector('.depart-time');
  if(timeDisplay) {
    timeDisplay.textContent = "4 min";
    timeDisplay.dataset.timeLeft = 4;
  }
  
  // 4. Add a highlight effect to show it's new
  row.classList.add('new-train');
  
  // Remove the highlight effect after the animation completes
  setTimeout(function() {
    row.classList.remove('new-train');
  }, 4000); // <-- SET TO SAME TIME AS CSS ANIMATION!
}

// ========== DOM-TO-IMAGE TEXTURE MAPPING ==========
// This handles converting HTML to a texture for A-Frame
document.addEventListener('DOMContentLoaded', function() {
  // Initialize timer/clock elements
  clockDisplay = document.getElementById('timer');
  trainRows = document.querySelectorAll('.row:not(:first-child)');
  
  // Set up the train board once DOM is loaded
  setupTrainBoard();
  startClock();

  // Check if we're in the texture update environment
  const htmlContainer = document.getElementById('html-container');
  const htmlDisplay = document.getElementById('html-display');
  
  // Only run this if we have both elements
  if (htmlContainer && htmlDisplay) {
    // Variable to keep track of the last update time
    let lastTextureUpdateTime = 0;
    // Set texture update interval to 10 seconds (10000 ms)
    const textureUpdateInterval = 1000;
    let shouldUpdateOnNextTick = true;
    
    // Function to update the texture
    function updateTexture() {
      // Use dom-to-image to capture the HTML as an image
      domtoimage.toPng(htmlContainer)
        .then(function(dataUrl) {
          // Create a new image element
          const img = new Image();
          img.onload = function() {
            // Create a new texture from the image
            const texture = new THREE.Texture(img);
            texture.needsUpdate = true;
            
            // Get the Three.js object from A-Frame entity
            const mesh = htmlDisplay.getObject3D('mesh');
            if (mesh) {
              // Update the material with the new texture
              mesh.material.map = texture;
              mesh.material.needsUpdate = true;
            }
            console.log("Texture updated at " + new Date().toLocaleTimeString());
          };
          img.src = dataUrl;
        })
        .catch(function(error) {
          console.error('Error rendering HTML to image:', error);
        });
    }
    
    // Set up a tick function that will update the texture every 10 seconds
    htmlDisplay.sceneEl.addEventListener('loaded', function() {
      // Update texture immediately when scene loads
      updateTexture();
      
      // Then set up interval-based updates
      setInterval(updateTexture, textureUpdateInterval);
      
      console.log("Texture update system initialized with " + 
                 (textureUpdateInterval / 100) + " second interval");
    });
  }
});

// ============================================================================
// PHYSICS TOGGLE COMPONENT
// ============================================================================

AFRAME.registerComponent('physics-toggle', {
  schema: {
    initialState: { type: 'boolean', default: true },   // Start with physics enabled?
    hideWhenDisabled: { type: 'boolean', default: true }, // Hide object when physics disabled
    toggleEventName: { type: 'string', default: '' },     // Event to listen for to toggle
    disableDelay: { type: 'number', default: 0 },         // Delay before disabling physics (ms)
    disableDuration: { type: 'number', default: 1000 },   // How long to keep physics disabled (ms)
    loopDelay: { type: 'number', default: 0 },           // Delay before starting next loop cycle (ms)
    loop: { type: 'boolean', default: false }            // Repeat the toggle cycle?
  },
  
  init: function() {
    // Store reference to this component on the element
    this.el.physicsToggle = this;
    
    // Store original properties to restore later
    this.originalBodyType = null;
    this.originalVisibility = this.el.getAttribute('visible') !== false;
    
    // Track timers
    this.disableTimer = null;
    this.enableTimer = null;
    
    // Bind methods
    this.togglePhysics = this.togglePhysics.bind(this);
    this.enablePhysics = this.enablePhysics.bind(this);
    this.disablePhysics = this.disablePhysics.bind(this);
    this.startToggleCycle = this.startToggleCycle.bind(this);
    
    // Set up event listener if provided
    if (this.data.toggleEventName) {
      this.el.addEventListener(this.data.toggleEventName, this.startToggleCycle);
    }
    
    // Set initial state
    if (!this.data.initialState) {
      // Start with physics disabled if initialState is false
      setTimeout(this.disablePhysics, 0);
    }
    
    // Auto-start toggle cycle if loop is enabled
    if (this.data.loop) {
      this.startToggleCycle();
    }
    
    console.log("Physics toggle initialized on:", this.el.id || "unnamed entity");
  },
  
  // Start the toggle cycle
  startToggleCycle: function() {
    // Clear any existing timers
    this.clearTimers();
    
    // Schedule disable
    this.disableTimer = setTimeout(() => {
      this.disablePhysics();
      
      // Schedule enable (if duration > 0)
      if (this.data.disableDuration > 0) {
        this.enableTimer = setTimeout(() => {
          this.enablePhysics();
          
          // Restart the cycle if looping
          if (this.data.loop) {
            // If loopDelay is set, wait before starting next cycle
            if (this.data.loopDelay > 0) {
              console.log(`Waiting ${this.data.loopDelay}ms before next physics toggle cycle on:`, this.el.id || "unnamed entity");
              setTimeout(() => {
                this.startToggleCycle();
              }, this.data.loopDelay);
            } else {
              // No delay, start next cycle immediately
              this.startToggleCycle();
            }
          }
        }, this.data.disableDuration);
      }
    }, this.data.disableDelay);
    
    return this;
  },
  
  // Clear all timers
  clearTimers: function() {
    if (this.disableTimer) {
      clearTimeout(this.disableTimer);
      this.disableTimer = null;
    }
    
    if (this.enableTimer) {
      clearTimeout(this.enableTimer);
      this.enableTimer = null;
    }
  },
  
  // Toggle physics state
  togglePhysics: function() {
    if (this.data.initialState) {
      this.disablePhysics();
    } else {
      this.enablePhysics();
    }
    
    // Flip the state
    this.data.initialState = !this.data.initialState;
    
    return this;
  },
  
  // Disable physics
  disablePhysics: function() {
    // Get physics body
    if (!this.el.body) {
      console.warn("No physics body found on element:", this.el.id || "unnamed entity");
      return this;
    }
    
    // Store original body type for re-enabling later
    this.originalBodyType = this.el.body.type;
    
    // Get physics component
    const staticBody = this.el.components['static-body'];
    const dynamicBody = this.el.components['dynamic-body'];
    const kinematicBody = this.el.components['kinematic-body'];
    
    // Disable appropriate body component
    if (staticBody) {
      // Remove physics influence
      this.el.body.type = CANNON.Body.KINEMATIC;
      this.el.body.updateMassProperties();
      
      // Make it non-physical
      this.el.body.collisionResponse = false;
    }
    else if (dynamicBody || kinematicBody) {
      // Similar handling for dynamic/kinematic bodies
      this.el.body.collisionResponse = false;
    }
    
    // Set mass to 0 to disable gravity
    this.el.body.mass = 0;
    this.el.body.updateMassProperties();
    
    // Hide the object if configured to do so
    if (this.data.hideWhenDisabled) {
      this.el.setAttribute('visible', false);
    }
    
    console.log("Physics disabled on:", this.el.id || "unnamed entity");
    
    // Emit event
    this.el.emit('physics-disabled', {el: this.el});
    
    return this;
  },
  
  // Enable physics
  enablePhysics: function() {
    // Get physics body
    if (!this.el.body) {
      console.warn("No physics body found on element:", this.el.id || "unnamed entity");
      return this;
    }
    
    // Restore original body type
    if (this.originalBodyType !== null) {
      this.el.body.type = this.originalBodyType;
    } else {
      // Default to static if we don't know the original
      this.el.body.type = CANNON.Body.STATIC;
    }
    
    // Re-enable collision response
    this.el.body.collisionResponse = true;
    
    // Restore mass if it was changed
    if (this.el.body.mass === 0 && this.originalBodyType !== CANNON.Body.STATIC) {
      this.el.body.mass = 5; // Default mass
      this.el.body.updateMassProperties();
    }
    
    // Update physics state
    this.el.body.updateMassProperties();
    
    // Restore visibility
    if (this.data.hideWhenDisabled && this.originalVisibility !== false) {
      this.el.setAttribute('visible', true);
    }
    
    console.log("Physics enabled on:", this.el.id || "unnamed entity");
    
    // Emit event
    this.el.emit('physics-enabled', {el: this.el});
    
    return this;
  },
  
  // Clean up when the component is removed
  remove: function() {
    // Clear any pending timers
    this.clearTimers();
    
    // Remove event listener
    if (this.data.toggleEventName) {
      this.el.removeEventListener(this.data.toggleEventName, this.startToggleCycle);
    }
    
    // Restore original visibility
    if (this.originalVisibility !== undefined) {
      this.el.setAttribute('visible', this.originalVisibility);
    }
    
    // Make sure physics is re-enabled
    if (!this.data.initialState) {
      this.enablePhysics();
    }
    
    // Remove reference
    delete this.el.physicsToggle;
    
    console.log("Physics toggle component removed from:", this.el.id || "unnamed entity");
  }
});

// ============================================================================
// ANIMATION-TRIGGERED PHYSICS TOGGLE
// ============================================================================

AFRAME.registerComponent('animation-physics-toggle', {
  schema: {
    disableOnStart: { type: 'boolean', default: true },  // Disable physics when animation starts
    enableOnComplete: { type: 'boolean', default: true } // Enable physics when animation completes
  },
  
  init: function() {
    const el = this.el;
    
    // Make sure element has physics-toggle component
    if (!el.components['physics-toggle']) {
      el.setAttribute('physics-toggle', '');
      console.log("Added physics-toggle component to:", el.id || "unnamed entity");
    }
    
    // Bind event handlers
    this.onAnimationStart = this.onAnimationStart.bind(this);
    this.onAnimationComplete = this.onAnimationComplete.bind(this);
    
    // Find animation components
    const animComponents = Object.keys(el.components).filter(key => 
      key === 'animation' || key.startsWith('animation__')
    );
    
    // Add event listeners for each animation component
    if (animComponents.length > 0) {
      el.addEventListener('animationstart', this.onAnimationStart);
      el.addEventListener('animationcomplete', this.onAnimationComplete);
    }
    
    // Also check for animation-mixer (GLTF animations)
    if (el.components['animation-mixer']) {
      // This is trickier since animation-mixer doesn't emit standard events
      // We'll hook into the tick function
      const mixer = el.components['animation-mixer'];
      
      // Store original timeScale to detect changes
      this.lastTimeScale = mixer.mixer ? mixer.mixer.timeScale : 0;
      
      // Add our own tick function
      this.tick = (time) => {
        if (!mixer.mixer) return;
        
        // Detect animation start (timeScale goes from 0 to >0)
        if (this.lastTimeScale === 0 && mixer.mixer.timeScale > 0) {
          this.onAnimationStart();
        }
        
        // Detect animation stop (timeScale goes from >0 to 0)
        else if (this.lastTimeScale > 0 && mixer.mixer.timeScale === 0) {
          this.onAnimationComplete();
        }
        
        // Store for next frame
        this.lastTimeScale = mixer.mixer.timeScale;
      };
    }
    
    console.log("Animation-physics-toggle initialized on:", el.id || "unnamed entity");
  },
  
  // Handle animation start
  onAnimationStart: function() {
    if (this.data.disableOnStart && this.el.physicsToggle) {
      this.el.physicsToggle.disablePhysics();
      console.log("Animation started, physics disabled on:", this.el.id || "unnamed entity");
    }
  },
  
  // Handle animation complete
  onAnimationComplete: function() {
    if (this.data.enableOnComplete && this.el.physicsToggle) {
      this.el.physicsToggle.enablePhysics();
      console.log("Animation completed, physics enabled on:", this.el.id || "unnamed entity");
    }
  },
  
  // Clean up when removed
  remove: function() {
    const el = this.el;
    
    // Remove event listeners
    el.removeEventListener('animationstart', this.onAnimationStart);
    el.removeEventListener('animationcomplete', this.onAnimationComplete);
  }
});