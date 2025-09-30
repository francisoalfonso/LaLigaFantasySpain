#!/usr/bin/env node
/**
 * Script de Auditoría Completa del Proyecto
 * Analiza calidad del código, duplicación, TODOs, y más
 */

const fs = require('fs').promises;
const path = require('path');

const COLORS = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const audit = {
    todos: [],
    fixmes: [],
    consoleLogs: [],
    duplicateCode: [],
    largeFiles: [],
    unusedImports: [],
    missingJSDoc: [],
    stats: {
        totalFiles: 0,
        totalLines: 0,
        avgLinesPerFile: 0,
        jsFiles: 0,
        testFiles: 0
    }
};

async function scanDirectory(dir, extensions = ['.js']) {
    const files = [];
    const items = await fs.readdir(dir, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
            // Skip node_modules, logs, temp directories
            if (['node_modules', 'logs', 'temp', 'output', 'coverage'].includes(item.name)) {
                continue;
            }
            files.push(...(await scanDirectory(fullPath, extensions)));
        } else if (extensions.some((ext) => item.name.endsWith(ext))) {
            files.push(fullPath);
        }
    }

    return files;
}

async function analyzeFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const relativePath = path.relative(process.cwd(), filePath);

    audit.stats.totalFiles++;
    audit.stats.totalLines += lines.length;

    if (filePath.endsWith('.test.js')) {
        audit.stats.testFiles++;
    } else if (filePath.endsWith('.js')) {
        audit.stats.jsFiles++;
    }

    // Check for TODOs and FIXMEs
    lines.forEach((line, index) => {
        if (/TODO|FIXME|XXX|HACK/.test(line)) {
            const match = line.match(/(TODO|FIXME|XXX|HACK):?\s*(.+)/);
            if (match) {
                const item = {
                    file: relativePath,
                    line: index + 1,
                    type: match[1],
                    message: match[2].trim()
                };

                if (match[1] === 'TODO') {
                    audit.todos.push(item);
                } else if (match[1] === 'FIXME') {
                    audit.fixmes.push(item);
                }
            }
        }

        // Check for console.log (should use logger)
        if (/console\.(log|error|warn|info)/.test(line) && !line.includes('//')) {
            audit.consoleLogs.push({
                file: relativePath,
                line: index + 1,
                content: line.trim()
            });
        }
    });

    // Check for large files (>500 lines)
    if (lines.length > 500) {
        audit.largeFiles.push({
            file: relativePath,
            lines: lines.length
        });
    }

    // Check for missing JSDoc on exported functions
    const exportMatches = content.match(/^(module\.exports|exports\.\w+)\s*=/gm);
    if (exportMatches) {
        const hasJSDoc = /\/\*\*/.test(content);
        if (!hasJSDoc) {
            audit.missingJSDoc.push({
                file: relativePath,
                exports: exportMatches.length
            });
        }
    }
}

function printHeader(title) {
    console.log('\n' + '='.repeat(80));
    console.log(`${COLORS.cyan}${title}${COLORS.reset}`);
    console.log('='.repeat(80));
}

function printSection(title, items, color = COLORS.yellow) {
    if (items.length === 0) {
        return;
    }

    console.log(`\n${color}${title}: ${items.length}${COLORS.reset}`);
    console.log('-'.repeat(80));

    items.slice(0, 10).forEach((item, index) => {
        if (item.file) {
            console.log(`${index + 1}. ${item.file}:${item.line || ''}`);
            if (item.message) {
                console.log(`   ${item.type}: ${item.message}`);
            }
            if (item.content) {
                console.log(`   ${item.content}`);
            }
            if (item.lines) {
                console.log(`   ${item.lines} líneas`);
            }
        }
    });

    if (items.length > 10) {
        console.log(`\n... y ${items.length - 10} más`);
    }
}

function printStats() {
    printHeader('📊 ESTADÍSTICAS DEL PROYECTO');

    audit.stats.avgLinesPerFile = Math.round(audit.stats.totalLines / audit.stats.totalFiles);

    console.log(`\n${COLORS.green}Archivos totales:${COLORS.reset} ${audit.stats.totalFiles}`);
    console.log(
        `${COLORS.green}Archivos JavaScript:${COLORS.reset} ${audit.stats.jsFiles}`
    );
    console.log(`${COLORS.green}Archivos de test:${COLORS.reset} ${audit.stats.testFiles}`);
    console.log(`${COLORS.green}Líneas totales:${COLORS.reset} ${audit.stats.totalLines.toLocaleString()}`);
    console.log(
        `${COLORS.green}Promedio líneas/archivo:${COLORS.reset} ${audit.stats.avgLinesPerFile}`
    );

    const testCoverage =
        audit.stats.jsFiles > 0
            ? ((audit.stats.testFiles / audit.stats.jsFiles) * 100).toFixed(1)
            : 0;
    console.log(`${COLORS.green}Test coverage (archivos):${COLORS.reset} ${testCoverage}%`);
}

