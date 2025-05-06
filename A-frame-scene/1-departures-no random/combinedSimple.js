// ========== TRAIN INFORMATION ==========
// This is our list of train data - each train has a link
const trainData = [
    { link: 'https://baoledesigns.github.io/Art-109/main-website/' },
    { link: 'https://andremation.com/' },
    { link: 'https://zorzini.itch.io/melt-the-summit' },
    { link: 'https://clarencehoang.myportfolio.com/work' },
    { link: 'https://emmamorales.myportfolio.com/' },
    { link: 'https://hxu01.github.io/index.html' },
    { link: 'https://nickzorzi.github.io/' },
    { link: 'https://sejeong021213.wixsite.com/sejeongpark' },
    { link: 'https://rinihimme.com/' },
    { link: 'https://dannydaodma.github.io/Portfolio/' },
    { link: 'https://jessept.carrd.co/#' },
    { link: 'https://sites.google.com/view/devyn-bui/home?authuser=0' },
    { link: 'https://angeliquejoypf21.myportfolio.com/work' },
    { link: 'https://makenaalowe.wixsite.com/makena-lowe-portfoli' },
    { link: 'https://ceruleanmoon.weebly.com/' },
    { link: 'https://fictionalspace.github.io/Portfolio/index.html' },
    { link: 'https://ssgraphicsdesign.com/' },
    { link: 'https://daledeguzman.carrd.co/' },
    { link: 'https://dietrichsteinberg.github.io/' },
    { link: 'https://joeyluv03.github.io/portfolio/index.html' }
  ];
  
  // ========== GAME SETTINGS ==========
  // These variables control how our train board works
  let playerIsBoarded = false;    // Is the player on a train?
  let countdownTimer = 4;        // Seconds counter (resets to 4)
  
  // ========== GET HTML ELEMENTS ==========
  // Get the elements we need to update
  const clockDisplay = document.getElementById('timer'); 
  const boardButton = document.getElementById('boardBtn');
  const trainRows = document.querySelectorAll('.row:not(:first-child)');
  
  // ========== SETUP THE TRAIN BOARD ==========
  // This function sets up our train board when the page loads
  function setupTrainBoard() {
    // We'll use the first 5 trains from our list
    const selectedTrains = trainData.slice(0, 5);
    
    // Loop through each row in our train board
    trainRows.forEach(function(row, index) {
      // Get the train for this row
      const chosenTrain = selectedTrains[index];
      
      // Set the train's link
      const trainLink = row.querySelector('a');
      trainLink.href = chosenTrain.link;
      trainLink.textContent = chosenTrain.link;
      
      // Set departure time (4 minutes minus row index for staggered times)
      const departureTime = 4 - index;
      
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
      // Decrease our countdown by 1 second
      countdownTimer = countdownTimer - 1;
      
      // Update Clock Display
      clockDisplay.textContent = "00:" + String(countdownTimer).padStart(2, '0');
      
      // When we reach zero...
      if (countdownTimer <= 0) {
        // Reset the seconds counter
        countdownTimer = 4;
        
        // Update all the train departure times
        updateTrainTimes();
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
    // Get the next train from the list (using a simple cycling mechanism)
    const firstTrain = trainData.shift();  // Remove the first train
    trainData.push(firstTrain);            // Add it to the end
    const newTrain = trainData[0];         // Use the new first train
    
    // Update the train's link
    const trainLink = row.querySelector('a');
    trainLink.href = newTrain.link;
    trainLink.textContent = newTrain.link;
    
    // Set the departure time (always 4 minutes)
    const timeDisplay = row.querySelector('.depart-time');
    timeDisplay.textContent = "4 min";
    timeDisplay.dataset.timeLeft = 4;
    
    // Add a highlight effect to show it's new
    row.classList.add('new-train');
    
    // Remove the highlight effect after # of seconds
    setTimeout(function() {
      row.classList.remove('new-train');
    }, 3000); // <-- SET TO SAME TIME AS CSS ANIMATION!
  }
  
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