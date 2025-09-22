// =================================================
// TEAM LOGOS MAPPING CONFIGURATION
// =================================================
// Mapeo de equipos La Liga 2025/26 con nombres optimizados para logos

const TEAM_LOGOS_MAPPING = {
  // Real Madrid
  541: {
    api_id: 541,
    name: "Real Madrid",
    slug: "real-madrid",
    logo_filename: "541-real-madrid-logo.webp",
    alt_text: "Real Madrid CF Logo",
    seo_keywords: ["real madrid", "madrid", "merengues", "blancos"],
    folder_path: "/assets/logos/teams/"
  },

  // FC Barcelona
  529: {
    api_id: 529,
    name: "Barcelona",
    slug: "barcelona",
    logo_filename: "529-barcelona-logo.webp",
    alt_text: "FC Barcelona Logo",
    seo_keywords: ["barcelona", "barca", "blaugrana", "culés"],
    folder_path: "/assets/logos/teams/"
  },

  // Atlético Madrid
  530: {
    api_id: 530,
    name: "Atletico Madrid",
    slug: "atletico-madrid",
    logo_filename: "530-atletico-madrid-logo.webp",
    alt_text: "Atlético de Madrid Logo",
    seo_keywords: ["atletico madrid", "atleti", "colchoneros"],
    folder_path: "/assets/logos/teams/"
  },

  // Athletic Club
  531: {
    api_id: 531,
    name: "Athletic Club",
    slug: "athletic-bilbao",
    logo_filename: "531-athletic-bilbao-logo.webp",
    alt_text: "Athletic Club Bilbao Logo",
    seo_keywords: ["athletic bilbao", "athletic club", "leones"],
    folder_path: "/assets/logos/teams/"
  },

  // Valencia CF
  532: {
    api_id: 532,
    name: "Valencia",
    slug: "valencia",
    logo_filename: "532-valencia-logo.webp",
    alt_text: "Valencia CF Logo",
    seo_keywords: ["valencia", "che", "murcielagos"],
    folder_path: "/assets/logos/teams/"
  },

  // Villarreal CF
  533: {
    api_id: 533,
    name: "Villarreal",
    slug: "villarreal",
    logo_filename: "533-villarreal-logo.webp",
    alt_text: "Villarreal CF Logo",
    seo_keywords: ["villarreal", "submarino amarillo", "groguets"],
    folder_path: "/assets/logos/teams/"
  },

  // Sevilla FC
  536: {
    api_id: 536,
    name: "Sevilla",
    slug: "sevilla",
    logo_filename: "536-sevilla-logo.webp",
    alt_text: "Sevilla FC Logo",
    seo_keywords: ["sevilla", "nervionenses", "palanganas"],
    folder_path: "/assets/logos/teams/"
  },

  // Celta de Vigo
  538: {
    api_id: 538,
    name: "Celta Vigo",
    slug: "celta-vigo",
    logo_filename: "538-celta-vigo-logo.webp",
    alt_text: "RC Celta de Vigo Logo",
    seo_keywords: ["celta vigo", "celta", "olivicos"],
    folder_path: "/assets/logos/teams/"
  },

  // Levante UD
  539: {
    api_id: 539,
    name: "Levante",
    slug: "levante",
    logo_filename: "539-levante-logo.webp",
    alt_text: "Levante UD Logo",
    seo_keywords: ["levante", "granotes", "granotas"],
    folder_path: "/assets/logos/teams/"
  },

  // RCD Espanyol
  540: {
    api_id: 540,
    name: "Espanyol",
    slug: "espanyol",
    logo_filename: "540-espanyol-logo.webp",
    alt_text: "RCD Espanyol Logo",
    seo_keywords: ["espanyol", "periquitos", "blanquiazules"],
    folder_path: "/assets/logos/teams/"
  },

  // Deportivo Alavés
  542: {
    api_id: 542,
    name: "Alaves",
    slug: "alaves",
    logo_filename: "542-alaves-logo.webp",
    alt_text: "Deportivo Alavés Logo",
    seo_keywords: ["alaves", "babazorros", "mendizorrotzak"],
    folder_path: "/assets/logos/teams/"
  },

  // Real Betis
  543: {
    api_id: 543,
    name: "Real Betis",
    slug: "real-betis",
    logo_filename: "543-real-betis-logo.webp",
    alt_text: "Real Betis Balompié Logo",
    seo_keywords: ["real betis", "betis", "verdiblancos", "beticos"],
    folder_path: "/assets/logos/teams/"
  },

  // Getafe CF
  546: {
    api_id: 546,
    name: "Getafe",
    slug: "getafe",
    logo_filename: "546-getafe-logo.webp",
    alt_text: "Getafe CF Logo",
    seo_keywords: ["getafe", "azulones", "geta"],
    folder_path: "/assets/logos/teams/"
  },

  // Girona FC
  547: {
    api_id: 547,
    name: "Girona",
    slug: "girona",
    logo_filename: "547-girona-logo.webp",
    alt_text: "Girona FC Logo",
    seo_keywords: ["girona", "gironins", "blanquivermells"],
    folder_path: "/assets/logos/teams/"
  },

  // Real Sociedad
  548: {
    api_id: 548,
    name: "Real Sociedad",
    slug: "real-sociedad",
    logo_filename: "548-real-sociedad-logo.webp",
    alt_text: "Real Sociedad de Fútbol Logo",
    seo_keywords: ["real sociedad", "txuri urdin", "realistas"],
    folder_path: "/assets/logos/teams/"
  },

  // Real Oviedo
  718: {
    api_id: 718,
    name: "Oviedo",
    slug: "oviedo",
    logo_filename: "718-oviedo-logo.webp",
    alt_text: "Real Oviedo Logo",
    seo_keywords: ["oviedo", "azules", "carbayones"],
    folder_path: "/assets/logos/teams/"
  },

  // CA Osasuna
  727: {
    api_id: 727,
    name: "Osasuna",
    slug: "osasuna",
    logo_filename: "727-osasuna-logo.webp",
    alt_text: "CA Osasuna Logo",
    seo_keywords: ["osasuna", "rojillos", "navarros"],
    folder_path: "/assets/logos/teams/"
  },

  // Rayo Vallecano
  728: {
    api_id: 728,
    name: "Rayo Vallecano",
    slug: "rayo-vallecano",
    logo_filename: "728-rayo-vallecano-logo.webp",
    alt_text: "Rayo Vallecano de Madrid Logo",
    seo_keywords: ["rayo vallecano", "rayo", "franjirrojos"],
    folder_path: "/assets/logos/teams/"
  },

  // Elche CF
  797: {
    api_id: 797,
    name: "Elche",
    slug: "elche",
    logo_filename: "797-elche-logo.webp",
    alt_text: "Elche CF Logo",
    seo_keywords: ["elche", "franjiverdes", "ilicitanos"],
    folder_path: "/assets/logos/teams/"
  },

  // RCD Mallorca
  798: {
    api_id: 798,
    name: "Mallorca",
    slug: "mallorca",
    logo_filename: "798-mallorca-logo.webp",
    alt_text: "RCD Mallorca Logo",
    seo_keywords: ["mallorca", "bermellones", "mallorquinistas"],
    folder_path: "/assets/logos/teams/"
  }
};

