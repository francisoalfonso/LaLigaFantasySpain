require('dotenv').config();
const axios = require('axios');

const apiKey = process.env.OPENAI_API_KEY;

console.log('Testing OpenAI API Key...');
console.log('Key length:', apiKey ? apiKey.length : 0);
console.log('Key prefix:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');

axios
    .get('https://api.openai.com/v1/models', {
        headers: {
            Authorization: `Bearer ${apiKey}`
        }
    })
    .then(response => {
        console.log('\n✅ API Key is VALID!');
        console.log('Available models:', response.data.data.length);
        console.log(
            'Whisper model available:',
            response.data.data.some(m => m.id === 'whisper-1')
        );
    })
    .catch(error => {
        console.log('\n❌ API Key is INVALID!');
        console.log('Error:', error.response?.data?.error?.message || error.message);
        console.log('Status:', error.response?.status);
    });
