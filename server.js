import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors'; // Import the cors package

const app = express();
const port = 3000;

app.use(cors()); // Use the cors middleware

app.get('/proxy', async (req, res) => {
  const apiUrl = 'https://games.roblox.com/v1/games/13822889/servers/Public?sortOrder=Asc&limit=100';

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Proxy server running on http://localhost:${port}`);
});
