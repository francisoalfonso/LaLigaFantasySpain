// Generador de imágenes dinámicas para Instagram - Fantasy La Liga Pro
const nodeHtmlToImage = require('node-html-to-image');
const logger = require('../utils/logger');
const Jimp = require('jimp');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');

class ImageGenerator {
  constructor() {
    this.assetsPath = path.join(__dirname, '../assets');
    this.playerPhotosPath = path.join(__dirname, '../assets/player-photos');
    this.teamLogosPath = path.join(__dirname, '../assets/team-logos');
    this.logosPath = path.join(__dirname, '../assets/logos');
    this.templatesPath = path.join(__dirname, '../assets/templates');
    this.outputPath = path.join(__dirname, '../generated/images');

    // Asegurar que existen los directorios
    this.ensureDirectories();
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.assetsPath, { recursive: true });
      await fs.mkdir(this.playerPhotosPath, { recursive: true });
      await fs.mkdir(this.teamLogosPath, { recursive: true });
      await fs.mkdir(this.logosPath, { recursive: true });
      await fs.mkdir(this.templatesPath, { recursive: true });
      await fs.mkdir(this.outputPath, { recursive: true });
      logger.info('📁 Assets directories ensured');
    } catch (error) {
      logger.info('📁 Directories already exist or created');
    }
  }

  // Generar imagen para chollo
  async generateCholloImage(playerData, bargainData) {
    try {
      logger.info('🎨 Generating chollo image for:', playerData.name);

      // Template HTML para chollo con recursos optimizados
      const htmlTemplate = await this.getCholloTemplate(playerData, bargainData);

      // Generar imagen desde HTML
      const imageBuffer = await nodeHtmlToImage({
        html: htmlTemplate,
        quality: 100,
        type: 'jpeg',
        puppeteerArgs: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
        width: 1080,
        height: 1080
      });

      // Guardar imagen generada
      const fileName = `chollo_${playerData.id}_${Date.now()}.jpg`;
      const filePath = path.join(this.outputPath, fileName);

      await fs.writeFile(filePath, imageBuffer);

      logger.info('✅ Chollo image generated:', fileName);

      return {
        fileName,
        filePath,
        url: `/generated/images/${fileName}`,
        type: 'chollo',
        playerName: playerData.name,
        teamName: playerData.team?.name || 'Unknown'
      };

    } catch (error) {
      logger.error('❌ Error generating chollo image:', error);
      throw error;
    }
  }

  // Generar imagen para análisis
  async generateAnalysisImage(analysisData) {
    try {
      logger.info('📊 Generating analysis image');

      const htmlTemplate = this.getAnalysisTemplate(analysisData);

      const imageBuffer = await nodeHtmlToImage({
        html: htmlTemplate,
        quality: 100,
        type: 'jpeg',
        puppeteerArgs: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
        width: 1080,
        height: 1080
      });

      const fileName = `analysis_${Date.now()}.jpg`;
      const filePath = path.join(this.outputPath, fileName);

      await fs.writeFile(filePath, imageBuffer);

      logger.info('✅ Analysis image generated:', fileName);

      return {
        fileName,
        filePath,
        url: `/generated/images/${fileName}`,
        type: 'analysis'
      };

    } catch (error) {
      logger.error('❌ Error generating analysis image:', error);
      throw error;
    }
  }

  // Generar imagen para alerta
  async generateAlertImage(alertData) {
    try {
      logger.info('🚨 Generating alert image');

      const htmlTemplate = this.getAlertTemplate(alertData);

      const imageBuffer = await nodeHtmlToImage({
        html: htmlTemplate,
        quality: 100,
        type: 'jpeg',
        puppeteerArgs: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
        width: 1080,
        height: 1080
      });

      const fileName = `alert_${Date.now()}.jpg`;
      const filePath = path.join(this.outputPath, fileName);

      await fs.writeFile(filePath, imageBuffer);

      logger.info('✅ Alert image generated:', fileName);

      return {
        fileName,
        filePath,
        url: `/generated/images/${fileName}`,
        type: 'alert'
      };

    } catch (error) {
      logger.error('❌ Error generating alert image:', error);
      throw error;
    }
  }

  // Obtener URL de recursos locales
  async getLocalPlayerPhoto(playerId) {
    try {
      const photoPath = path.join(this.playerPhotosPath, `player_${playerId}.jpg`);
      await fs.access(photoPath);
      return `/assets/player-photos/player_${playerId}.jpg`;
    } catch {
      return null;
    }
  }

  async getLocalTeamLogo(teamId) {
    try {
      const logoPath = path.join(this.teamLogosPath, `team_${teamId}.png`);
      await fs.access(logoPath);
      return `/assets/team-logos/team_${teamId}.png`;
    } catch {
      return null;
    }
  }

  async getBrandLogo() {
    try {
      const logoPath = path.join(this.logosPath, 'fantasy-laliga-logo.svg');
      await fs.access(logoPath);
      return `/assets/logos/fantasy-laliga-logo.svg`;
    } catch {
      return null;
    }
  }

  // Descargar y cachear imagen de jugador desde API-Sports
  async downloadAndCachePlayerImage(imageUrl, playerId) {
    try {
      if (!imageUrl || !playerId) return null;

      const localPath = await this.getLocalPlayerPhoto(playerId);
      if (localPath) {
        logger.info('📷 Using cached player photo:', playerId);
        return localPath;
      }

      logger.info('⬇️ Downloading player photo:', playerId);
      const response = await axios({
        method: 'GET',
        url: imageUrl,
        responseType: 'arraybuffer',
        timeout: 5000
      });

      const fileName = `player_${playerId}.jpg`;
      const filePath = path.join(this.playerPhotosPath, fileName);
      await fs.writeFile(filePath, response.data);

      return `/assets/player-photos/${fileName}`;

    } catch (error) {
      logger.info('⚠️ Could not download player image:', error.message);
      return null;
    }
  }

  // Descargar y cachear logo de equipo desde API-Sports
  async downloadAndCacheTeamLogo(logoUrl, teamId) {
    try {
      if (!logoUrl || !teamId) return null;

      const localPath = await this.getLocalTeamLogo(teamId);
      if (localPath) {
        logger.info('🛡️ Using cached team logo:', teamId);
        return localPath;
      }

      logger.info('⬇️ Downloading team logo:', teamId);
      const response = await axios({
        method: 'GET',
        url: logoUrl,
        responseType: 'arraybuffer',
        timeout: 5000
      });

      const fileName = `team_${teamId}.png`;
      const filePath = path.join(this.teamLogosPath, fileName);
      await fs.writeFile(filePath, response.data);

      return `/assets/team-logos/${fileName}`;

    } catch (error) {
      logger.info('⚠️ Could not download team logo:', error.message);
      return null;
    }
  }

  // Template HTML para chollo con foto jugador y escudo equipo
  async getCholloTemplate(playerData, bargainData) {
    // Obtener recursos optimizados (locales primero, luego descargar)
    let playerPhoto = null;
    let teamLogo = null;
    const brandLogo = await this.getBrandLogo();

    // Player photo
    if (playerData.id && playerData.photo) {
      playerPhoto = await this.downloadAndCachePlayerImage(playerData.photo, playerData.id);
    } else if (playerData.player_photo && playerData.id) {
      playerPhoto = await this.downloadAndCachePlayerImage(playerData.player_photo, playerData.id);
    }

    // Team logo
    if (playerData.team?.id && playerData.team?.logo) {
      teamLogo = await this.downloadAndCacheTeamLogo(playerData.team.logo, playerData.team.id);
    } else if (playerData.team_id && playerData.team_logo) {
      teamLogo = await this.downloadAndCacheTeamLogo(playerData.team_logo, playerData.team_id);
    }

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .container {
          width: 1080px;
          height: 1080px;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #f093fb 100%);
          position: relative;
          font-family: 'Inter', sans-serif;
          color: white;
          overflow: hidden;
        }

        .header {
          position: absolute;
          top: 40px;
          left: 0;
          right: 0;
          text-align: center;
          z-index: 10;
        }

        .fire-emoji {
          font-size: 60px;
          margin-bottom: 10px;
          text-shadow: 2px 2px 8px rgba(0,0,0,0.3);
        }

        .title {
          font-size: 40px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 3px;
          text-shadow: 2px 2px 8px rgba(0,0,0,0.4);
          margin-bottom: 5px;
        }

        .subtitle {
          font-size: 18px;
          font-weight: 400;
          opacity: 0.9;
          text-shadow: 1px 1px 4px rgba(0,0,0,0.3);
        }

        .main-content {
          position: absolute;
          top: 180px;
          left: 50%;
          transform: translateX(-50%);
          width: 900px;
          height: 700px;
        }

        .player-card {
          background: rgba(255,255,255,0.98);
          border-radius: 25px;
          padding: 40px;
          color: #2c3e50;
          box-shadow: 0 25px 50px rgba(0,0,0,0.3);
          border: 3px solid #FFD700;
          height: 100%;
          position: relative;
          overflow: hidden;
        }

        .player-header {
          display: flex;
          align-items: center;
          margin-bottom: 30px;
          position: relative;
        }

        .player-photo {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid #3498db;
          margin-right: 30px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }

        .player-photo-placeholder {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3498db, #2980b9);
          margin-right: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          color: white;
          border: 4px solid #3498db;
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }

        .player-info {
          flex: 1;
        }

        .player-name {
          font-size: 48px;
          font-weight: 800;
          color: #2c3e50;
          margin-bottom: 5px;
          line-height: 1.1;
        }

        .team-container {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }

        .team-logo {
          width: 40px;
          height: 40px;
          object-fit: contain;
          margin-right: 15px;
        }

        .team-logo-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: linear-gradient(45deg, #e74c3c, #c0392b);
          margin-right: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          color: white;
          font-weight: bold;
        }

        .team-name {
          font-size: 24px;
          font-weight: 600;
          color: #7f8c8d;
        }

        .position-badge {
          background: #9b59b6;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 16px;
          font-weight: 600;
          display: inline-block;
        }

        .price-section {
          text-align: center;
          margin: 30px 0;
        }

        .price {
          font-size: 80px;
          font-weight: 900;
          color: #e74c3c;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 10px;
        }

        .price-label {
          font-size: 20px;
          color: #7f8c8d;
          font-weight: 600;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          margin: 30px 0;
        }

        .stat-box {
          background: #f8f9fa;
          border-radius: 15px;
          padding: 20px;
          text-align: center;
          border: 2px solid #e9ecef;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #27ae60;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 14px;
          color: #6c757d;
          font-weight: 600;
          text-transform: uppercase;
        }

        .value-ratio {
          background: linear-gradient(45deg, #f39c12, #e67e22);
          color: white;
          padding: 20px 40px;
          border-radius: 30px;
          font-size: 28px;
          font-weight: 700;
          margin-top: 20px;
          display: inline-block;
          box-shadow: 0 10px 20px rgba(243, 156, 18, 0.3);
          text-align: center;
          width: 100%;
        }

        .footer {
          position: absolute;
          bottom: 30px;
          left: 0;
          right: 0;
          text-align: center;
        }

        .cta {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 10px;
          text-shadow: 2px 2px 6px rgba(0,0,0,0.4);
        }

        .brand {
          font-size: 20px;
          font-weight: 600;
          opacity: 0.9;
          text-shadow: 1px 1px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .brand-logo {
          width: 30px;
          height: 30px;
          object-fit: contain;
        }

        .decorative-elements {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .decorative-elements::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 400px;
          height: 400px;
          background: rgba(255,255,255,0.05);
          border-radius: 50%;
        }

        .decorative-elements::after {
          content: '';
          position: absolute;
          bottom: -30%;
          left: -10%;
          width: 300px;
          height: 300px;
          background: rgba(255,255,255,0.03);
          border-radius: 50%;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="decorative-elements"></div>

        <div class="header">
          <div class="fire-emoji">🔥</div>
          <div class="title">CHOLLO TOP</div>
          <div class="subtitle">Fantasy La Liga Pro</div>
        </div>

        <div class="main-content">
          <div class="player-card">
            <div class="player-header">
              ${playerPhoto ?
                `<img src="${playerPhoto}" class="player-photo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                 <div class="player-photo-placeholder" style="display:none;">⚽</div>` :
                `<div class="player-photo-placeholder">⚽</div>`
              }

              <div class="player-info">
                <div class="player-name">${playerData.name || 'Jugador'}</div>
                <div class="team-container">
                  ${teamLogo ?
                    `<img src="${teamLogo}" class="team-logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                     <div class="team-logo-placeholder" style="display:none;">⚽</div>` :
                    `<div class="team-logo-placeholder">⚽</div>`
                  }
                  <div class="team-name">${playerData.team?.name || 'Equipo'}</div>
                </div>
                <div class="position-badge">${playerData.position || 'POS'}</div>
              </div>
            </div>

            <div class="price-section">
              <div class="price">${bargainData.estimatedPrice || playerData.analysis?.estimatedPrice || '0.0'}M €</div>
              <div class="price-label">Precio Fantasy</div>
            </div>

            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-value">${playerData.stats?.rating || '0.0'}</div>
                <div class="stat-label">Rating</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${playerData.stats?.goals || '0'}</div>
                <div class="stat-label">Goles</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${playerData.stats?.games || '0'}</div>
                <div class="stat-label">Partidos</div>
              </div>
            </div>

            <div class="value-ratio">
              ⚡ Ratio de Valor: ${bargainData.valueRatio || playerData.analysis?.valueRatio || '1.0'}
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="cta">🎯 ¡Fíchalo antes que suba de precio!</div>
          <div class="brand">
            ${brandLogo ? `<img src="${brandLogo}" class="brand-logo" alt="Logo">` : '⚽'}
            @fantasy.laliga.pro
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  // Template HTML para análisis
  getAnalysisTemplate(analysisData) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .container {
          width: 1080px;
          height: 1080px;
          background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-family: 'Inter', sans-serif;
          color: white;
          padding: 80px;
        }

        .header {
          text-align: center;
          margin-bottom: 60px;
        }

        .icon {
          font-size: 80px;
          margin-bottom: 20px;
        }

        .title {
          font-size: 48px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 20px;
        }

        .subtitle {
          font-size: 28px;
          opacity: 0.9;
        }

        .content {
          background: rgba(255,255,255,0.1);
          border-radius: 30px;
          padding: 60px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
        }

        .section {
          margin-bottom: 40px;
        }

        .section-title {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 20px;
          color: #f1c40f;
        }

        .recommendation {
          font-size: 24px;
          margin: 15px 0;
          padding-left: 20px;
        }

        .brand {
          position: absolute;
          bottom: 40px;
          right: 40px;
          font-size: 24px;
          font-weight: 600;
          opacity: 0.8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">📊</div>
          <div class="title">Análisis Jornada</div>
          <div class="subtitle">Fantasy La Liga Pro</div>
        </div>

        <div class="content">
          <div class="section">
            <div class="section-title">💡 Recomendaciones:</div>
            <div class="recommendation">• Lewandowski capitán recomendado</div>
            <div class="recommendation">• Bellingham opción segura</div>
            <div class="recommendation">• Cuidado con rotaciones</div>
          </div>

          <div class="section">
            <div class="section-title">🔥 Partidos destacados:</div>
            <div class="recommendation">• Real Madrid vs Barcelona</div>
            <div class="recommendation">• Atlético vs Sevilla</div>
          </div>
        </div>

        <div class="brand">@fantasy.laliga.pro</div>
      </div>
    </body>
    </html>
    `;
  }

  // Template HTML para alerta
  getAlertTemplate(alertData) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .container {
          width: 1080px;
          height: 1080px;
          background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-family: 'Inter', sans-serif;
          color: white;
          padding: 80px;
        }

        .header {
          text-align: center;
          margin-bottom: 60px;
        }

        .alert-icon {
          font-size: 100px;
          margin-bottom: 20px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        .title {
          font-size: 48px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 20px;
        }

        .subtitle {
          font-size: 28px;
          opacity: 0.9;
        }

        .content {
          background: rgba(255,255,255,0.95);
          color: #2c3e50;
          border-radius: 30px;
          padding: 60px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }

        .change {
          font-size: 28px;
          margin: 20px 0;
          padding: 15px;
          border-radius: 15px;
        }

        .injured {
          background: #ffebee;
          color: #c62828;
        }

        .confirmed {
          background: #e8f5e8;
          color: #2e7d32;
        }

        .rotation {
          background: #fff3e0;
          color: #ef6c00;
        }

        .cta {
          font-size: 32px;
          font-weight: 700;
          margin-top: 30px;
          color: #e74c3c;
        }

        .brand {
          position: absolute;
          bottom: 40px;
          right: 40px;
          font-size: 24px;
          font-weight: 600;
          opacity: 0.9;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="alert-icon">🚨</div>
          <div class="title">Alerta Fantasy</div>
          <div class="subtitle">Cambios de última hora</div>
        </div>

        <div class="content">
          <div class="change injured">❌ Benzema - Lesionado</div>
          <div class="change confirmed">✅ Vinicius - Confirmado titular</div>
          <div class="change rotation">🔄 Pedri - Rotación posible</div>

          <div class="cta">⏰ ¡Ajusta tu alineación!</div>
        </div>

        <div class="brand">@fantasy.laliga.pro</div>
      </div>
    </body>
    </html>
    `;
  }


  // Limpiar imágenes antiguas
  async cleanOldImages(maxAgeHours = 24) {
    try {
      const files = await fs.readdir(this.outputPath);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.outputPath, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          logger.info('🗑️ Cleaned old image:', file);
        }
      }
    } catch (error) {
      logger.info('⚠️ Error cleaning old images:', error.message);
    }
  }
}

module.exports = new ImageGenerator();