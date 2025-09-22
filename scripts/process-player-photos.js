#!/usr/bin/env node
// =================================================
// SCRIPT AUTOMÁTICO PROCESAMIENTO FOTOS JUGADORES
// =================================================
// Procesa fotos de jugadores La Liga con naming optimizado y descarga automática

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');
const http = require('http');

// Configuración de tamaños para jugadores
const PLAYER_PHOTO_SIZES = {
  'sm': 64,   // Lista, tabla
  'md': 128,  // Cards
  'lg': 256,  // Perfiles, destacados
  'xl': 512   // Fotos principales
};

class PlayerPhotoProcessor {
  constructor(inputDir, outputDir) {
    this.inputDir = inputDir;
    this.outputDir = outputDir;
    this.processedPlayers = [];
    this.errors = [];
    this.stats = {
      downloaded: 0,
      processed: 0,
      errors: 0
    };
  }

  // Verificar si cwebp está disponible
  checkWebPSupport() {
    try {
      execSync('cwebp -version', { stdio: 'ignore' });
      return true;
    } catch (error) {
      console.log('⚠️ WebP no disponible. Instalando...');
      try {
        execSync('brew install webp', { stdio: 'inherit' });
        return true;
      } catch (installError) {
        console.error('❌ No se pudo instalar WebP. Instálalo manualmente: brew install webp');
        return false;
      }
    }
  }

  // Descargar imagen de URL
  async downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;

      const request = protocol.get(url, (response) => {
        if (response.statusCode === 200) {
          const fileStream = fs.createWriteStream(filepath);
          response.pipe(fileStream);

          fileStream.on('finish', () => {
            fileStream.close();
            resolve(filepath);
          });

          fileStream.on('error', reject);
        } else {
          reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        }
      });

