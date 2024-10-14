import fetch from 'node-fetch';
import cors from 'cors'; // Import the cors package
import express from 'express'; // Don't forget to import express
const app = express();
const port = 3000;

app.use(cors()); // Use the cors middleware

// Queue to store incoming requests
const requestQueue = [];
let isProcessing = false;

// Helper function to introduce a delay (e.g., for retry logic)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to process the queue at a fixed rate
const processQueue = async () => {
  if (requestQueue.length === 0 || isProcessing) return;

  isProcessing = true;
  const { req, res } = requestQueue.shift(); // Get the first request in the queue
  const apiUrl = 'https://games.roblox.com/v1/games/13822889/servers/Public?sortOrder=Asc&limit=100';

  let success = false; // Track if the request was successful
  while (!success) {
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        if (response.status === 429) {
          // If we hit a rate limit (HTTP 429), wait before retrying
          console.log("Rate limit hit, waiting to retry...");
          await delay(5000); // Wait 5 seconds
          continue; // Retry the request
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
      success = true; // Mark as success if we get data
    } catch (error) {
      console.error("Error fetching data:", error.message);
      if (error.message.includes('timeout')) {
        // Wait for a few seconds before retrying in case of timeout
        console.log("Timeout occurred, waiting to retry...");
        await delay(5000); // Wait 5 seconds
      } else {
        // If it's a different error, return error response and stop retrying
        res.status(500).json({ error: error.message });
        success = true; // Mark as success to stop the loop (even though it's failed)
      }
    }
  }

  isProcessing = false;
};

// Schedule queue processing every X milliseconds (e.g., 1000ms = 1 second)
setInterval(processQueue, 1000);

app.get('/proxy', (req, res) => {
  // Add request to the queue
  requestQueue.push({ req, res });
});

app.listen(port, () => {
  console.log(`Proxy server running on http://localhost:${port}`);
});
