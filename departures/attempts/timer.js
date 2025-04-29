let departTime = 7;

let duration = 10; //  # = amount of seconds
let timeLeft = duration;
let timerInterval;
let isPaused = false;
let boarded = true;

const timerDisplay = document.getElementById('timer');
const pauseBtn = document.getElementById('pauseBtn');
const boardBtn = document.getElementById('boardBtn');
// Get all depart-time elements (both id and class)
const departTimeElements = document.querySelectorAll('#depart-time, .depart-time');

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Update all depart-time elements
  departTimeElements.forEach(element => {
    element.textContent = departTime + "min";
  });
}

function startTimer() {
  timerInterval = setInterval(() => {
    if (!isPaused) {
      timeLeft--;
      if (timeLeft < 0) {
        timeLeft = duration; // reset when reaching zero
        console.log("TIMER RESET!");
        departTime = departTime - 1;
        console.log(departTime);
        if (!boarded) {
          window.open('http://slither.io/');
        }
        if (departTime <= 0) {
            departTime = 5; 
        }
      }
      updateTimerDisplay();
    }
  }, 1000);
}

pauseBtn.addEventListener('click', () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
});

boardBtn.addEventListener('click', () => {
  boarded = !boarded;
  boardBtn.textContent = boarded ? 'Board Train' : 'Leave Train';
});

updateTimerDisplay();
startTimer();