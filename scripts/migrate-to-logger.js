/**
 * Script de migración automática: console.log → logger
 * Reemplaza los 645 console.log del proyecto
 */

const fs = require('fs');
const path = require('path');

// Directorios a procesar
const DIRECTORIES = [
    'backend/services',
    'backend/routes',
    'backend/config',
    'scripts'
];

// Archivos a excluir
const EXCLUDE_FILES = [
    'migrate-to-logger.js',
    'logger.js'
];

// Patrones de reemplazo
const REPLACEMENTS = [
    // console.log → logger.info
    {
        pattern: /console\.log\(/g,
        replacement: 'logger.info(',
        description: 'console.log → logger.info'
    },
    // console.error → logger.error
    {
        pattern: /console\.error\(/g,
        replacement: 'logger.error(',
        description: 'console.error → logger.error'
    },
    // console.warn → logger.warn
    {
        pattern: /console\.warn\(/g,
        replacement: 'logger.warn(',
        description: 'console.warn → logger.warn'
    },
    // console.debug → logger.debug
    {
        pattern: /console\.debug\(/g,
        replacement: 'logger.debug(',
        description: 'console.debug → logger.debug'
    }
];

// Estadísticas
const stats = {
    filesProcessed: 0,
    filesModified: 0,
    replacements: {
        'console.log → logger.info': 0,
        'console.error → logger.error': 0,
        'console.warn → logger.warn': 0,
        'console.debug → logger.debug': 0
    }
};

/**
 * Procesar un archivo
 */
function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        const originalContent = content;

        // Aplicar reemplazos
        REPLACEMENTS.forEach(({ pattern, replacement, description }) => {
            const matches = content.match(pattern);
            if (matches) {
                content = content.replace(pattern, replacement);
                stats.replacements[description] += matches.length;
                modified = true;
            }
        });

        // Si se modificó, agregar import de logger
        if (modified && !content.includes('require(\'../utils/logger\')') && !content.includes('require(\'./utils/logger\')')) {
            // Determinar ruta relativa correcta
            const depth = filePath.split(path.sep).filter(p => p !== '.').length - 2;
            const relativePath = '../'.repeat(depth) + 'utils/logger';

            // Buscar primer require existente
            const firstRequire = content.match(/const .+ = require\(.+\);/);
            if (firstRequire) {
                // Insertar después del primer require
                const insertIndex = content.indexOf(firstRequire[0]) + firstRequire[0].length;
                content = content.slice(0, insertIndex) + `\nconst logger = require('${relativePath}');` + content.slice(insertIndex);
            } else {
                // Insertar al inicio
                content = `const logger = require('${relativePath}');\n\n` + content;
            }

            stats.filesModified++;
        }

        // Guardar si hubo cambios
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Modificado: ${filePath}`);
        }

        stats.filesProcessed++;
    } catch (error) {
        console.error(`❌ Error procesando ${filePath}:`, error.message);
    }
}

/**
 * Procesar directorio recursivamente
 */
function processDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            processDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            // Excluir archivos específicos
            if (!EXCLUDE_FILES.includes(entry.name)) {
                processFile(fullPath);
            }
        }
    }
}

/**
 * Ejecutar migración
 */
function main() {
    console.log('\n🔄 MIGRACIÓN: console.log → logger');
    console.log('====================================\n');

    DIRECTORIES.forEach(dir => {
        const fullPath = path.resolve(dir);
        if (fs.existsSync(fullPath)) {
            console.log(`📁 Procesando: ${dir}`);
            processDirectory(fullPath);
        } else {
            console.log(`⚠️  Directorio no encontrado: ${dir}`);
        }
    });

    // Mostrar estadísticas
    console.log('\n📊 ESTADÍSTICAS FINALES');
    console.log('====================================');
    console.log(`Archivos procesados: ${stats.filesProcessed}`);
    console.log(`Archivos modificados: ${stats.filesModified}`);
    console.log('\nReemplazos realizados:');
    Object.entries(stats.replacements).forEach(([type, count]) => {
        if (count > 0) {
            console.log(`  ${type}: ${count}`);
        }
    });
    console.log('\n✅ Migración completada\n');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = { processFile, processDirectory };