      request.on('error', reject);
      request.setTimeout(10000, () => {
        request.abort();
        reject(new Error('Download timeout'));
      });
    });
  }

  // Procesar foto de un jugador
  async processPlayerPhoto(inputFile, playerId, playerName = null) {
    const inputPath = path.join(this.inputDir, inputFile);
    const results = [];

    // Crear slug del nombre del jugador si está disponible
    const nameSlug = playerName
      ? playerName.toLowerCase()
          .replace(/[áàäâ]/g, 'a')
          .replace(/[éèëê]/g, 'e')
          .replace(/[íìïî]/g, 'i')
          .replace(/[óòöô]/g, 'o')
          .replace(/[úùüû]/g, 'u')
          .replace(/[ñ]/g, 'n')
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
      : `player-${playerId}`;

    console.log(`🔄 Procesando: ${inputFile} → Player ID: ${playerId} (${nameSlug})`);

    // Crear foto principal (512px)
    const mainOutput = path.join(this.outputDir, `${playerId}-${nameSlug}-photo.webp`);
    try {
      execSync(`cwebp -q 85 -resize 512 512 "${inputPath}" -o "${mainOutput}"`, { stdio: 'ignore' });
      results.push({ size: 'main', file: mainOutput, status: 'success' });
      console.log(`  ✅ Principal: ${playerId}-${nameSlug}-photo.webp`);
    } catch (error) {
      results.push({ size: 'main', file: mainOutput, status: 'error', error: error.message });
      console.log(`  ❌ Error en principal: ${error.message}`);
    }

    // Crear diferentes tamaños
    for (const [sizeName, pixels] of Object.entries(PLAYER_PHOTO_SIZES)) {
      if (sizeName === 'xl') continue; // xl es el principal

      const sizeOutput = path.join(this.outputDir, `${playerId}-${nameSlug}-photo-${sizeName}.webp`);
      try {
        execSync(`cwebp -q 85 -resize ${pixels} ${pixels} "${inputPath}" -o "${sizeOutput}"`, { stdio: 'ignore' });
        results.push({ size: sizeName, file: sizeOutput, status: 'success' });
        console.log(`  ✅ ${sizeName} (${pixels}px): ${playerId}-${nameSlug}-photo-${sizeName}.webp`);
      } catch (error) {
        results.push({ size: sizeName, file: sizeOutput, status: 'error', error: error.message });
        console.log(`  ❌ Error en ${sizeName}: ${error.message}`);
      }
    }

    return results;
  }

  // Procesar fotos desde directorio local
  async processLocalPhotos() {
    console.log('🚀 Procesando fotos locales de jugadores...');

    if (!fs.existsSync(this.inputDir)) {
      throw new Error(`Directorio no encontrado: ${this.inputDir}`);
    }

    const photoFiles = fs.readdirSync(this.inputDir)
      .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file));

    console.log(`🔍 ${photoFiles.length} fotos encontradas`);

    for (const file of photoFiles) {
      try {
        // Extraer player ID del nombre del archivo
        const playerId = file.match(/^(\d+)/)?.[1];
        if (!playerId) {
          console.log(`⚠️ No se pudo extraer player ID de: ${file}`);
          continue;
        }

        const results = await this.processPlayerPhoto(file, playerId);
        this.processedPlayers.push({ originalFile: file, playerId, results });
        this.stats.processed++;

      } catch (error) {
        console.log(`❌ Error procesando ${file}: ${error.message}`);
        this.errors.push({ file, error: error.message });
        this.stats.errors++;
      }
    }
  }

  // Descargar fotos automáticamente desde API-Sports
  async downloadPhotosFromAPI() {
    console.log('🌐 Descargando fotos desde API-Sports...');

    try {
      // Obtener lista de jugadores desde la API local
      const { spawn } = require('child_process');

      // Hacer llamada a la API local para obtener jugadores
      const curl = spawn('curl', ['-s', 'http://localhost:3000/api/laliga/laliga/players?page=1']);
      let data = '';

      curl.stdout.on('data', (chunk) => {
        data += chunk;
      });

      return new Promise((resolve, reject) => {
        curl.on('close', async (code) => {
          if (code !== 0) {
            reject(new Error('Error obteniendo jugadores de la API'));
            return;
          }

          try {
            const response = JSON.parse(data);
            if (!response.success) {
              reject(new Error('API response not successful'));
              return;
            }

            console.log(`🔍 Descargando fotos para ${response.data.length} jugadores...`);

            // Crear directorio temporal para descargas
            const tempDir = path.join(this.inputDir, 'temp-downloads');
            if (!fs.existsSync(tempDir)) {
              fs.mkdirSync(tempDir, { recursive: true });
            }

            let downloadCount = 0;
            const maxConcurrent = 5; // Límite de descargas concurrentes

            for (let i = 0; i < response.data.length; i += maxConcurrent) {
              const batch = response.data.slice(i, i + maxConcurrent);

              await Promise.allSettled(
                batch.map(async (player) => {
                  if (player.photo) {
                    try {
                      const filename = `${player.id}-${player.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`;
                      const filepath = path.join(tempDir, filename);

                      await this.downloadImage(player.photo, filepath);
                      console.log(`📥 Descargado: ${player.name} (${player.id})`);
                      downloadCount++;
                      this.stats.downloaded++;
                    } catch (error) {
                      console.log(`⚠️ Error descargando ${player.name}: ${error.message}`);
                    }
                  }
                })
              );

              // Pausa entre lotes para no sobrecargar
              if (i + maxConcurrent < response.data.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }

            console.log(`✅ ${downloadCount} fotos descargadas en ${tempDir}`);

            // Procesar las fotos descargadas
            const originalInputDir = this.inputDir;
            this.inputDir = tempDir;
            await this.processLocalPhotos();
            this.inputDir = originalInputDir;

            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });

    } catch (error) {
      throw new Error(`Error en descarga automática: ${error.message}`);
    }
  }

  // Mostrar resumen del procesamiento
  printSummary() {
    console.log('\n📊 RESUMEN DEL PROCESAMIENTO DE FOTOS');
    console.log('=====================================');
    console.log(`📥 Fotos descargadas: ${this.stats.downloaded}`);
    console.log(`✅ Jugadores procesados: ${this.stats.processed}`);
    console.log(`❌ Errores: ${this.stats.errors}`);

    if (this.processedPlayers.length > 0) {
      console.log('\n🎉 FOTOS GENERADAS:');
      this.processedPlayers.slice(0, 10).forEach(({ originalFile, playerId, results }) => {
        console.log(`\n📄 ${originalFile} → Player ID: ${playerId}`);
        results.forEach(result => {
          const status = result.status === 'success' ? '✅' : '❌';
          console.log(`  ${status} ${result.size}: ${path.basename(result.file)}`);
        });
      });

      if (this.processedPlayers.length > 10) {
        console.log(`\n... y ${this.processedPlayers.length - 10} jugadores más`);
      }
    }

    const totalPhotos = this.processedPlayers.reduce((acc, player) => {
      return acc + player.results.filter(r => r.status === 'success').length;
    }, 0);

    console.log(`\n🎯 Total de fotos generadas: ${totalPhotos}`);
    console.log('📁 Ubicación: frontend/assets/logos/players/');
  }

  // Función principal
  async processAll(autoDownload = false) {
    console.log('🚀 Iniciando procesamiento de fotos de jugadores...');
    console.log(`📁 Input: ${this.inputDir}`);
    console.log(`📁 Output: ${this.outputDir}`);

    // Verificar WebP
    if (!this.checkWebPSupport()) {
      throw new Error('WebP support is required');
    }

    // Crear directorio de salida si no existe
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      console.log(`📁 Directorio creado: ${this.outputDir}`);
    }

    try {
      if (autoDownload) {
        await this.downloadPhotosFromAPI();
      } else {
        await this.processLocalPhotos();
      }

      this.printSummary();
    } catch (error) {
      console.error(`❌ Error en procesamiento: ${error.message}`);
      throw error;
    }
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const inputDir = args[0] || './input-logos/players';
  const outputDir = args[1] || './frontend/assets/logos/players';
  const autoDownload = args.includes('--download');

  console.log('📸 PROCESADOR DE FOTOS JUGADORES LA LIGA 2025/26');
  console.log('===============================================');

  try {
    const processor = new PlayerPhotoProcessor(inputDir, outputDir);
    await processor.processAll(autoDownload);

    console.log('\n🏆 PROCESAMIENTO COMPLETADO');
    console.log('===========================');
    console.log('📁 Las fotos están listas para usar en la aplicación');

    if (autoDownload) {
      console.log('🌐 Las fotos se descargaron automáticamente desde API-Sports');
    }

  } catch (error) {
    console.error(`❌ Error fatal: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { PlayerPhotoProcessor };