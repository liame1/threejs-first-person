// A-Frame component to pause animations when player exceeds a position threshold
AFRAME.registerComponent('animation-pauser', {
    schema: {
      target: {type: 'selector', default: '#rig'}, // Entity to track (player rig)
      xThreshold: {type: 'number', default: 70},   // X position threshold to trigger pause
      resumeThreshold: {type: 'number', default: 65}, // X position to resume animations (optional)
      targetAnimations: {type: 'array', default: ['*']}, // Which animations to pause ('*' for all)
      affectMixers: {type: 'boolean', default: true}, // Pause animation-mixer components
      affectAnimations: {type: 'boolean', default: true} // Pause animation components
    },
    
    init: function() {
      this.isPaused = false;
      this.lastCheckTime = 0;
      this.checkInterval = 250; // ms between checks (adjust for performance)
      
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