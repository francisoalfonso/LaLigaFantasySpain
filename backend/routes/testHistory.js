const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

/**
 * GET /api/test-history/list
 * Lista todos los archivos de versión disponibles
 */
router.get('/list', async (req, res) => {
    try {
        const versionsDir = path.join(__dirname, '../../data/instagram-versions');

        // Leer todos los archivos JSON de versiones
        const files = await fs.readdir(versionsDir);
        const versionFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('_') && f !== 'VERSION_SCHEMA.json' && f !== 'EXAMPLE_WITH_FEEDBACK.json');

        // Leer el contenido de cada archivo
        const versions = await Promise.all(
            versionFiles.map(async (file) => {
                const filePath = path.join(versionsDir, file);
                const content = await fs.readFile(filePath, 'utf8');
                return JSON.parse(content);
            })
        );

        // Ordenar por testNumber descendente (más reciente primero)
        versions.sort((a, b) => {
            const numA = a.testMetadata?.testNumber || 0;
            const numB = b.testMetadata?.testNumber || 0;
            return numB - numA;
        });

        res.json({
            success: true,
            count: versions.length,
            tests: versions
        });

    } catch (error) {
        console.error('Error loading test history:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/test-history/test/:id
 * Obtiene un test específico por ID
 */
router.get('/test/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const filePath = path.join(__dirname, '../../data/instagram-versions', `${id}.json`);

        const content = await fs.readFile(filePath, 'utf8');
        const test = JSON.parse(content);

        res.json({
            success: true,
            test
        });

    } catch (error) {
        console.error(`Error loading test ${req.params.id}:`, error);
        res.status(404).json({
            success: false,
            error: 'Test not found'
        });
    }
});

/**
 * GET /api/test-history/counter
 * Obtiene el contador de tests
 */
router.get('/counter', async (req, res) => {
    try {
        const counterPath = path.join(__dirname, '../../data/instagram-versions/_TEST_COUNTER.json');
        const content = await fs.readFile(counterPath, 'utf8');
        const counter = JSON.parse(content);

        res.json({
            success: true,
            counter
        });

    } catch (error) {
        console.error('Error loading test counter:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/test-history/test/:id/feedback
 * Actualiza el feedback de un test específico
 */
router.put('/test/:id/feedback', async (req, res) => {
    try {
        const { id } = req.params;
        const { whatWorks, whatFails, reviewNotes, checklist, qualityScore } = req.body;

        const filePath = path.join(__dirname, '../../data/instagram-versions', `${id}.json`);

        // Leer archivo actual
        const content = await fs.readFile(filePath, 'utf8');
        const test = JSON.parse(content);

        // Actualizar campos de feedback
        if (!test.testMetadata) {
            test.testMetadata = {};
        }
        if (!test.testMetadata.feedback) {
            test.testMetadata.feedback = {};
        }

        // Actualizar feedback
        if (whatWorks !== undefined) {
            test.testMetadata.feedback.whatWorks = whatWorks;
        }
        if (whatFails !== undefined) {
            test.testMetadata.feedback.whatFails = whatFails;
        }
        if (reviewNotes !== undefined) {
            test.testMetadata.feedback.reviewNotes = reviewNotes;
        }

        // Calcular severity automáticamente
        const fails = whatFails || test.testMetadata.feedback.whatFails || [];
        test.testMetadata.feedback.severity = {
            critical: fails.filter(f => f.severity === 'critical').length,
            major: fails.filter(f => f.severity === 'major').length,
            minor: fails.filter(f => f.severity === 'minor').length
        };

        test.testMetadata.feedback.reviewedBy = 'Usuario';
        test.testMetadata.feedback.reviewDate = new Date().toISOString();

        // Actualizar checklist si se proporciona
        if (checklist !== undefined) {
            test.testMetadata.checklist = {
                ...test.testMetadata.checklist,
                ...checklist
            };
        }

        // Actualizar quality score si se proporciona
        if (qualityScore !== undefined) {
            test.testMetadata.qualityScore = {
                ...test.testMetadata.qualityScore,
                ...qualityScore
            };
        }

        // Calcular score automático basado en feedback si no hay scores manuales
        const hasManualScores = test.testMetadata.qualityScore?.videoQuality ||
                                test.testMetadata.qualityScore?.audioQuality ||
                                test.testMetadata.qualityScore?.viralPotential ||
                                test.testMetadata.qualityScore?.technicalScore;

        if (!hasManualScores) {
            const feedback = test.testMetadata.feedback;
            const severity = feedback.severity || { critical: 0, major: 0, minor: 0 };

            // Algoritmo de puntuación automática
            // Base: 10.0
            // -2.0 por cada critical
            // -0.5 por cada major
            // -0.2 por cada minor
            // +0.3 por cada whatWorks

            const baseScore = 10.0;
            const criticalPenalty = severity.critical * 2.0;
            const majorPenalty = severity.major * 0.5;
            const minorPenalty = severity.minor * 0.2;
            const worksBonus = (feedback.whatWorks?.length || 0) * 0.3;

            const calculatedScore = Math.max(0, Math.min(10,
                baseScore - criticalPenalty - majorPenalty - minorPenalty + worksBonus
            ));

            test.testMetadata.qualityScore = {
                videoQuality: null,
                audioQuality: null,
                viralPotential: null,
                technicalScore: null,
                overallScore: parseFloat(calculatedScore.toFixed(1)),
                autoCalculated: true,
                calculationMethod: `Base 10.0 - (${severity.critical} critical × 2.0) - (${severity.major} major × 0.5) - (${severity.minor} minor × 0.2) + (${feedback.whatWorks?.length || 0} works × 0.3)`
            };
        }

        // Actualizar metadata general
        test.metadata.updatedAt = new Date().toISOString();

        // Guardar archivo actualizado
        await fs.writeFile(filePath, JSON.stringify(test, null, 2), 'utf8');

        res.json({
            success: true,
            message: 'Feedback actualizado correctamente',
            test
        });

    } catch (error) {
        console.error(`Error updating feedback for test ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
