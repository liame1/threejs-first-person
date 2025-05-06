// ========== TRAIN INFORMATION ==========
// This is our list of train data - each train has an image, a link, and a time
const trainData = [
  { icon: 'icons/1.png', link: 'https://baoledesigns.github.io/Art-109/main-website/' },
  { icon: 'icons/2.png', link: 'https://andremation.com/' },
  { icon: 'icons/3.png', link: 'https://zorzini.itch.io/melt-the-summit' },
  { icon: 'icons/4.png', link: 'https://clarencehoang.myportfolio.com/work' },
  { icon: 'icons/5.png', link: 'https://emmamorales.myportfolio.com/' },
  { icon: 'icons/6.png', link: 'https://hxu01.github.io/index.html' },
  { icon: 'icons/7.png', link: 'https://nickzorzi.github.io/' },
  { icon: 'icons/A.png', link: 'https://sejeong021213.wixsite.com/sejeongpark' },
  { icon: 'icons/B.png', link: 'https://rinihimme.com/' },
  { icon: 'icons/C.png', link: 'https://dannydaodma.github.io/Portfolio/' },
  { icon: 'icons/D.png', link: 'https://jessept.carrd.co/#' },
  { icon: 'icons/E.png', link: 'https://sites.google.com/view/devyn-bui/home?authuser=0' },
  { icon: 'icons/F.png', link: 'https://angeliquejoypf21.myportfolio.com/work' },
  { icon: 'icons/G.png', link: 'https://makenaalowe.wixsite.com/makena-lowe-portfoli' },
  { icon: 'icons/J.png', link: 'https://ceruleanmoon.weebly.com/' },
  { icon: 'icons/L.png', link: 'https://fictionalspace.github.io/Portfolio/index.html' },
  { icon: 'icons/M.png', link: 'https://ssgraphicsdesign.com/' },
  { icon: 'icons/N.png', link: 'https://daledeguzman.carrd.co/' },
  { icon: 'icons/Q.png', link: 'https://dietrichsteinberg.github.io/' },
  { icon: 'icons/R.png', link: 'https://joeyluv03.github.io/portfolio/index.html' }
];

// ========== GAME SETTINGS ==========
// These variables control how our train board works
let timerIsRunning = true;     // Is the clock running?
let playerIsBoarded = false;    // Is the player on a train?
let countdownTimer = 4;        // Seconds counter (resets to 4)

// ========== GET HTML ELEMENTS ==========
// Get the elements we need to update :

const clockDisplay = document.getElementById('timer'); 
const pauseButton = document.getElementById('pauseBtn');
const boardButton = document.getElementById('boardBtn');
const trainRows = document.querySelectorAll('.row:not(:first-child)');

// ========== SETUP THE TRAIN BOARD ==========
// This function sets up our train board when the page loads
function setupTrainBoard() {
  // Create a list of times 0-4 that we'll use for departure times
  const times = [0, 1, 2, 3, 4];
  
  // Loop through each row in our train board
  trainRows.forEach(function(row) {
    // 1. Pick a random train from our list
    const randomNumber = Math.floor(Math.random() * trainData.length);
    const chosenTrain = trainData[randomNumber];
    
    // 2. Set the train's image
    const trainImage = row.querySelector('img');
    trainImage.src = chosenTrain.icon;
    
    // 3. Set the train's link
    const trainLink = row.querySelector('a');
    trainLink.href = chosenTrain.link;
    trainLink.textContent = chosenTrain.link;
    
    // 4. Set a unique departure time
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
    timeDisplay.textContent = departureTime + " min";
    timeDisplay.dataset.timeLeft = departureTime;
  });
}

// ========== RUN THE CLOCK ==========
// This function runs our countdown timer
function startClock() {
  // This runs every second (1000 milliseconds)
  let timer = setInterval(function() {
    // Only count down if the game isn't paused
    if (timerIsRunning) {
      // Decrease our countdown by 1 second
      countdownTimer = countdownTimer - 1;
      
      // Update Clock Display :
      clockDisplay.textContent = "00:" + String(countdownTimer).padStart(2, '0');
      
      // When we reach zero...
      if (countdownTimer <= 0) {
        // Reset the seconds counter
        countdownTimer = 4;
        
        // Update all the train departure times
        updateTrainTimes();
      }
    }
  }, 1000);
}

// ========== UPDATE TRAIN TIMES ==========
// This function updates the departure time for all trains
function updateTrainTimes() {
  // Go through each train row
  trainRows.forEach(function(row) {
    // Get the time display element
    const timeDisplay = row.querySelector('.depart-time');
    
    // Get current time and subtract 1 minute
    let currentTime = parseInt(timeDisplay.dataset.timeLeft) - 1;
    
    // Save the new time
    timeDisplay.dataset.timeLeft = currentTime;
    
    // If the train is departing (time reached zero or less)
    if (currentTime < 0) {
      // If player is on a train, open the link
      if (playerIsBoarded) {
        const linkToOpen = row.querySelector('a').href;
        window.open(linkToOpen);
      }
      
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
  
  // 2. Update the train's image
  const trainImage = row.querySelector('img');
  trainImage.src = newTrain.icon;
  
  // 3. Update the train's link
  const trainLink = row.querySelector('a');
  trainLink.href = newTrain.link;
  trainLink.textContent = newTrain.link;
  
  // 4. Set the departure time (always 4 minutes)
  const timeDisplay = row.querySelector('.depart-time');
  timeDisplay.textContent = "4 min";
  timeDisplay.dataset.timeLeft = 4;
  
  // 5. Add a highlight effect to show it's new
  row.classList.add('new-train');
  
  // Remove the highlight effect after # of seconds
  setTimeout(function() {
    row.classList.remove('new-train');
  }, 3000); // <-- SET TO SAME TIME AS CSS ANIMATION!
}

// ========== BUTTON CONTROLS ==========
// When the pause button is clicked
pauseButton.addEventListener('click', function() {
  // Toggle between paused and running
  timerIsRunning = !timerIsRunning;
  
  // Update the button text
  if (timerIsRunning) {
    pauseButton.textContent = 'Pause';
  } else {
    pauseButton.textContent = 'Resume';
  }
});

// When the board button is clicked
boardButton.addEventListener('click', function() {
  // Toggle between boarded and not boarded
  playerIsBoarded = !playerIsBoarded;
  
  // Update the button text
  if (!playerIsBoarded) {
    boardButton.textContent = 'Board Train';
  } else {
    boardButton.textContent = 'Leave Train';
  }
});

// ========== START THE TRAIN BOARD ==========
// Set up the board and start the clock
setupTrainBoard();
startClock();