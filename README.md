# ⚽ Fantasy La Liga Pro

## 🏆 El equipo profesional de Fantasy La Liga

Sistema automatizado de creación de contenido para Fantasy La Liga utilizando avatares AI y análisis de datos en tiempo real.

## 🎯 Descripción

Plataforma que combina datos reales de La Liga con inteligencia artificial para generar contenido automático de Fantasy Football. Diseñada para crear influencers virtuales que proporcionen análisis, predicciones y recomendaciones basadas en estadísticas actualizadas.

## 🚀 Características

- **📊 Datos Reales La Liga**: Integración con API-Sports (Plan Ultra)
- **🧮 Calculadora Fantasy**: Sistema de puntuación oficial La Liga Fantasy
- **👤 AI Influencer Ready**: Preparado para integración con HeyGen
- **⚡ Tiempo Real**: Estadísticas actualizadas de la temporada 2024-2025
- **📈 Dashboard Completo**: Validación y testing de datos
- **🔄 API Escalable**: 75,000 requests/día disponibles

## 🛠️ Tecnologías

### Backend
- **Node.js** + Express.js
- **API-Sports** (La Liga data)
- **Axios** para HTTP requests
- **Rate limiting** incluido

### Frontend
- **Alpine.js** para reactividad
- **Tailwind CSS** para estilos
- **Vanilla JavaScript**

### Datos
- **La Liga 2024-2025**: 600+ jugadores
- **20 equipos completos**
- **Estadísticas detalladas**: goles, asistencias, tarjetas, minutos
- **Información física**: altura, peso, edad, nacionalidad

## 📦 Instalación

```bash
# Clonar repositorio
git clone https://github.com/laligafantasyspainpro-ux/LaLigaFantasySpain.git
cd LaLigaFantasySpain

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu API key de API-Sports
```

## ⚙️ Configuración

Crear archivo `.env` con:

```env
# API-Sports (La Liga Real Data)
API_FOOTBALL_KEY=tu_api_key_aqui

# Servidor
NODE_ENV=development
PORT=3000
HOST=localhost
```

### Obtener API Key

1. Registrarse en [API-Sports](https://www.api-sports.io/)
2. Suscribirse al **Plan Ultra** ($29/mes)
3. Obtener API key del dashboard
4. Añadir a `.env`

## 🚦 Uso

```bash
# Modo desarrollo
npm run dev

# Acceder al dashboard
http://localhost:3000

# Producción
https://laligafantasyspain.com
```

## 📡 API Endpoints

### Información General
- `GET /api/info` - Información del sistema
- `GET /health` - Estado del servidor

### La Liga Data
- `GET /api/laliga/test` - Test conexión API-Sports
- `GET /api/laliga/laliga/info` - Información La Liga
- `GET /api/laliga/laliga/teams` - Equipos La Liga
- `GET /api/laliga/laliga/players` - Jugadores La Liga
- `GET /api/laliga/laliga/standings` - Clasificación
- `POST /api/laliga/laliga/fantasy-points` - Calcular puntos Fantasy

### Testing
- `GET /api/test/ping` - Ping servidor
- `POST /api/test/fantasy-points` - Test calculadora Fantasy

## 🧮 Sistema Fantasy Points

Implementa el sistema oficial de La Liga Fantasy:

```javascript
// Puntos base
- Participación: +2 puntos
- Gol Delantero: +4 puntos
- Gol Centrocampista: +5 puntos
- Gol Defensa/Portero: +6/10 puntos
- Asistencia: +3 puntos
- Tarjeta amarilla: -1 punto
- Tarjeta roja: -3 puntos
- Portería a cero: +4 puntos (DEF/GK)
```

## 📊 Datos Disponibles

### Jugadores (600+)
- **Información personal**: nombre, edad, nacionalidad
- **Físico**: altura, peso
- **Estadísticas**: partidos, minutos, goles, asistencias
- **Disciplina**: tarjetas amarillas/rojas
- **Rating**: puntuación por partido
- **Equipo actual**: club, logo, posición

### Ejemplos Reales
```json
{
  "player": {
    "name": "Carlos Vicente",
    "team": "Alavés",
    "position": "Attacker",
    "stats": {
      "games": 4,
      "minutes": 311,
      "goals": 1,
      "assists": 0,
      "yellow_cards": 0,
      "fantasy_points": 15
    }
  }
}
```

## 🎥 Integración HeyGen

El sistema está preparado para integrarse con HeyGen para crear avatares AI:

### Content Generation
- **Scripts automáticos** basados en datos reales
- **Análisis de jugadores** con stats actualizadas
- **Predicciones** para próxima jornada
- **Comparativas** entre jugadores/equipos
- **Tips Fantasy** personalizados

### Ejemplos de Content
```javascript
// Análisis automático
"Carlos Vicente está en racha: 1 gol en los últimos 4 partidos
jugando 311 minutos para Alavés. Su rating de 6.73 lo convierte
en una opción sólida para tu equipo Fantasy."

// Predicción
"Para la próxima jornada, recomiendo capitanear a Vicente.
Alavés juega en casa y él ha convertido 1 penalty esta temporada."
```

## 🎯 Casos de Uso

### 1. Influencer Virtual Instagram
- Posts diarios con análisis de jugadores
- Stories con predicciones
- Reels con tips Fantasy
- IGTV con análisis detallados

### 2. Canal YouTube
- Videos semanales pre-jornada
- Análisis post-partido
- Ranking de mejores fichajes
- Tutorials Fantasy

### 3. TikTok Content
- Tips rápidos (15-30s)
- Comparativas jugadores
- Predicciones express
- Datos curiosos

## 📈 Plan de Escalabilidad

### Fase 1: MVP (Actual)
- ✅ La Liga datos completos
- ✅ Sistema Fantasy Points
- ✅ API funcionando
- ✅ Dashboard validación

### Fase 2: AI Integration
- 🔄 Integración HeyGen
- 🔄 Scripts automáticos
- 🔄 Generación contenido
- 🔄 Scheduling posts

### Fase 3: Multi-Liga
- 📅 Premier League
- 📅 Champions League
- 📅 Mercado fichajes
- 📅 Análisis histórico

## 💰 Costes Operativos

### API-Sports Plan Ultra
- **Precio**: $29/mes
- **Requests**: 75,000/día
- **Cobertura**: La Liga completa
- **Soporte**: 24/7

### Comparación vs Alternativas
| Provider | Plan | Coste/mes | La Liga | Requests/día |
|----------|------|-----------|---------|--------------|
| API-Sports | Ultra | $29 | ✅ Completa | 75,000 |
| SportMonks | Pro | €39 | ❌ No disponible | ~43,000 |
| Football-API | Pro | $19 | ⚠️ Limitada | 7,500 |

## 🤝 Contribuir

1. Fork el proyecto
2. Crear branch feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Proyecto

**Fantasy La Liga Pro Team**
- GitHub: [@laligafantasyspainpro-ux](https://github.com/laligafantasyspainpro-ux)
- Email: laligafantasyspainpro@gmail.com
- Repository: [LaLigaFantasySpain](https://github.com/laligafantasyspainpro-ux/LaLigaFantasySpain)

## 🙏 Agradecimientos

- [API-Sports](https://www.api-sports.io/) por proporcionar datos de calidad
- [HeyGen](https://heygen.com/) por la tecnología de avatares AI
- Comunidad Fantasy La Liga por la inspiración

---

⭐ **Si este proyecto te ha sido útil, ¡no olvides darle una estrella!** ⭐