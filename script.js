// 1. Our filing cabinet of test words
const testWords = [
    "Dancing",
    "Batman",
    "Surfing",
    "Eating Spaghetti",
    "A Zombie"
];

// 2. The function that runs when the button is pressed
function startGame() {
    // Pick a random number between 0 and the length of our array
    const randomIndex = Math.floor(Math.random() * testWords.length);
    
    // Select the word from the array using that random number
    const selectedWord = testWords[randomIndex];
    
    // Find the HTML element with the name tag "word-display" and change its text
    document.getElementById("word-display").innerText = selectedWord;
}
