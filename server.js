const express = require('express');
const fetch = require('node-fetch');
const PQueue = require('p-queue');
const app = express();

// Use the PORT environment variable provided by Render
const PORT = process.env.PORT || 3000;

// Create a queue with a concurrency of 1 and an interval of 2 seconds
const queue = new PQueue({
  concurrency: 1, // Only one request at a time
  interval: 2000, // 2-second interval between requests
  intervalCap: 1  // Ensure only 1 request is allowed per interval
});

// Middleware to parse JSON bodies
app.use(express.json());

// Example route to fetch data from the Roblox API using the queue system
app.get('/fetch-data', async (req, res) => {
  try {
    // Add the request to the queue
    await queue.add(async () => {
      console.log('Fetching data from Roblox API...');

      const response = await fetch('https://games.roblox.com/v1/games/13822889/servers/Public?sortOrder=Asc&limit=100');

      // Check if rate limited or any other error occurred
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 5; // Retry after header or default to 5 seconds
        console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        throw new Error('Rate limited. Try again later.');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Example route to receive data from a third-party app
app.post('/api/send-data', (req, res) => {
  const { name, score } = req.body;

  if (!name || !score) {
    return res.status(400).json({ error: 'Name and score are required' });
  }

  console.log(`Received data: Name - ${name}, Score - ${score}`);
  res.json({ message: 'Data received successfully', name, score });
});

// Example home route
app.get('/', (req, res) => {
  res.send('Hello World! Your app is running on Render.');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
