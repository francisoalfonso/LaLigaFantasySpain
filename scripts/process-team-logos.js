#!/usr/bin/env node
// =================================================
// SCRIPT AUTOMÁTICO PROCESAMIENTO LOGOS EQUIPOS
// =================================================
// Procesa logos de equipos La Liga con naming optimizado

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Mapeo de nombres de archivos originales a IDs de equipos
const TEAM_NAME_TO_ID = {
  'real madrid': 541,
  'real-madrid': 541,
  'madrid': 541,
  'barcelona': 529,
  'barca': 529,
  'fc barcelona': 529,
  'atletico madrid': 530,
  'atletico': 530,
  'atleti': 530,
  'athletic bilbao': 531,
  'athletic club': 531,
  'athletic': 531,
  'valencia': 532,
  'villarreal': 533,
  'sevilla': 536,
  'celta vigo': 538,
  'celta': 538,
  'levante': 539,
  'espanyol': 540,
  'alaves': 542,
  'deportivo alaves': 542,
  'real betis': 543,
  'betis': 543,
  'getafe': 546,
  'girona': 547,
  'real sociedad': 548,
  'sociedad': 548,
  'oviedo': 718,
  'real oviedo': 718,
  'osasuna': 727,
  'rayo vallecano': 728,
  'rayo': 728,
  'elche': 797,
  'mallorca': 798,
  'rcd mallorca': 798
};

// Slugs para naming consistente
const ID_TO_SLUG = {
  541: 'real-madrid',
  529: 'barcelona',
  530: 'atletico-madrid',
  531: 'athletic-bilbao',
  532: 'valencia',
  533: 'villarreal',
  536: 'sevilla',
  538: 'celta-vigo',
  539: 'levante',
  540: 'espanyol',
  542: 'alaves',
  543: 'real-betis',
  546: 'getafe',
  547: 'girona',
  548: 'real-sociedad',
  718: 'oviedo',
  727: 'osasuna',
  728: 'rayo-vallecano',
  797: 'elche',
  798: 'mallorca'
};

// Configuración de tamaños
const LOGO_SIZES = {
  'sm': 64,
  'md': 128,
  'lg': 256,
  'xl': 512
};

class LogoProcessor {
  constructor(inputDir, outputDir) {
    this.inputDir = inputDir;
    this.outputDir = outputDir;
    this.processedFiles = [];
    this.errors = [];
  }

