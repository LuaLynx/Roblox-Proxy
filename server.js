import fetch from 'node-fetch';
import cors from 'cors'; // Import the cors package
import express from 'express'; // Don't forget to import express
const app = express();
const port = 3000;

app.use(cors()); // Use the cors middleware

// Queue to store incoming requests and usernames
const requestQueue = [];
let isProcessing = false;

// Helper function to introduce a delay (e.g., for retry logic)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to process the queue at a fixed rate
const processQueue = async () => {
  if (requestQueue.length === 0 || isProcessing) return;

  isProcessing = true;
  const { req, res, username } = requestQueue.shift(); // Get the first request in the queue
  const apiUrl = 'https://games.roblox.com/v1/games/13822889/servers/Public?sortOrder=Asc&limit=100';

  console.log(`Processing request for ${username}, queue size: ${requestQueue.length}`); // Print queue size and username

  let success = false; // Track if the request was successful
  while (!success) {
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        if (response.status === 429) {
          // If we hit a rate limit (HTTP 429), log queue size and wait before retrying
          console.log("Rate limit hit! Waiting to retry...");
          console.log(`Queue size: ${requestQueue.length}, Users: ${requestQueue.map(item => item.username)}`); // Print queue size and list of usernames
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
  // Capture username from query parameters
  const username = req.query.username || "Anonymous"; // Default to "Anonymous" if no username is provided

  // Add request and associated username to the queue
  requestQueue.push({ req, res, username });
  console.log(`New request added by ${username}, queue size: ${requestQueue.length}, Users: ${requestQueue.map(item => item.username)}`); // Print queue size and usernames when a new request is added
});

app.listen(port, () => {
  console.log(`Proxy server running on http://localhost:${port}`);
});
