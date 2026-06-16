// 1. Your secure proxy link. Replace the middle part with your Vercel URL!
const PROXY_URL = "https://charades-flip.vercel.app/api/gemini";


let wordPool = []; 
let score = 0;
let timeLeft = 60;
let timerInterval;
let isPlaying = false;
let tiltState = "neutral"; 
let smoothedZ = 0; 
let currentTopic = ""; 

async function startGame(event) {
    event.stopPropagation(); 
    
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
            const permissionState = await DeviceMotionEvent.requestPermission();
            if (permissionState !== 'granted') alert("Gravity sensor denied.");
        } catch (error) { console.error(error); }
    }

    document.getElementById("start-btn").style.display = "none";
    document.getElementById("setup-controls").style.display = "none";
    document.getElementById("end-btn").style.display = "inline-block";
    
    window.addEventListener("devicemotion", handleMotion, true);
    
    const rawTopicInput = document.getElementById("topic-input").value.trim();
    const requestedTopic = rawTopicInput === "" ? "random things" : rawTopicInput;
    
    if (requestedTopic !== currentTopic || wordPool.length < 5) {
        document.getElementById("word-display").innerText = "Generating AI Words...";
        
        try {
            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: requestedTopic })
            });
            
            const data = await response.json();
            wordPool = data.words.split(','); 
            currentTopic = requestedTopic; 
        } catch (error) {
            document.getElementById("word-display").innerText = "AI Connection Failed! Check URL.";
            document.getElementById("start-btn").style.display = "inline-block";
            document.getElementById("setup-controls").style.display = "flex";
            document.getElementById("end-btn").style.display = "none";
            return; 
        }
    }
    
    document.body.classList.add("playing"); 
    
    score = 0;
    tiltState = "neutral";
    smoothedZ = 0; 
    
    // 👉 THE FIX: Turning the game engine ON!
    isPlaying = true; 
    
    const minutesSelected = parseInt(document.getElementById("time-input").value);
    timeLeft = minutesSelected * 60;
    
    document.getElementById("score").innerText = score;
    document.getElementById("time").innerText = timeLeft;
    document.getElementById("hud").style.display = "flex";
    
    pullRandomWord();
    timerInterval = setInterval(countdown, 1000);
}

function handleMotion(event) {
    if (!isPlaying) return;
    let rawZ = event.accelerationIncludingGravity?.z;
    if (rawZ === undefined || rawZ === null) return;

    smoothedZ = (smoothedZ * 0.8) + (rawZ * 0.2);

    const TILT_DOWN = -5; 
    const TILT_UP = 5;    
    const NEUTRAL_MAX = 3; 
    const NEUTRAL_MIN = -3;

    if (tiltState === "neutral") {
        if (smoothedZ < TILT_DOWN) {
            tiltState = "correct";
            score++;
            document.getElementById("score").innerText = score;
            document.body.style.backgroundColor = "#15803d"; 
        } else if (smoothedZ > TILT_UP) {
            tiltState = "pass";
            document.body.style.backgroundColor = "#b91c1c"; 
        }
    } else if (tiltState === "correct" || tiltState === "pass") {
        if (smoothedZ > NEUTRAL_MIN && smoothedZ < NEUTRAL_MAX) {
            tiltState = "neutral";
            document.body.style.backgroundColor = "#0f172a"; 
            pullRandomWord(); 
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

function forceEndGame(event) {
    event.stopPropagation(); 
    endGame();
}

function endGame() {
    isPlaying = false;
    document.body.classList.remove("playing"); 
    clearInterval(timerInterval);
    window.removeEventListener("devicemotion", handleMotion, true);
    
    document.getElementById("word-display").innerText = "Game Over! Score: " + score;
    
    document.getElementById("start-btn").innerText = `Play Again (${wordPool.length} words left)`;
    document.getElementById("start-btn").style.display = "inline-block";
    document.getElementById("setup-controls").style.display = "flex";
    
    document.getElementById("end-btn").style.display = "none";
    document.getElementById("hud").style.display = "none";
    document.body.style.backgroundColor = "#0f172a";
}
