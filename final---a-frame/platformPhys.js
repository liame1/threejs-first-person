// Component to make a platform carry the player
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
      
      // Debug logging
      console.log("Platform carrier initialized", this.el.id || "unnamed platform");
    },
  
    checkCollision: function(event) {
      // Check if collision is with the player
      if (event.detail.body.el.id === 'rig') {
        console.log("Collision detected with player");
        
        // Calculate if player is on top of platform
        const playerPos = this.player.object3D.position;
        const platformPos = this.el.object3D.position;
        
        // Get platform dimensions safely
        let platformHeight = 0.1; // Default fallback
        
        // Try to get geometry from component or direct attributes
        const geometry = this.el.getAttribute('geometry');
        if (geometry && geometry.height) {
          platformHeight = geometry.height;
        } else {
          // Try direct attribute
          const directHeight = this.el.getAttribute('height');
          if (directHeight) platformHeight = directHeight;
        }
        
        const platformTop = platformPos.y + (platformHeight / 2);
        
        // Check if player is standing on top (with some tolerance)
        const tolerance = 0.5; // Adjust based on your scene scale
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
      if (this.platformVelocity.lengthSq() > 0.00001) {
        // Debug info
        if (time % 1000 < 20) { // Log occasionally
          console.log("Platform moving:", this.platformVelocity);
        }
      }
      
      // Check if player is still on platform
      if (this.isPlayerRiding) {
        const playerPos = this.player.object3D.position;
        const platformPos = this.el.object3D.position;
        
        // Get platform dimensions safely
        let platformWidth = 1;
        let platformDepth = 1;
        let platformHeight = 0.1;
        
        // Try to get from geometry component
        const geometry = this.el.getAttribute('geometry');
        if (geometry) {
          if (geometry.width) platformWidth = geometry.width;
          if (geometry.depth) platformDepth = geometry.depth;
          if (geometry.height) platformHeight = geometry.height;
        } else {
          // Try direct attributes
          const directWidth = this.el.getAttribute('width');
          const directDepth = this.el.getAttribute('depth');
          const directHeight = this.el.getAttribute('height');
          
          if (directWidth) platformWidth = directWidth;
          if (directDepth) platformDepth = directDepth;
          if (directHeight) platformHeight = directHeight;
        }
        
        // Check if player is still above platform bounds
        const halfWidth = platformWidth / 2;
        const halfDepth = platformDepth / 2;
        
        if (playerPos.x < platformPos.x - halfWidth || playerPos.x > platformPos.x + halfWidth ||
            playerPos.z < platformPos.z - halfDepth || playerPos.z > platformPos.z + halfDepth ||
            playerPos.y > platformPos.y + platformHeight + 3) { // Allow some vertical room
          this.isPlayerRiding = false;
          console.log("Player left platform");
        } else {
          // Move player with platform
          this.player.object3D.position.add(this.platformVelocity);
          
          // Maintain Y offset from platform top (so they don't sink in)
          const platformTop = platformPos.y + (platformHeight / 2);
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