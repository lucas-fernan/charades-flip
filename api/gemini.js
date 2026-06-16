export default async function handler(req, res) {
    // 🛡️ SECURITY 1: Replace this with your EXACT GitHub Pages URL!
    const ALLOWED_WEBSITE = 'https://lucas-fernan.github.io';
    
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_WEBSITE);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // 🔒 SECURITY 2: Check the password sent by the game
        const expectedPassword = process.env.GAME_PASSWORD;
        const providedPassword = req.body.password;

        if (expectedPassword && providedPassword !== expectedPassword) {
            return res.status(403).json({ error: "Access Denied: Incorrect Password." });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: "Missing API Key" });

        const userTopic = req.body.topic || "random things";
        const prompt = `Give me a comma-separated list of 50 fun charades words about: ${userTopic}. Only return the words, nothing else.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        if (data.error) return res.status(500).json({ error: "API Error", details: data.error });

        const textOutput = data.candidates[0].content.parts[0].text;
        res.status(200).json({ words: textOutput });

    } catch (error) {
        res.status(500).json({ error: "System Crash" });
    }
}
