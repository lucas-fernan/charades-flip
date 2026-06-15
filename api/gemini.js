export default async function handler(req, res) {
    // 1. CORS Headers: This tells Vercel it is safe to accept requests from your GitHub Pages website
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // 2. Grab our secret key from Vercel's hidden vault
        const apiKey = process.env.GEMINI_API_KEY;
        
        // 3. The prompt we are sending to the AI
        const prompt = "Give me a comma-separated list of 5 random, fun charades words. Only return the words, nothing else.";

        // 4. Talk to Google Gemini securely
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        
        // 5. Extract the text and send it back to our game
        const textOutput = data.candidates[0].content.parts[0].text;
        res.status(200).json({ words: textOutput });

    } catch (error) {
        console.error("Proxy Error:", error);
        res.status(500).json({ error: "Failed to generate words." });
    }
}
