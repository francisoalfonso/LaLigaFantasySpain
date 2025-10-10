#!/usr/bin/env node

/**
 * Script rápido para descargar la foto de Pere Milla
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const PERE_MILLA_ID = 47398;
const PERE_MILLA_PHOTO_URL = 'https://media.api-sports.io/football/players/47398.png';
const PHOTOS_DIR = path.join(__dirname, '../data/player-photos');
const OUTPUT_PATH = path.join(PHOTOS_DIR, `${PERE_MILLA_ID}.jpg`);

async function downloadPereMillaPhoto() {
    try {
        console.log('\n📸 Descargando foto de Pere Milla...\n');
        console.log(`   Player ID: ${PERE_MILLA_ID}`);
        console.log(`   URL: ${PERE_MILLA_PHOTO_URL}`);
        console.log(`   Destino: ${OUTPUT_PATH}\n`);

        // Asegurar directorio
        if (!fs.existsSync(PHOTOS_DIR)) {
            fs.mkdirSync(PHOTOS_DIR, { recursive: true });
        }

        // Descargar
        const response = await axios.get(PERE_MILLA_PHOTO_URL, {
            responseType: 'arraybuffer',
            timeout: 10000
        });

        // Guardar
        fs.writeFileSync(OUTPUT_PATH, response.data);

        console.log('✅ Foto descargada correctamente\n');
        console.log(`   Tamaño: ${(response.data.length / 1024).toFixed(2)} KB\n`);

        return OUTPUT_PATH;

    } catch (error) {
        console.error('\n❌ Error descargando foto:', error.message);
        throw error;
    }
}

downloadPereMillaPhoto()
    .then(() => {
        console.log('🎉 Completado\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