// Utilidades para manejo de logos
const LOGO_UTILS = {
  // Obtener logo por ID de equipo
  getLogoByTeamId: (teamId) => {
    return TEAM_LOGOS_MAPPING[teamId] || null;
  },

  // Obtener URL completa del logo
  getLogoUrl: (teamId, baseUrl = '') => {
    const teamLogo = TEAM_LOGOS_MAPPING[teamId];
    if (!teamLogo) return null;

    return `${baseUrl}${teamLogo.folder_path}${teamLogo.logo_filename}`;
  },

  // Obtener alt text optimizado para SEO
  getAltText: (teamId) => {
    const teamLogo = TEAM_LOGOS_MAPPING[teamId];
    return teamLogo ? teamLogo.alt_text : 'Logo del equipo';
  },

  // Obtener keywords para SEO
  getKeywords: (teamId) => {
    const teamLogo = TEAM_LOGOS_MAPPING[teamId];
    return teamLogo ? teamLogo.seo_keywords : [];
  },

  // Generar diferentes tamaños
  getResponsiveLogos: (teamId, sizes = ['sm', 'md', 'lg']) => {
    const teamLogo = TEAM_LOGOS_MAPPING[teamId];
    if (!teamLogo) return {};

    const responsiveLogos = {};
    sizes.forEach(size => {
      const filename = teamLogo.logo_filename.replace('.webp', `-${size}.webp`);
      responsiveLogos[size] = `${teamLogo.folder_path}${filename}`;
    });

    return responsiveLogos;
  },

  // Lista todos los equipos con sus logos
  getAllTeamsLogos: () => {
    return Object.values(TEAM_LOGOS_MAPPING);
  }
};

module.exports = {
  TEAM_LOGOS_MAPPING,
  LOGO_UTILS
};