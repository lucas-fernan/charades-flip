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
        
        if (!apiKey) {
            return res.status(500).json({ error: "Vercel Environment Variable is Missing!" });
        }

        const prompt = "Give me a comma-separated list of 5 random, fun charades words. Only return the words, nothing else.";

        // 👉 THE UPGRADE: We are now using the high-limit "gemini-3.1-flash-lite" model!
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            return res.status(500).json({ error: "Google Gemini Rejected the Key", googleDetails: data.error });
        }

        const textOutput = data.candidates[0].content.parts[0].text;
        res.status(200).json({ words: textOutput });

    } catch (error) {
        res.status(500).json({ error: "System Code Crash", message: error.message });
    }
}
