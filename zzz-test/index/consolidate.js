// Combined JavaScript file for Train Station VR experience

// Guarantees site is reloaded when visited
window.onbeforeunload = () => window.location.reload(true);

// ========== TRAIN INFORMATION ==========
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
let playerIsBoarded = false;
let trainRows;

// ========== UTILITY FUNCTIONS ==========
const Utils = {
  getDimensions: function(el) {
    const dims = { width: 1, height: 0.1, depth: 1 };
    const geometry = el.getAttribute('geometry');
    if (geometry) {
      if (geometry.width) dims.width = geometry.width;
      if (geometry.depth) dims.depth = geometry.depth;
      if (geometry.height) dims.height = geometry.height;
    } else {
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

// ========== POSITION LOGGER COMPONENT ==========
AFRAME.registerComponent('position-logger', {
  schema: {
    target: {type: 'selector', default: '#rig'},
    interval: {type: 'number', default: 500},
    precision: {type: 'number', default: 2},
    logToConsole: {type: 'boolean', default: true},
    xThreshold: {type: 'number', default: 70}
  },

  init: function() {
    this.lastLogTime = 0;
    this.hasBoarded = false;
  },
  
  tick: function(time) {
    if (time - this.lastLogTime < this.data.interval) return;
    this.lastLogTime = time;
    
    const target = this.data.target || this.el;
    if (!target) return;
    
    const position = target.object3D.position;
    
    if (this.data.logToConsole) {
      const x = position.x.toFixed(this.data.precision);
      const y = position.y.toFixed(this.data.precision);
      const z = position.z.toFixed(this.data.precision);
      console.log(`Position: x:${x} y:${y} z:${z}`);
    }
    
    if (position.x >= 30) {
      if (!this.hasBoarded) {
        console.log("PASSED x30! Player is now boarded.");
        playerIsBoarded = true;
        this.hasBoarded = true;
        openEarliestTrainLink();
      }
    } else {
      playerIsBoarded = false;
      this.hasBoarded = false;
    }
    
    if (position.x >= this.data.xThreshold) {
      console.log(`PASSED x${this.data.xThreshold}!`);
    }
  }
});

function openEarliestTrainLink() {
  const trainRows = document.querySelectorAll('.row:not(:first-child)');
  let earliestTrain = null;
  let earliestTime = Infinity;
  
  trainRows.forEach(function(row) {
    const timeDisplay = row.querySelector('.depart-time');
    if (!timeDisplay) return;
    
    const departureTime = parseInt(timeDisplay.dataset.timeLeft);
    
    if (departureTime < earliestTime) {
      earliestTime = departureTime;
      earliestTrain = row;
    }
  });
  
  if (earliestTrain) {
    const linkElement = earliestTrain.querySelector('a');
    if (linkElement) {
      window.location.href = linkElement.href;
    }
  }
}

// ========== PLATFORM CARRIER COMPONENT ==========
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
    
    this.el.object3D.getWorldPosition(this.lastPosition);
    this.currentPosition.copy(this.lastPosition);
    
    this.el.addEventListener('collide', this.checkCollision.bind(this));
  },

  checkCollision: function(event) {
    if (event.detail.body.el.id === 'rig') {
      const playerPos = this.player.object3D.position;
      const platformPos = this.el.object3D.position;
      const dims = Utils.getDimensions(this.el);
      const platformTop = platformPos.y + (dims.height / 2);
      
      if (playerPos.y >= platformTop - 0.5) {
        if (!this.isPlayerRiding) {
          this.isPlayerRiding = true;
          this.yOffset = playerPos.y - platformTop;
        }
      }
    }
  },

  tick: function(time, delta) {
    this.lastPosition.copy(this.currentPosition);
    this.el.object3D.getWorldPosition(this.currentPosition);
    this.platformVelocity.subVectors(this.currentPosition, this.lastPosition);
    
    if (this.isPlayerRiding) {
      const playerPos = this.player.object3D.position;
      const platformPos = this.el.object3D.position;
      const dims = Utils.getDimensions(this.el);
      const halfWidth = dims.width / 2;
      const halfDepth = dims.depth / 2;
      
      if (playerPos.x < platformPos.x - halfWidth || playerPos.x > platformPos.x + halfWidth ||
          playerPos.z < platformPos.z - halfDepth || playerPos.z > platformPos.z + halfDepth ||
          playerPos.y > platformPos.y + dims.height + 3) {
        this.isPlayerRiding = false;
      } else {
        this.player.object3D.position.add(this.platformVelocity);
        const platformTop = platformPos.y + (dims.height / 2);
        this.player.object3D.position.y = platformTop + this.yOffset;
        
        if (this.player.body) {
          this.player.body.position.copy(this.player.object3D.position);
          this.player.body.velocity.set(0, 0, 0);
        }
      }
    }
  }
});

