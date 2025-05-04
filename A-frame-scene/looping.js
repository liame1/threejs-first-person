// Custom A-Frame component for looping animations with delay
AFRAME.registerComponent('looping-platform', {
    schema: {
      fromPosition: { type: 'vec3', default: {x: 0, y: -0.4, z: -14.75} },
      toPosition: { type: 'vec3', default: {x: 92, y: -0.4, z: -14.75} },
      duration: { type: 'number', default: 700 },
      delayBeforeMoving: { type: 'number', default: 14800 },
      delayBeforeReset: { type: 'number', default: 2000 }
    },
    
    init: function() {
      // Store the initial position
      this.startPos = new THREE.Vector3(
        this.data.fromPosition.x,
        this.data.fromPosition.y,
        this.data.fromPosition.z
      );
      
      // Store the destination position
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
      
      // Start the animation loop
      this.startAnimationCycle();
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