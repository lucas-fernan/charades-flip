// 1. Your secure proxy link. Replace the middle part with your Vercel URL!
const PROXY_URL = "https://charades-flip.vercel.app/api/gemini";


// Game State Variables
let wordPool = []; 
let score = 0;
let timeLeft = 60;
let timerInterval;
let isPlaying = false;

// 🔄 Tilt Control State Locks
let tiltLocked = false; 
const TILT_CORRECT_THRESHOLD = 60; // Tilt down below 60 degrees
const TILT_PASS_THRESHOLD = 120;   // Tilt up above 120 degrees
const RESET_THRESHOLD_MIN = 75;    // Must return between 75-105 to unlock
const RESET_THRESHOLD_MAX = 105;

async function startGame(event) {
    event.stopPropagation(); 
    document.getElementById("start-btn").style.display = "none";
    
    // Request permission for iPhone/iOS sensors if required
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permissionState = await DeviceOrientationEvent.requestPermission();
            if (permissionState !== 'granted') {
                alert("Permission to use gyroscope was denied. Game will fall back to screen taps.");
            }
        } catch (error) {
            console.error("Sensor initialization error:", error);
        }
    }

    // Activate the digital gyroscope listener
    window.addEventListener("deviceorientation", handleOrientation, true);
    
    if (wordPool.length < 5) {
        document.getElementById("word-display").innerText = "Stockpiling 50 AI Words...";
        try {
            const response = await fetch(PROXY_URL);
            const data = await response.json();
            const newWords = data.words.split(',');
            wordPool = wordPool.concat(newWords); 
        } catch (error) {
            document.getElementById("word-display").innerText = "AI Connection Failed!";
            document.getElementById("start-btn").style.display = "inline-block";
            return;
        }
    }
    
    score = 0;
    timeLeft = 60;
    isPlaying = true;
    tiltLocked = false;
    
    document.getElementById("score").innerText = score;
    document.getElementById("time").innerText = timeLeft;
    document.getElementById("hud").style.display = "flex";
    
    pullRandomWord();
    timerInterval = setInterval(countdown, 1000);
}

// 📱 Gyroscope Processing Loop
function handleOrientation(event) {
    if (!isPlaying) return;

    // Grab the beta angle (front-to-back tilt)
    let beta = event.beta; 
    if (!beta) return;

    // Check for a TILT DOWN (Correct)
    if (beta < TILT_CORRECT_THRESHOLD && !tiltLocked) {
        tiltLocked = true; // Snap lock shut
        score++;
        document.getElementById("score").innerText = score;
        document.body.style.backgroundColor = "#15803d"; // Flash Green briefly
        setTimeout(() => { document.body.style.backgroundColor = ""; }, 400);
        pullRandomWord();
    } 
    
    // Check for a TILT UP (Pass)
    else if (beta > TILT_PASS_THRESHOLD && !tiltLocked) {
        tiltLocked = true; // Snap lock shut
        document.body.style.backgroundColor = "#b91c1c"; // Flash Red briefly
        setTimeout(() => { document.body.style.backgroundColor = ""; }, 400);
        pullRandomWord();
    } 
    
    // UNLOCK MECHANISM: Has the player returned the phone to their forehead upright?
    else if (beta > RESET_THRESHOLD_MIN && beta < RESET_THRESHOLD_MAX && tiltLocked) {
        tiltLocked = false; // Release the lock for the next word
    }
}

function countdown() {
    timeLeft--;
    document.getElementById("time").innerText = timeLeft;
    if (timeLeft <= 0) endGame();
}

// Fallback touch feature in case a desktop browser or older phone plays
function tapScreen() {
    if (!isPlaying) return; 
    score++; 
    document.getElementById("score").innerText = score;
    pullRandomWord();
}

function pullRandomWord() {
    if (wordPool.length === 0) {
        endGame();
        return;
    }
    const randomIndex = Math.floor(Math.random() * wordPool.length);
    const selectedWord = wordPool.splice(randomIndex, 1)[0];
    document.getElementById("word-display").innerText = selectedWord.trim();
}

function endGame() {
    isPlaying = false;
    clearInterval(timerInterval);
    // Turn off the sensor to save phone battery
    window.removeEventListener("deviceorientation", handleOrientation, true);
    
    document.getElementById("word-display").innerText = "Time's Up! Score: " + score;
    document.getElementById("start-btn").innerText = `Play Again (${wordPool.length} cached)`;
    document.getElementById("start-btn").style.display = "inline-block";
    document.getElementById("hud").style.display = "none";
    document.body.style.backgroundColor = "";
}
