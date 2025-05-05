document.addEventListener('DOMContentLoaded', function() {
    const htmlContainer = document.getElementById('html-container');
    const htmlDisplay = document.getElementById('html-display');
    
    let animationsRunning = true;
    let animationFrameId = null;
    
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
            
            // Continue animation loop if animations are running
            if (animationsRunning) {
              animationFrameId = requestAnimationFrame(updateTexture);
            }
          };
          img.src = dataUrl;
        })
        .catch(function(error) {
          console.error('Error rendering HTML to image:', error);
          if (animationsRunning) {
            animationFrameId = requestAnimationFrame(updateTexture);
          }
        });
    }
    
    // Modified: Wait for both the A-Frame scene and train board setup to complete
    document.querySelector('a-scene').addEventListener('loaded', function() {
      // Ensure train board is set up before starting texture updates
      // Initialize the train board
      setupTrainBoard();
      startClock();
      
      // Give a small delay to ensure the DOM is fully updated
      setTimeout(() => {
        // Initial texture update and start animation loop
        updateTexture();
      }, 100);
    });
});