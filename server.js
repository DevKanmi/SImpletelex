require('dotenv').config();
const express = require('express');
const axios = require('axios');
const router = require('./bitcoinBot');

const app = express();
const PORT = process.env.PORT || 8080;


app.use(express.json());

app.use('/', router)

app.get('/', (req, res)=>{
    res.send("Welcome to my Telex Integrations")
})

// Helper function to process settings
const processMessage = (settings, message) => {
    let maxMessageLength = 500;
    let repeatWords = [];
    let noOfRepetitions = 1;

    settings.forEach(setting => {
        if (setting.label === "maxMessageLength" && typeof setting.default === "number") {
            maxMessageLength = setting.default;
        }
        if (setting.label === "repeatWords" && typeof setting.default === "string") {
            repeatWords = setting.default.split(", ");
        }
        if (setting.label === "noOfRepetitions" && typeof setting.default === "number") {
            noOfRepetitions = setting.default;
        }
    });

    // Repeat specified words
    repeatWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, "gi");
        message = message.replace(regex, word.repeat(noOfRepetitions));
    });

    // Apply maxMessageLength constraint
    return message.length > maxMessageLength ? message.substring(0, maxMessageLength) : message;
};

// Route to format message
app.post('/format-message', async (req, res) => {
    try {
        const payload= req.body;
        if (!payload) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        console.log(payload)
        const formattedMessage = processMessage(payload.settings, payload.message);

        const responsePayload = {
            event_name: "message_formatted",
            message: formattedMessage,
            status: "success",
            username: "message-formatter-bot",
        };

        // Send formatted message to Telex
        const telexWebhook = process.env.URL;
        const response= await axios.post(telexWebhook, responsePayload, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          })
        
        console.log(response)
        res.json(response.data);
    } catch (error) {
        console.error("Error formatting message:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