  // Detectar team ID desde nombre de archivo
  detectTeamId(filename) {
    // Primero intentar detectar ID numérico directamente
    const numericMatch = filename.match(/^(\d+)/);
    if (numericMatch) {
      const teamId = parseInt(numericMatch[1]);
      // Verificar que el ID existe en nuestro mapeo
      if (ID_TO_SLUG[teamId]) {
        return teamId;
      }
    }

    // Si no hay ID numérico, intentar por nombre
    const cleanName = filename
      .toLowerCase()
      .replace(/\.(png|jpg|jpeg|webp|svg)$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Buscar match exacto primero
    if (TEAM_NAME_TO_ID[cleanName]) {
      return TEAM_NAME_TO_ID[cleanName];
    }

    // Buscar match parcial
    for (const [name, id] of Object.entries(TEAM_NAME_TO_ID)) {
      if (cleanName.includes(name) || name.includes(cleanName)) {
        return id;
      }
    }

    return null;
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

  // Procesar un logo individual
  async processLogo(inputFile, teamId) {
    const slug = ID_TO_SLUG[teamId];
    if (!slug) {
      throw new Error(`No se encontró slug para team ID: ${teamId}`);
    }

    const inputPath = path.join(this.inputDir, inputFile);
    const results = [];

    console.log(`🔄 Procesando: ${inputFile} → Team ID: ${teamId} (${slug})`);

    // Crear logo principal (512px)
    const mainOutput = path.join(this.outputDir, `${teamId}-${slug}-logo.webp`);
    try {
      execSync(`cwebp -q 90 -resize 512 512 "${inputPath}" -o "${mainOutput}"`, { stdio: 'ignore' });
      results.push({ size: 'main', file: mainOutput, status: 'success' });
      console.log(`  ✅ Principal: ${teamId}-${slug}-logo.webp`);
    } catch (error) {
      results.push({ size: 'main', file: mainOutput, status: 'error', error: error.message });
      console.log(`  ❌ Error en principal: ${error.message}`);
    }

    // Crear diferentes tamaños
    for (const [sizeName, pixels] of Object.entries(LOGO_SIZES)) {
      if (sizeName === 'xl') continue; // xl es el principal

      const sizeOutput = path.join(this.outputDir, `${teamId}-${slug}-logo-${sizeName}.webp`);
      try {
        execSync(`cwebp -q 90 -resize ${pixels} ${pixels} "${inputPath}" -o "${sizeOutput}"`, { stdio: 'ignore' });
        results.push({ size: sizeName, file: sizeOutput, status: 'success' });
        console.log(`  ✅ ${sizeName} (${pixels}px): ${teamId}-${slug}-logo-${sizeName}.webp`);
      } catch (error) {
        results.push({ size: sizeName, file: sizeOutput, status: 'error', error: error.message });
        console.log(`  ❌ Error en ${sizeName}: ${error.message}`);
      }
    }

    return results;
  }

  // Procesar todos los logos en el directorio
  async processAll() {
    console.log('🚀 Iniciando procesamiento de logos...');
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

    // Obtener archivos de imagen
    const imageFiles = fs.readdirSync(this.inputDir)
      .filter(file => /\.(png|jpg|jpeg|webp|svg)$/i.test(file));

    console.log(`🔍 ${imageFiles.length} archivos de imagen encontrados`);

    // Procesar cada archivo
    for (const file of imageFiles) {
      try {
        const teamId = this.detectTeamId(file);
        if (!teamId) {
          console.log(`⚠️ No se pudo detectar equipo para: ${file}`);
          this.errors.push({ file, error: 'Team ID not detected' });
          continue;
        }

        const results = await this.processLogo(file, teamId);
        this.processedFiles.push({ originalFile: file, teamId, results });

      } catch (error) {
        console.log(`❌ Error procesando ${file}: ${error.message}`);
        this.errors.push({ file, error: error.message });
      }
    }

    this.printSummary();
  }

  // Mostrar resumen del procesamiento
  printSummary() {
    console.log('\n📊 RESUMEN DEL PROCESAMIENTO');
    console.log('================================');
    console.log(`✅ Archivos procesados: ${this.processedFiles.length}`);
    console.log(`❌ Errores: ${this.errors.length}`);

    if (this.processedFiles.length > 0) {
      console.log('\n🎉 LOGOS GENERADOS:');
      this.processedFiles.forEach(({ originalFile, teamId, results }) => {
        const slug = ID_TO_SLUG[teamId];
        console.log(`\n📄 ${originalFile} → Team ID: ${teamId} (${slug})`);
        results.forEach(result => {
          const status = result.status === 'success' ? '✅' : '❌';
          console.log(`  ${status} ${result.size}: ${path.basename(result.file)}`);
        });
      });
    }

    if (this.errors.length > 0) {
      console.log('\n⚠️ ERRORES:');
      this.errors.forEach(error => {
        console.log(`❌ ${error.file}: ${error.error}`);
      });
    }

    // Generar lista de archivos para verificación
    console.log('\n📋 ARCHIVOS GENERADOS PARA VERIFICACIÓN:');
    const generatedFiles = [];
    this.processedFiles.forEach(({ teamId, results }) => {
      results.forEach(result => {
        if (result.status === 'success') {
          generatedFiles.push(path.basename(result.file));
        }
      });
    });

    generatedFiles.sort().forEach(file => console.log(`  ✅ ${file}`));
    console.log(`\n🎯 Total de logos generados: ${generatedFiles.length}`);
  }

  // Validar que todos los equipos tienen logos
  validateAllTeams() {
    const requiredTeams = Object.keys(ID_TO_SLUG).map(id => parseInt(id));
    const processedTeams = this.processedFiles.map(f => f.teamId);
    const missingTeams = requiredTeams.filter(id => !processedTeams.includes(id));

    if (missingTeams.length > 0) {
      console.log('\n⚠️ EQUIPOS SIN LOGOS:');
      missingTeams.forEach(id => {
        const slug = ID_TO_SLUG[id];
        console.log(`❌ Team ID ${id}: ${slug}`);
      });
    } else {
      console.log('\n🎉 ¡Todos los equipos tienen logos!');
    }
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const inputDir = args[0] || './input-logos';
  const outputDir = args[1] || './frontend/assets/logos/teams';

  console.log('🎨 PROCESADOR DE LOGOS LA LIGA 2025/26');
  console.log('====================================');

  try {
    const processor = new LogoProcessor(inputDir, outputDir);
    await processor.processAll();
    processor.validateAllTeams();

    console.log('\n🏆 PROCESAMIENTO COMPLETADO');
    console.log('===========================');
    console.log('📁 Los logos están listos para usar en la aplicación');
    console.log('🔗 Revisa frontend/assets/logos/README.md para más detalles');

  } catch (error) {
    console.error(`❌ Error fatal: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { LogoProcessor, TEAM_NAME_TO_ID, ID_TO_SLUG };