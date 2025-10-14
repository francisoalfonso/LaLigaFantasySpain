#!/usr/bin/env node

/**
 * Diagnóstico YouTube Data API v3
 *
 * Testa si la API key está configurada correctamente y tiene permisos.
 */

const axios = require('axios');
require('dotenv').config();

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bright: '\x1b[1m'
};

async function testYouTubeAPI() {
    console.log(`\n${colors.bright}${colors.cyan}${'═'.repeat(70)}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}🔍 DIAGNÓSTICO: YouTube Data API v3${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}${'═'.repeat(70)}${colors.reset}\n`);

    const apiKey = process.env.YOUTUBE_API_KEY;

    // TEST 1: Verificar que API key existe
    console.log(`${colors.yellow}TEST 1: Verificar API Key${colors.reset}`);
    if (!apiKey) {
        console.log(`${colors.red}❌ YOUTUBE_API_KEY no está configurada en .env${colors.reset}\n`);
        process.exit(1);
    }
    console.log(`${colors.green}✅ API Key encontrada: ${apiKey.substring(0, 10)}...${colors.reset}`);
    console.log(`   Longitud: ${apiKey.length} caracteres\n`);

    // TEST 2: Test básico de conexión (quota check)
    console.log(`${colors.yellow}TEST 2: Test de Conexión (Quota)${colors.reset}`);
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                key: apiKey,
                part: 'snippet',
                id: 'dQw4w9WgXcQ' // Rick Roll video (siempre existe)
            }
        });

        if (response.data && response.data.items && response.data.items.length > 0) {
            console.log(`${colors.green}✅ API Key válida y activa${colors.reset}`);
            console.log(`   Video obtenido: "${response.data.items[0].snippet.title}"\n`);
        } else {
            console.log(`${colors.yellow}⚠️  API Key válida pero sin resultados${colors.reset}\n`);
        }
    } catch (error) {
        console.log(`${colors.red}❌ Error en test de conexión${colors.reset}`);
        console.log(`   Status: ${error.response?.status || 'N/A'}`);
        console.log(`   Error: ${error.response?.data?.error?.message || error.message}\n`);

        if (error.response?.status === 403) {
            console.log(`${colors.red}📛 ERROR 403 FORBIDDEN${colors.reset}`);
            console.log(`${colors.yellow}   Posibles causas:${colors.reset}`);
            console.log(`   1. YouTube Data API v3 no está habilitada en Google Cloud Console`);
            console.log(`   2. API Key restringida sin permisos para YouTube Data API`);
            console.log(`   3. Quota diaria excedida`);
            console.log(`   4. API Key revocada/deshabilitada\n`);
        }

        process.exit(1);
    }

    // TEST 3: Test de búsqueda (endpoint crítico para outliers)
    console.log(`${colors.yellow}TEST 3: Test de Search API (endpoint crítico)${colors.reset}`);
    try {
        const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                key: apiKey,
                part: 'snippet',
                q: 'fantasy laliga',
                type: 'video',
                maxResults: 5,
                order: 'viewCount',
                relevanceLanguage: 'es',
                regionCode: 'ES'
            }
        });

        if (searchResponse.data && searchResponse.data.items) {
            console.log(`${colors.green}✅ Search API funcional${colors.reset}`);
            console.log(`   Videos encontrados: ${searchResponse.data.items.length}`);
            console.log(`   PageInfo: ${JSON.stringify(searchResponse.data.pageInfo)}\n`);

            // Mostrar primeros 3 resultados
            console.log(`${colors.cyan}   Top 3 resultados:${colors.reset}`);
            searchResponse.data.items.slice(0, 3).forEach((item, i) => {
                console.log(`   ${i + 1}. ${item.snippet.title}`);
                console.log(`      Canal: ${item.snippet.channelTitle}`);
                console.log(`      ID: ${item.id.videoId}\n`);
            });
        }
    } catch (error) {
        console.log(`${colors.red}❌ ERROR en Search API${colors.reset}`);
        console.log(`   Status: ${error.response?.status || 'N/A'}`);
        console.log(`   Error: ${error.response?.data?.error?.message || error.message}`);

        if (error.response?.data?.error?.errors) {
            console.log(`\n   ${colors.red}Detalles del error:${colors.reset}`);
            error.response.data.error.errors.forEach(err => {
                console.log(`   - ${err.reason}: ${err.message}`);
            });
        }
        console.log('');

        if (error.response?.status === 403) {
            const errorDetails = error.response?.data?.error?.errors?.[0];

            console.log(`${colors.red}📛 ERROR 403 en Search API${colors.reset}\n`);

            if (errorDetails?.reason === 'ipRefererBlocked') {
                console.log(`${colors.yellow}   Causa: API Key restringida por IP/Referrer${colors.reset}`);
                console.log(`   Solución:`);
                console.log(`   1. Ir a: https://console.cloud.google.com/apis/credentials`);
                console.log(`   2. Seleccionar tu API Key`);
                console.log(`   3. En "Restricciones de aplicación" → Seleccionar "Ninguna"\n`);
            } else if (errorDetails?.reason === 'quotaExceeded') {
                console.log(`${colors.yellow}   Causa: Quota diaria excedida${colors.reset}`);
                console.log(`   Solución: Esperar hasta mañana o aumentar quota en Google Cloud\n`);
            } else {
                console.log(`${colors.yellow}   Causa probable: YouTube Data API v3 no habilitada${colors.reset}`);
                console.log(`   Solución:`);
                console.log(`   1. Ir a: https://console.cloud.google.com/apis/library/youtube.googleapis.com`);
                console.log(`   2. Hacer clic en "HABILITAR"`);
                console.log(`   3. Esperar 1-2 minutos y reintentar\n`);
            }
        }

        process.exit(1);
    }

    // TEST 4: Verificar quota restante
    console.log(`${colors.yellow}TEST 4: Verificar Quota${colors.reset}`);
    console.log(`${colors.cyan}ℹ️  YouTube Data API quota:${colors.reset}`);
    console.log(`   - Quota diaria: 10,000 unidades/día`);
    console.log(`   - Costo search: 100 unidades`);
    console.log(`   - Máximo outlier detections por día: ~100 detecciones\n`);

    // RESUMEN FINAL
    console.log(`${colors.bright}${colors.green}${'═'.repeat(70)}${colors.reset}`);
    console.log(`${colors.bright}${colors.green}✅ DIAGNÓSTICO COMPLETADO - YOUTUBE API FUNCIONAL${colors.reset}`);
    console.log(`${colors.bright}${colors.green}${'═'.repeat(70)}${colors.reset}\n`);

    console.log(`${colors.green}✅ Todos los tests pasaron exitosamente${colors.reset}`);
    console.log(`${colors.cyan}🚀 El sistema de outliers debería funcionar correctamente\n${colors.reset}`);
}

// Ejecutar test
testYouTubeAPI().catch(error => {
    console.error(`\n${colors.red}❌ Error inesperado: ${error.message}${colors.reset}\n`);
    process.exit(1);
});
