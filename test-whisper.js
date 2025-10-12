// Test directo de Whisper AI
const transcriptionService = require('./backend/services/contentAnalysis/transcriptionService');

const audioPath = '/Users/fran/Desktop/CURSOR/Fantasy la liga/temp/auto-processor/zS1K7cJUn-U.mp3';

console.log('🧪 Testing Whisper AI transcription...');
console.log('📁 Audio file:', audioPath);

transcriptionService
    .transcribe(audioPath)
    .then(result => {
        console.log('');
        console.log('✅ Transcription SUCCESS!');
        console.log('Text length:', result.text.length);
        console.log('Duration:', result.duration, 'seconds');
        console.log('Language:', result.language);
        console.log('');
        console.log('First 200 chars:', result.text.substring(0, 200));
        process.exit(0);
    })
    .catch(error => {
        console.log('');
        console.log('❌ Transcription FAILED!');
        console.log('Error:', error.message);
        console.log('Stack:', error.stack);
        process.exit(1);
    });
