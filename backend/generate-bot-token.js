const path = require('path');
const dotenvResult = require('dotenv').config({ path: path.resolve(__dirname, '../.env'), debug: process.env.DEBUG }); 

console.log('Attempting to load .env file from:', path.resolve(__dirname, '../.env'));
console.log('dotenv.config() result:', dotenvResult);
console.log('Value of process.env.JWT_SECRET immediately after dotenv.config():', process.env.JWT_SECRET);

const jwt = require('jsonwebtoken');

// Load JWT_SECRET from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('Error: JWT_SECRET is not defined in your .env file (checked after attempting to load from the path above).');
  process.exit(1); // Exit if the secret is not found
}

const payload = {
  id: '682d31962cd808bd1f730cc9', // The bot user's MongoDB _id
  email: 'bot@labnex.ai',
  role: 'bot'
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' }); // or '365d' for long-term

console.log('\n✅ LABNEX_BOT_SERVICE_ACCOUNT_JWT:\n\n' + token + '\n');
console.log('🔑 IMPORTANT: Make sure the JWT_SECRET used here matches the one in your main backend .env file.\n'); 