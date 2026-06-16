export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        
        // DIAGNOSTIC 1: Check if the key even exists in Vercel's memory
        if (!apiKey) {
            return res.status(500).json({ 
                error: "Vercel Environment Variable is Missing!", 
                solution: "Make sure your variable name is exactly GEMINI_API_KEY in uppercase." 
            });
        }

        const prompt = "Give me a comma-separated list of 5 random, fun charades words. Only return the words, nothing else.";

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        
        // DIAGNOSTIC 2: If Google rejected our request, show the exact message Google sent
        if (data.error) {
            return res.status(500).json({ 
                error: "Google Gemini Rejected the Key", 
                googleDetails: data.error 
            });
        }

        // Safe check to ensure response format is correct
        if (!data.candidates || !data.candidates[0]) {
            return res.status(500).json({ error: "Unexpected response structure from Gemini", rawData: data });
        }

        const textOutput = data.candidates[0].content.parts[0].text;
        res.status(200).json({ words: textOutput });

    } catch (error) {
        // DIAGNOSTIC 3: If a code crash happens, print the exact system crash message
        res.status(500).json({ error: "System Code Crash", message: error.message });
    }
}
