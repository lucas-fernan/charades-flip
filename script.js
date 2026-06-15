// 1. Your secure proxy link. Replace the middle part with your Vercel URL!
const PROXY_URL = "https://charades-flip.vercel.app/api/gemini";

// 2. The function triggered by our Neon button
async function startGame() {
    const displayElement = document.getElementById("word-display");
    
    // Give the player feedback while the AI thinks
    displayElement.innerText = "Consulting AI...";

    try {
        // 3. Reach out to our secure proxy
        const response = await fetch(PROXY_URL);
        const data = await response.json();
        
        // 4. Gemini gives us a string like "Batman, Surfing, Pizza"
        // We split it at the commas to create a JavaScript Array
        const wordsArray = data.words.split(',');
        
        // 5. Pick a random number based on how many words the AI gave us
        const randomIndex = Math.floor(Math.random() * wordsArray.length);
        
        // 6. Display the chosen word, and trim off any extra spaces
        displayElement.innerText = wordsArray[randomIndex].trim();

    } catch (error) {
        // If the internet drops or the proxy fails, show an error
        displayElement.innerText = "AI Connection Failed!";
        console.error("Game Error:", error);
    }
}
