#!/usr/bin/env node

/**
 * Script de Emergencia: Hacer Biblioteca Bunny.net Pública
 *
 * PROBLEMA RECURRENTE: Videos dan HTTP 403 porque biblioteca no es pública
 *
 * USAR CUANDO: curl -I "https://vz-139dde2a-4e6.b-cdn.net/{videoId}/play_720p.mp4" da 403
 *
 * Uso:
 *   node scripts/bunny-make-library-public.js
 */

require('dotenv').config();
const axios = require('axios');

const BUNNY_API_KEY = process.env.BUNNY_STREAM_API_KEY;
const LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;

async function makeLibraryPublic() {
    console.log('\n🐰 BUNNY.NET - CONFIGURAR BIBLIOTECA PÚBLICA\n');

    if (!BUNNY_API_KEY || !LIBRARY_ID) {
        console.error('❌ Faltan variables de entorno:');
        console.error('   BUNNY_STREAM_API_KEY:', BUNNY_API_KEY ? '✅' : '❌');
        console.error('   BUNNY_STREAM_LIBRARY_ID:', LIBRARY_ID ? '✅' : '❌');
        process.exit(1);
    }

    try {
        // 1. Obtener configuración actual
        console.log('📚 Obteniendo configuración actual...');
        const getResponse = await axios.get(
            `https://video.bunnycdn.com/library/${LIBRARY_ID}`,
            { headers: { 'AccessKey': BUNNY_API_KEY } }
        );

        const library = getResponse.data;
        console.log('   Name:', library.Name);
        console.log('   AllowDirectPlay:', library.AllowDirectPlay);
        console.log('   EnableTokenAuthentication:', library.EnableTokenAuthentication);
        console.log('');

        if (library.AllowDirectPlay) {
            console.log('✅ Biblioteca YA es pública - no se requiere acción\n');
            return;
        }

        // 2. Configurar como pública (USAR POST según docs Bunny.net)
        console.log('🔧 Configurando biblioteca como pública...');
        await axios.post(
            `https://video.bunnycdn.com/library/${LIBRARY_ID}`,
            {
                AllowDirectPlay: true,
                EnableTokenAuthentication: false,
                BlockNoneReferrer: false
            },
            {
                headers: {
                    'AccessKey': BUNNY_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Biblioteca configurada exitosamente\n');

        // 3. Verificar cambios
        console.log('🔍 Verificando configuración...');
        const verifyResponse = await axios.get(
            `https://video.bunnycdn.com/library/${LIBRARY_ID}`,
            { headers: { 'AccessKey': BUNNY_API_KEY } }
        );

        console.log('   AllowDirectPlay:', verifyResponse.data.AllowDirectPlay);
        console.log('   EnableTokenAuthentication:', verifyResponse.data.EnableTokenAuthentication);
        console.log('');

        if (verifyResponse.data.AllowDirectPlay) {
            console.log('✅ ÉXITO - Biblioteca ahora es pública');
            console.log('   Todos los videos nuevos serán accesibles públicamente\n');
        } else {
            console.log('⚠️  Verificación falló - revisar manualmente en panel Bunny.net\n');
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        if (error.response?.data) {
            console.error('   Detalles Bunny.net:', error.response.data);
        }
        console.error('');
        process.exit(1);
    }
}

if (require.main === module) {
    makeLibraryPublic();
}

module.exports = { makeLibraryPublic };
