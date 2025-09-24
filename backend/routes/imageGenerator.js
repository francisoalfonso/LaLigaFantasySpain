// Rutas para generación de imágenes - Fantasy La Liga Pro
const express = require('express');
const router = express.Router();
const imageGenerator = require('../services/imageGenerator');

// GET /api/images/test - Test del generador de imágenes
router.get('/test', async (req, res) => {
  try {
    console.log('🎨 Testing Image Generator...');

    // Datos de prueba
    const testPlayerData = {
      id: 143,
      name: 'L. Messi',
      team: {
        id: 529,
        name: 'Barcelona'
      },
      stats: {
        rating: '8.5',
        goals: '12',
        games: '15'
      }
    };

    const testBargainData = {
      estimatedPrice: '9.8',
      valueRatio: '1.45'
    };

    // Generar imagen de prueba
    const cholloImage = await imageGenerator.generateCholloImage(testPlayerData, testBargainData);

    res.json({
      success: true,
      message: 'Image generator test completed',
      generatedImage: cholloImage,
      testData: {
        playerData: testPlayerData,
        bargainData: testBargainData
      },
      capabilities: [
        'chollo_images',
        'analysis_images',
        'alert_images',
        'html_to_image_conversion',
        'automatic_cleanup'
      ],
      formats_supported: ['JPEG', 'PNG'],
      dimensions: '1080x1080 (Instagram ready)'
    });

  } catch (error) {
    console.error('❌ Image generator test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing image generator',
      error: error.message
    });
  }
});

// POST /api/images/generate-chollo - Generar imagen de chollo
router.post('/generate-chollo', async (req, res) => {
  try {
    const { playerData, bargainData } = req.body;

    if (!playerData || !playerData.name) {
      return res.status(400).json({
        success: false,
        message: 'playerData with name is required'
      });
    }

    console.log('🔥 Generating chollo image for:', playerData.name);

    const generatedImage = await imageGenerator.generateCholloImage(playerData, bargainData || {});

    res.json({
      success: true,
      message: 'Chollo image generated successfully',
      image: generatedImage,
      preview_url: `http://localhost:3000${generatedImage.url}`
    });

  } catch (error) {
    console.error('❌ Error generating chollo image:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating chollo image',
      error: error.message
    });
  }
});

// POST /api/images/generate-analysis - Generar imagen de análisis
router.post('/generate-analysis', async (req, res) => {
  try {
    const { analysisData } = req.body;

    console.log('📊 Generating analysis image');

    const generatedImage = await imageGenerator.generateAnalysisImage(analysisData || {});

    res.json({
      success: true,
      message: 'Analysis image generated successfully',
      image: generatedImage,
      preview_url: `http://localhost:3000${generatedImage.url}`
    });

  } catch (error) {
    console.error('❌ Error generating analysis image:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating analysis image',
      error: error.message
    });
  }
});

// POST /api/images/generate-alert - Generar imagen de alerta
router.post('/generate-alert', async (req, res) => {
  try {
    const { alertData } = req.body;

    console.log('🚨 Generating alert image');

    const generatedImage = await imageGenerator.generateAlertImage(alertData || {});

    res.json({
      success: true,
      message: 'Alert image generated successfully',
      image: generatedImage,
      preview_url: `http://localhost:3000${generatedImage.url}`
    });

  } catch (error) {
    console.error('❌ Error generating alert image:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating alert image',
      error: error.message
    });
  }
});

// POST /api/images/generate-from-bargain - Generar imagen desde datos de chollo
router.post('/generate-from-bargain', async (req, res) => {
  try {
    const { playerId } = req.body;

    if (!playerId) {
      return res.status(400).json({
        success: false,
        message: 'playerId is required'
      });
    }

    // Obtener datos del chollo
    console.log('📡 Getting bargain data for player:', playerId);

    // Simular datos del chollo (en producción vendría del BargainAnalyzer)
    const mockPlayerData = {
      id: playerId,
      name: 'Player Test',
      team: { name: 'Test Team' },
      stats: {
        rating: '7.5',
        goals: '3',
        games: '8'
      }
    };

    const mockBargainData = {
      estimatedPrice: '5.2',
      valueRatio: '1.35'
    };

    const generatedImage = await imageGenerator.generateCholloImage(mockPlayerData, mockBargainData);

    res.json({
      success: true,
      message: 'Image generated from bargain data',
      image: generatedImage,
      preview_url: `http://localhost:3000${generatedImage.url}`,
      sourceData: {
        playerId,
        playerData: mockPlayerData,
        bargainData: mockBargainData
      }
    });

  } catch (error) {
    console.error('❌ Error generating image from bargain:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating image from bargain data',
      error: error.message
    });
  }
});

// GET /api/images/list - Listar imágenes generadas
router.get('/list', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');

    const outputPath = path.join(__dirname, '../generated/images');

    try {
      const files = await fs.readdir(outputPath);
      const imageFiles = files.filter(file =>
        file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg')
      );

      const images = await Promise.all(
        imageFiles.map(async (file) => {
          const filePath = path.join(outputPath, file);
          const stats = await fs.stat(filePath);

          return {
            fileName: file,
            url: `/generated/images/${file}`,
            preview_url: `http://localhost:3000/generated/images/${file}`,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
      );

      images.sort((a, b) => new Date(b.created) - new Date(a.created));

      res.json({
        success: true,
        count: images.length,
        images
      });

    } catch (error) {
      if (error.code === 'ENOENT') {
        res.json({
          success: true,
          count: 0,
          images: [],
          message: 'No images directory found yet'
        });
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ Error listing images:', error);
    res.status(500).json({
      success: false,
      message: 'Error listing generated images',
      error: error.message
    });
  }
});

// DELETE /api/images/cleanup - Limpiar imágenes antiguas
router.delete('/cleanup', async (req, res) => {
  try {
    const { maxAgeHours = 24 } = req.body;

    console.log(`🗑️ Cleaning images older than ${maxAgeHours} hours`);

    await imageGenerator.cleanOldImages(maxAgeHours);

    res.json({
      success: true,
      message: `Cleanup completed for images older than ${maxAgeHours} hours`
    });

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Error during image cleanup',
      error: error.message
    });
  }
});

module.exports = router;