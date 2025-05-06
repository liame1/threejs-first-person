/* 
 * Combined A-Frame Components
 * Includes: 
 * - Position Logger
 * - Platform Carrier
 * - Looping Platform
 * - Animation Pauser
 * - Debug Helper
 */

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
      
      // Check for threshold events
      if (position.x >= this.data.xThreshold) {
        console.log(`PASSED x${this.data.xThreshold}!`);
      }
    }
  });
  
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