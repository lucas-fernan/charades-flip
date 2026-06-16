// 1. Your secure proxy link. Replace the middle part with your Vercel URL!
const PROXY_URL = "https://charades-flip.vercel.app/api/gemini";

// Game State Variables
let wordPool = []; // Local memory cache for 50-word deck
let score = 0;
let timeLeft = 60;
let timerInterval;
let isPlaying = false;

async function startGame(event) {
    event.stopPropagation(); // Stop click from bleeding into a screen tap
    document.getElementById("start-btn").style.display = "none";
    
    // SMART BATCHING: If pool runs low, fetch a fresh batch of 50 words
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
    
    // Reset match variables
    score = 0;
    timeLeft = 60;
    isPlaying = true;
    
    // Initialize UI Elements
    document.getElementById("score").innerText = score;
    document.getElementById("time").innerText = timeLeft;
    document.getElementById("hud").style.display = "flex";
    
    pullRandomWord();
    
    // Run countdown loop every 1 second
    timerInterval = setInterval(countdown, 1000);
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

// Draw card from deck, show it, remove it so it cannot repeat
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
    document.getElementById("word-display").innerText = "Time's Up! Score: " + score;
    
    // Button displays how many words are preserved in your local pool
    document.getElementById("start-btn").innerText = `Play Again (${wordPool.length} cached)`;
    document.getElementById("start-btn").style.display = "inline-block";
    document.getElementById("hud").style.display = "none";
}