// ========== TRAIN BOARD FUNCTIONS ==========
function setupTrainBoard() {
  trainRows = document.querySelectorAll('.row:not(:first-child)');
  const times = [0, 1, 2, 3, 4];
  
  trainRows.forEach(function(row) {
    const randomNumber = Math.floor(Math.random() * trainData.length);
    const chosenTrain = trainData[randomNumber];
    
    const trainLink = row.querySelector('a');
    if(trainLink) {
      trainLink.href = chosenTrain.link;
      trainLink.textContent = chosenTrain.link;
    }
    
    let departureTime = 0;
    if (times.length > 0) {
      const randomPosition = Math.floor(Math.random() * times.length);
      departureTime = times[randomPosition];
      times.splice(randomPosition, 1);
    }
    
    const timeDisplay = row.querySelector('.depart-time');
    if(timeDisplay) {
      timeDisplay.textContent = departureTime + " min";
      timeDisplay.dataset.timeLeft = departureTime;
    }
  });
}

function updateTrainTimes() {
  trainRows = document.querySelectorAll('.row:not(:first-child)');
  
  trainRows.forEach(function(row) {
    const timeDisplay = row.querySelector('.depart-time');
    if(!timeDisplay) return;
    
    let currentTime = parseInt(timeDisplay.dataset.timeLeft) - 1;
    timeDisplay.dataset.timeLeft = currentTime;
    
    if (currentTime < 0) {
      addNewTrain(row);
    } else {
      timeDisplay.textContent = currentTime + " min";
    }
  });
}

function addNewTrain(row) {
  const randomNumber = Math.floor(Math.random() * trainData.length);
  const newTrain = trainData[randomNumber];
  
  const trainLink = row.querySelector('a');
  if(trainLink) {
    trainLink.href = newTrain.link;
    trainLink.textContent = newTrain.link;
  }
  
  const timeDisplay = row.querySelector('.depart-time');
  if(timeDisplay) {
    timeDisplay.textContent = "4 min";
    timeDisplay.dataset.timeLeft = 4;
  }
  
  row.classList.add('new-train');
  setTimeout(function() {
    row.classList.remove('new-train');
  }, 4000);
}

// ========== DOM-TO-IMAGE TEXTURE MAPPING ==========
function initTextureUpdate() {
  const htmlContainer = document.getElementById('html-container');
  const htmlDisplay = document.getElementById('html-display');
  
  if (htmlContainer && htmlDisplay) {
    function updateTexture() {
      domtoimage.toPng(htmlContainer)
        .then(function(dataUrl) {
          const img = new Image();
          img.onload = function() {
            const texture = new THREE.Texture(img);
            texture.needsUpdate = true;
            
            const mesh = htmlDisplay.getObject3D('mesh');
            if (mesh) {
              mesh.material.map = texture;
              mesh.material.needsUpdate = true;
            }
          };
          img.src = dataUrl;
        })
        .catch(function(error) {
          console.error('Error rendering HTML to image:', error);
        });
    }
    
    updateTexture();
    setInterval(updateTexture, 1000);
  }
}

// ========== UNIFIED ANIMATION MANAGER ==========
const AnimationManager = {
  RESET_INTERVAL: 20000,
  platforms: [],
  trainResetter: null,
  startTime: null,
  
  registerPlatform: function(platform) {
    this.platforms.push(platform);
  },
  
  registerTrain: function(trainResetter) {
    this.trainResetter = trainResetter;
  },
  
  start: function() {
    this.startTime = performance.now();
    this.update();
  },
  
  update: function() {
    const currentTime = performance.now();
    const elapsed = currentTime - this.startTime;
    
    if (elapsed >= this.RESET_INTERVAL) {
      this.resetAll();
      this.startTime = currentTime;
    }
    
    requestAnimationFrame(() => this.update());
  },
  
  resetAll: function() {
    if (this.trainResetter) {
      this.trainResetter.reset();
    }
    
    this.platforms.forEach(platform => {
      platform.reset();
    });
    
    // Update train times when animations reset
    updateTrainTimes();
  }
};

// ========== TRAIN ANIMATION RESETTER ==========
AFRAME.registerComponent('glb-animation-resetter', {
  init: function() {
    this.mixer = null;
    this.actions = [];
    
    this.el.addEventListener('model-loaded', () => {
      const animationMixer = this.el.components['animation-mixer'];
      if (animationMixer && animationMixer.mixer) {
        this.mixer = animationMixer.mixer;
        this.actions = [];
        this.mixer._actions.forEach(action => {
          this.actions.push(action);
        });
        AnimationManager.registerTrain(this);
      }
    });
  },
  
  reset: function() {
    if (!this.mixer || this.actions.length === 0) return;
    
    this.actions.forEach(action => {
      action.reset();
      action.play();
      action.time = 0;
      action.paused = false;
      action.enabled = true;
    });
  }
});

