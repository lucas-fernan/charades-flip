// 1. Your secure proxy link. Replace the middle part with your Vercel URL!
const PROXY_URL = "https://charades-flip.vercel.app/api/gemini";

// Game State Variables
let wordPool = []; // Our massive deck of words
let score = 0;
let timeLeft = 60;
let timerInterval;
let isPlaying = false;

async function startGame(event) {
    event.stopPropagation(); 
    document.getElementById("start-btn").style.display = "none";
    
    // SMART LOGIC: If our deck is empty (or has less than 3 words), go fetch 50 more!
    if (wordPool.length < 3) {
        document.getElementById("word-display").innerText = "Stockpiling 50 AI Words...";
        try {
            const response = await fetch(PROXY_URL);
            const data = await response.json();
            
            // Split the 50 words and add them to our pool
            const newWords = data.words.split(',');
            wordPool = wordPool.concat(newWords); 
        } catch (error) {
            document.getElementById("word-display").innerText = "AI Connection Failed!";
            document.getElementById("start-btn").style.display = "inline-block";
            return; // Stop the game if the internet fails
        }
    }
    
    // Reset the match stats
    score = 0;
    timeLeft = 60;
    isPlaying = true;
    
    // Show the HUD
    document.getElementById("score").innerText = score;
    document.getElementById("time").innerText = timeLeft;
    document.getElementById("hud").style.display = "flex";
    
    // Pull the first word from the deck
    pullRandomWord();
    
    // Start the 60-second metronome
    timerInterval = setInterval(countdown, 1000);
}

function countdown() {
    timeLeft--;
    document.getElementById("time").innerText = timeLeft;
    if (timeLeft <= 0) endGame();
}

function tapScreen() {
    if (!isPlaying) return; 
    
    // Increase score
    score++; 
    document.getElementById("score").innerText = score;
    
    // Pull the next word
    pullRandomWord();
}

// 🃏 THE SPLICE TRICK: Pick a random word, show it, and delete it from the pool!
function pullRandomWord() {
    if (wordPool.length === 0) {
        endGame(); // Safety net in case someone is too fast!
        return;
    }
    
    // Pick a random number based on how many words are left in the pool
    const randomIndex = Math.floor(Math.random() * wordPool.length);
    
    // .splice() removes the item from the array and returns it to us
    const selectedWord = wordPool.splice(randomIndex, 1)[0];
    
    document.getElementById("word-display").innerText = selectedWord.trim();
}

function endGame() {
    isPlaying = false;
    clearInterval(timerInterval);
    document.getElementById("word-display").innerText = "Time's Up! Score: " + score;
    
    // Change the button text so the player knows they can go again instantly
    document.getElementById("start-btn").innerText = `Play Again (${wordPool.length} words left in pool)`;
    document.getElementById("start-btn").style.display = "inline-block";
    document.getElementById("hud").style.display = "none";
}
