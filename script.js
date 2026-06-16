// 1. Your secure proxy link. Replace the middle part with your Vercel URL!
const PROXY_URL = "https://charades-flip.vercel.app/api/gemini";


let wordPool = []; 
let score = 0;
let timeLeft = 60;
let timerInterval;
let isPlaying = false;

// Tilt State Locks
let tiltLocked = false; 

async function startGame(event) {
    event.stopPropagation(); 
    
    // 👉 SAFARI FIX: We must ask for permission instantly on the very first line of the click!
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
            const permissionState = await DeviceOrientationEvent.requestPermission();
            if (permissionState !== 'granted') {
                alert("Gyroscope denied. You must tap the screen to play.");
            }
        } catch (error) {
            console.error(error);
        }
    }

    document.getElementById("start-btn").style.display = "none";
    document.body.classList.add("playing"); // This activates our landscape warning CSS!

    window.addEventListener("deviceorientation", handleOrientation, true);
    
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
    tiltLocked = false;
    
    document.getElementById("score").innerText = score;
    document.getElementById("time").innerText = timeLeft;
    document.getElementById("hud").style.display = "flex";
    
    pullRandomWord();
    timerInterval = setInterval(countdown, 1000);
}

function handleOrientation(event) {
    if (!isPlaying) return;

    // 👉 LANDSCAPE MATH FIX: Calculate front-to-back tilt based on how the phone is rotated
    let tilt;
    let orientation = window.orientation || screen.orientation?.angle || 0;
    
    if (orientation === 90) tilt = event.gamma;        // Sideways Right
    else if (orientation === -90) tilt = -event.gamma; // Sideways Left
    else tilt = event.beta;                            // Portrait
    
    // Safety check: if no sensor data, exit
    if (!tilt) return;

    // 👉 TILT UP = CORRECT (+1 Point)
    if (tilt > 120 && !tiltLocked) {
        tiltLocked = true;
        score++;
        document.getElementById("score").innerText = score;
        document.body.style.backgroundColor = "#15803d"; // Flash Green
        
        // HAPTICS: One clean buzz for correct
        if (navigator.vibrate) navigator.vibrate(200); 
        
        setTimeout(() => { document.body.style.backgroundColor = ""; }, 400);
        pullRandomWord();
    } 
    
    // 👉 TILT DOWN = SKIP (No Points)
    else if (tilt < 60 && !tiltLocked) {
        tiltLocked = true;
        document.body.style.backgroundColor = "#b91c1c"; // Flash Red
        
        // HAPTICS: Double-buzz for skip
        if (navigator.vibrate) navigator.vibrate([100, 100, 100]); 
        
        setTimeout(() => { document.body.style.backgroundColor = ""; }, 400);
        pullRandomWord();
    } 
    
    // UNLOCK: Return to forehead (~90 degrees) to unlock the next word
    else if (tilt > 75 && tilt < 105 && tiltLocked) {
        tiltLocked = false; 
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
    document.body.classList.remove("playing"); // Remove landscape warning
    clearInterval(timerInterval);
    window.removeEventListener("deviceorientation", handleOrientation, true);
    
    document.getElementById("word-display").innerText = "Time's Up! Score: " + score;
    document.getElementById("start-btn").innerText = `Play Again (${wordPool.length} cached)`;
    document.getElementById("start-btn").style.display = "inline-block";
    document.getElementById("hud").style.display = "none";
    document.body.style.backgroundColor = "";
}
