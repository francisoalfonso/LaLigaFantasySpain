#!/usr/bin/env node

/**
 * Quick download de foto de Dani Carvajal para test
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function main() {
    const CARVAJAL_PHOTO_URL = 'https://media.api-sports.io/football/players/1659.png';
    const PHOTOS_DIR = path.join(__dirname, '../data/player-photos');
    const photoPath = path.join(PHOTOS_DIR, '1659.jpg');

    console.log('📸 Descargando foto de Dani Carvajal...');

    try {
        const response = await axios.get(CARVAJAL_PHOTO_URL, {
            responseType: 'arraybuffer',
            timeout: 10000
        });

        fs.writeFileSync(photoPath, response.data);
        console.log(`✅ Foto descargada: ${photoPath}`);

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}

main();