// ========== MULTI-POSITION PLATFORM ==========
AFRAME.registerComponent('multi-position-platform', {
  multiple: true,
  
  schema: {
    fromPosition: { type: 'vec3', default: {x: 0, y: -0.4, z: -14.75} },
    toPosition: { type: 'vec3', default: {x: 92, y: -0.4, z: -14.75} },
    duration: { type: 'number', default: 700 },
    delayBeforeMoving: { type: 'number', default: 0 },
    delayBeforeReset: { type: 'number', default: 0 },
    easing: { type: 'string', default: 'linear' }
  },
  
  init: function() {
    this.animationPhase = 'waiting-start';
    this.phaseStartTime = performance.now();
    this.cycleStartTime = performance.now();
    
    this.startValue = new THREE.Vector3(
      this.data.fromPosition.x,
      this.data.fromPosition.y,
      this.data.fromPosition.z
    );
    
    this.endValue = new THREE.Vector3(
      this.data.toPosition.x,
      this.data.toPosition.y,
      this.data.toPosition.z
    );
    
    this.animationNumber = this.getAnimationNumber();
    AnimationManager.registerPlatform(this);
    
    if (this.animationNumber === 1) {
      this.el.setAttribute('position', this.startValue);
    }
  },
  
  getAnimationNumber: function() {
    const componentName = this.attrName;
    if (componentName === 'multi-position-platform') {
      return 1;
    }
    const match = componentName.match(/__(\d+)$/);
    return match ? parseInt(match[1]) : 1;
  },
  
  getEasedProgress: function(progress) {
    switch (this.data.easing) {
      case 'easeIn': return progress * progress;
      case 'easeOut': return progress * (2 - progress);
      case 'easeInOut': return progress < 0.5 
        ? 2 * progress * progress 
        : -1 + (4 - 2 * progress) * progress;
      default: return progress;
    }
  },
  
  tick: function(time) {
    if (!this.isActive(time)) return;
    
    const phaseElapsed = time - this.phaseStartTime;
    
    switch (this.animationPhase) {
      case 'waiting-start':
        if (phaseElapsed >= this.data.delayBeforeMoving) {
          this.animationPhase = 'moving';
          this.phaseStartTime = time;
          if (this.animationNumber > 1) {
            const currentPos = this.el.getAttribute('position');
            this.startValue.copy(currentPos);
          }
        }
        break;
        
      case 'moving':
        if (phaseElapsed < this.data.duration) {
          const progress = phaseElapsed / this.data.duration;
          const easedProgress = this.getEasedProgress(progress);
          
          const newPos = new THREE.Vector3().lerpVectors(
            this.startValue,
            this.endValue,
            easedProgress
          );
          
          this.el.setAttribute('position', newPos);
        } else {
          this.el.setAttribute('position', this.endValue);
          this.animationPhase = 'waiting-reset';
          this.phaseStartTime = time;
        }
        break;
        
      case 'waiting-reset':
        if (phaseElapsed >= this.data.delayBeforeReset) {
          this.animationPhase = 'ready-for-reset';
        }
        break;
        
      case 'ready-for-reset':
        break;
    }
  },
  
  isActive: function(time) {
    const allAnims = this.getSortedAnimations();
    let elapsedTotal = time - this.cycleStartTime;
    
    for (let anim of allAnims) {
      const animTotalTime = anim.data.delayBeforeMoving + anim.data.duration + anim.data.delayBeforeReset;
      
      if (elapsedTotal <= animTotalTime) {
        return anim === this;
      }
      
      elapsedTotal -= animTotalTime;
    }
    
    return false;
  },
  
  getSortedAnimations: function() {
    const componentNames = Object.keys(this.el.components).filter(name => 
      name.startsWith('multi-position-platform')
    );
    
    const animations = componentNames.map(name => 
      this.el.components[name]
    );
    
    return animations.sort((a, b) => a.animationNumber - b.animationNumber);
  },
  
  reset: function() {
    const allAnims = this.getSortedAnimations();
    const isLastAnim = this === allAnims[allAnims.length - 1];
    
    if (isLastAnim) {
      const currentTime = performance.now();
      allAnims.forEach((anim, index) => {
        anim.animationPhase = 'waiting-start';
        anim.phaseStartTime = currentTime;
        anim.cycleStartTime = currentTime;
        
        if (index === 0) {
          this.el.setAttribute('position', anim.startValue);
        }
      });
    }
  }
});

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
  trainRows = document.querySelectorAll('.row:not(:first-child)');
  
  setupTrainBoard();
  initTextureUpdate();
  AnimationManager.start();
});