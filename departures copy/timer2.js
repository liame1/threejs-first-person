const departTimes = document.querySelectorAll('.depart-time');
let intervals = [];

let time = 5;


// Start a countdown for each departure
departTimes.forEach((departTime, index) => {
  let countdown = 3; // starting from 60 seconds (or whatever you want)
  
  const interval = setInterval(() => {
    if (countdown <= 0) {
      clearInterval(interval);
      time = 10;
    } else {
      const minutes = Math.floor(countdown / 60);
      const seconds = countdown % 60;
      departTime.textContent = time + "min";
      countdown--;
    }
  }, 1000);

  intervals.push(interval); // Save intervals if you want to pause/resume
});

const pauseBtn = document.getElementById('pauseBtn');
let paused = false;

pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.textContent = paused ? 'Resume' : 'Pause';
  
  intervals.forEach((interval, i) => {
    if (paused) {
      clearInterval(intervals[i]);
    } else {
      // Restart the intervals (you'd need to store the remaining times too!)
      // For simplicity, better structure with an object {countdown, element, intervalId}
    }
  });
});
