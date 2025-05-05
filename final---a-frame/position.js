// A-Frame component to log camera position to console
AFRAME.registerComponent('position-logger', {
schema: {
    target: {type: 'selector', default: '#rig'}, // Default to #rig but can be any entity
    interval: {type: 'number', default: 500},    // How often to log (ms)
    precision: {type: 'number', default: 2},     // Decimal places to include
    showOnScreen: {type: 'boolean', default: true}, // Whether to show position on screen
    logToConsole: {type: 'boolean', default: true} // Whether to log to console
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
    if (position.x >= 70) {
        console.log("PASSED x70!"); 
    }
    
}
});