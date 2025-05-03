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
},

checkCollision: function(event) {
    // Check if collision is with the player
    if (event.detail.body.el.id === 'rig') {
    // Calculate if player is on top of platform
    const playerPos = this.player.object3D.position;
    const platformPos = this.el.object3D.position;
    const platformHeight = this.el.getAttribute('geometry').height || 0.1;
    const platformTop = platformPos.y + (platformHeight / 2);
    
    // Check if player is standing on top (with some tolerance)
    const tolerance = 0.5; // Adjust based on your scene scale
    if (playerPos.y >= platformTop - tolerance) {
        if (!this.isPlayerRiding) {
        this.isPlayerRiding = true;
        // Calculate initial Y offset when player first steps on platform
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
    
    // Check if player is still on platform
    if (this.isPlayerRiding) {
    const playerPos = this.player.object3D.position;
    const platformPos = this.el.object3D.position;
    const platformWidth = this.el.getAttribute('width') || 1;
    const platformDepth = this.el.getAttribute('depth') || 1;
    const platformHeight = this.el.getAttribute('height') || 0.1;
    
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
    }
    }
}
});