function printSummary() {
    printHeader('📋 RESUMEN DE AUDITORÍA');

    const issues = [
        { name: 'TODOs pendientes', count: audit.todos.length, severity: 'medium' },
        { name: 'FIXMEs críticos', count: audit.fixmes.length, severity: 'high' },
        {
            name: 'console.log sin migrar',
            count: audit.consoleLogs.length,
            severity: 'low'
        },
        {
            name: 'Archivos grandes (>500 líneas)',
            count: audit.largeFiles.length,
            severity: 'medium'
        },
        {
            name: 'Archivos sin JSDoc',
            count: audit.missingJSDoc.length,
            severity: 'low'
        }
    ];

    let totalIssues = 0;
    let criticalIssues = 0;

    issues.forEach((issue) => {
        const color =
            issue.severity === 'high'
                ? COLORS.red
                : issue.severity === 'medium'
                  ? COLORS.yellow
                  : COLORS.blue;

        console.log(`\n${color}${issue.name}:${COLORS.reset} ${issue.count}`);
        totalIssues += issue.count;
        if (issue.severity === 'high') {
            criticalIssues += issue.count;
        }
    });

    console.log('\n' + '-'.repeat(80));
    console.log(
        `${COLORS.cyan}Total issues encontrados:${COLORS.reset} ${totalIssues}`
    );
    console.log(
        `${COLORS.red}Issues críticos:${COLORS.reset} ${criticalIssues}`
    );

    // Calcular score de calidad
    const maxIssues = audit.stats.totalFiles * 5; // Asumiendo 5 issues por archivo como máximo
    const qualityScore = Math.max(0, Math.min(100, 100 - (totalIssues / maxIssues) * 100));

    console.log(
        `\n${COLORS.green}Score de calidad:${COLORS.reset} ${qualityScore.toFixed(1)}/100`
    );

    if (qualityScore >= 90) {
        console.log(`${COLORS.green}✅ Excelente calidad de código${COLORS.reset}`);
    } else if (qualityScore >= 70) {
        console.log(`${COLORS.yellow}⚠️  Buena calidad, algunas mejoras recomendadas${COLORS.reset}`);
    } else {
        console.log(`${COLORS.red}❌ Se requieren mejoras significativas${COLORS.reset}`);
    }
}

async function main() {
    console.log(`${COLORS.cyan}🔍 Fantasy La Liga - Auditoría de Código${COLORS.reset}`);
    console.log(`Iniciando análisis...\n`);

    try {
        // Scan backend directory
        const files = await scanDirectory(path.join(process.cwd(), 'backend'));

        console.log(
            `${COLORS.green}✓${COLORS.reset} Encontrados ${files.length} archivos JavaScript`
        );
        console.log(`${COLORS.green}✓${COLORS.reset} Analizando archivos...`);

        for (const file of files) {
            await analyzeFile(file);
        }

        console.log(`${COLORS.green}✓${COLORS.reset} Análisis completado\n`);

        // Print results
        printStats();
        printSection('📝 TODOs Pendientes', audit.todos, COLORS.yellow);
        printSection('🔧 FIXMEs Críticos', audit.fixmes, COLORS.red);
        printSection('📢 console.log sin migrar', audit.consoleLogs, COLORS.blue);
        printSection('📏 Archivos Grandes', audit.largeFiles, COLORS.yellow);
        printSection('📖 Archivos sin JSDoc', audit.missingJSDoc, COLORS.blue);
        printSummary();

        console.log('\n' + '='.repeat(80));
        console.log(`${COLORS.green}✅ Auditoría completada exitosamente${COLORS.reset}`);
        console.log('='.repeat(80) + '\n');
    } catch (error) {
        console.error(`${COLORS.red}❌ Error durante auditoría:${COLORS.reset}`, error.message);
        process.exit(1);
    }
}

main();