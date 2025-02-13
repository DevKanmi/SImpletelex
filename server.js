const express = require('express');
const axios = require('axios');
const app = express();
require('dotenv').config()

// Middleware for JSON parsing
app.use(express.json());

// Telex configuration
const TELEX_WEBHOOK_URL = process.env.URL
const PORT = process.env.PORT || 8080;

// Handle incoming messages from Telex
app.post('/format-message', async (req, res) => {
  try {
    const { message_content, settings } = req.body;
    
    // Validate request format
    if (!message_content || !settings) {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    // Format the message
    const formattedMessage = `Hello, ${message_content.username}! You said: ${message_content.message}`;
    
    // Send response to Telex
    await sendToTelexWebhook({
      event_name: 'message_formatted',
      message: formattedMessage,
      status: 'success',
      username: 'formatter-bot',
      channel_id: settings.channel_id
    });

    // Send acknowledgement
    res.json({
      event_name: 'processing_complete',
      status: 'success',
      message: 'Message formatted successfully'
    });

  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to process message'
    });
  }
});

// Helper function to send messages back to Telex
async function sendToTelexWebhook(payload) {
  try {
    const response = await axios.post(TELEX_WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    console.log('Message sent to Telex:', response.data);
  } catch (error) {
    console.error('Telex API Error:', error.response?.data || error.message);
  }
}

const prices= async() =>{
  const url = `https://api.coingecko.com/api/v3/simple/price?x_cg_demo_api_key=${process.env.API_KEY}&ids=bitcoin&vs_currencies=usd&include_last_updated_at=true`
  const response= await axios.get(url)
  return response.data
  
}


app.get('/price', async(req, res) =>{
  try{
  const {message_content, settings} = req.body
  const price = await prices()
  console.log(price)

const message = `Hii ${message_content.username} Your Daily Bitcoin Tracker at your service, Current Price of bitcoin is: ${price.bitcoin.usd} and it was last updated at ${price.bitcoin.last_updated_at}`
  await sendToTelexWebhook({
    event_name: 'bitcoin_price_update',
    message: message,
    status: 'success',
    username: 'bitcoin-bot',
    channel_id: settings.channel_id
  })

  return res.status(200).json({
    bitcoin_data: price.bitcoin
  })
}
  catch(error){
    return res.status(500).json({
      success: false,
      error: `Failed to get Prices`
    })
  }
})


// Start server
app.listen(PORT, () => {
  console.log(`Message formatter running on port ${PORT}`);
});