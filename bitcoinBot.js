const express = require('express');
const axios = require('axios'); 
const router = express.Router();

const EventEmitter = require('events');
const priceEmitter = new EventEmitter();

const telexWebhook = process.env.URL;

// Background task handler
priceEmitter.on('sendPriceUpdate', async (payload, price, telexWebhook) => {
  try {
    let username = "";
    payload.settings.forEach((setting) => {
      if (setting.label === "username") {
        username = setting.default;
      }
    });

    const message = `Hii ${username} Your Daily Bitcoin Tracker at your service, Current Price of bitcoin is: ${price.bitcoin.usd} and it was last updated at ${price.bitcoin.last_updated_at}`;

    const resPayload = {
      event_name: 'bitcoin_price_update',
      message: message,
      status: 'success',
      username: 'bitcoin-bot',
    };

    await axios.post(telexWebhook, resPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('Webhook sent successfully');
  } catch (error) {
    console.error('Error sending webhook:', error);
  }
});

const prices = async () => {
  const url = `https://api.coingecko.com/api/v3/simple/price?x_cg_demo_api_key=${process.env.API_KEY}&ids=bitcoin&vs_currencies=usd&include_last_updated_at=true`;
  const response = await axios.get(url);
  return response.data;
};

// Modified route handler
router.post('/price', async (req, res) => {
  try {
    const payload = req.body;
    const price = await prices();
    console.log(payload);
    console.log(price);

    // Emit event for background processing
    setImmediate(() => {
      priceEmitter.emit('sendPriceUpdate', payload, price, telexWebhook);
    });

    // Send immediate response
    return res.status(200).json({
      success: true,
      bitcoin_data: price.bitcoin,
      message: 'Price update is being processed'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to get Prices'
    });
  }
});

module.exports = router;