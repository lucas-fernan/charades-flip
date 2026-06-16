// 1. Your secure proxy link. Replace the middle part with your Vercel URL!
const PROXY_URL = "https://charades-flip.vercel.app/api/gemini";


let wordPool = []; 
let score = 0;
let timeLeft = 60;
let timerInterval;
let isPlaying = false;

// 👉 NEW GAME DESIGN: State Machine ("neutral", "correct", "pass")
let tiltState = "neutral"; 

async function startGame(event) {
    event.stopPropagation(); 
    
    // Request permission for the GRAVITY sensor (DeviceMotion)
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
            const permissionState = await DeviceMotionEvent.requestPermission();
            if (permissionState !== 'granted') {
                alert("Gravity sensor denied. Tap the screen to play.");
            }
        } catch (error) {
            console.error(error);
        }
    }

    document.getElementById("start-btn").style.display = "none";
    document.body.classList.add("playing"); // This activates the landscape CSS rule!

    // Attach the new gravity listener
    window.addEventListener("devicemotion", handleMotion, true);
    
    if (wordPool.length < 5) {
        document.getElementById("word-display").innerText = "Stockpiling AI Words...";
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
    tiltState = "neutral";
    
    document.getElementById("score").innerText = score;
    document.getElementById("time").innerText = timeLeft;
    document.getElementById("hud").style.display = "flex";
    
    pullRandomWord();
    timerInterval = setInterval(countdown, 1000);
}

function handleMotion(event) {
    if (!isPlaying) return;

    // Grab the Z-Axis Gravity
    let z = event.accelerationIncludingGravity?.z;
    if (z === undefined || z === null) return;

    // Gravity Math: 0 is vertical. Negative is face down. Positive is face up.
    const TILT_DOWN = -5; // Forgiving target for Correct
    const TILT_UP = 5;    // Forgiving target for Skip
    const NEUTRAL_MAX = 3; // Huge deadzone to prevent accidental triggers
    const NEUTRAL_MIN = -3;

    if (tiltState === "neutral") {
        // Did they tilt to the floor?
        if (z < TILT_DOWN) {
            tiltState = "correct";
            score++;
            document.getElementById("score").innerText = score;
            document.body.style.backgroundColor = "#15803d"; // Flash Green
        } 
        // Did they tilt to the ceiling?
        else if (z > TILT_UP) {
            tiltState = "pass";
            document.body.style.backgroundColor = "#b91c1c"; // Flash Red
        }
    } 
    // If they already answered, wait for them to return to the forehead
    else if (tiltState === "correct" || tiltState === "pass") {
        if (z > NEUTRAL_MIN && z < NEUTRAL_MAX) {
            tiltState = "neutral";
            document.body.style.backgroundColor = "#0f172a"; // Reset background
            pullRandomWord(); // 👉 THE UX FIX: Load next word ONLY upon returning to forehead!
        }
    }
}

function countdown() {
    timeLeft--;
    document.getElementById("time").innerText = timeLeft;
    if (timeLeft <= 0) endGame();
}

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
    document.body.classList.remove("playing"); // Turn off warning
    clearInterval(timerInterval);
    window.removeEventListener("devicemotion", handleMotion, true);
    
    document.getElementById("word-display").innerText = "Time's Up! Score: " + score;
    document.getElementById("start-btn").innerText = `Play Again (${wordPool.length} cached)`;
    document.getElementById("start-btn").style.display = "inline-block";
    document.getElementById("hud").style.display = "none";
    document.body.style.backgroundColor = "#0f172a";
}
