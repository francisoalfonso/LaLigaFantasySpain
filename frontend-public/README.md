# Frontend Público - Fantasy La Liga Pro

Frontend público moderno con Next.js 14 + TypeScript + Tailwind CSS para
usuarios finales.

## 🚀 Stack Tecnológico

- **Framework**: Next.js 15.5.4
- **Lenguaje**: TypeScript 5.9.2
- **Estilos**: Tailwind CSS 4.1.13
- **React**: 19.1.1

## 📦 Estructura

```
frontend-public/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Layout principal con metadata SEO
│   │   ├── page.tsx             # Landing page
│   │   └── globals.css          # Estilos globales con dark mode
│   ├── components/              # Componentes reutilizables (próximo)
│   └── lib/
│       └── utils.ts             # Utilidades (cn helper)
├── public/                      # Assets estáticos
├── tailwind.config.ts           # Configuración Tailwind con design system
├── tsconfig.json                # Configuración TypeScript
├── next.config.js               # Configuración Next.js
└── package.json
```

## 🎨 Design System

El proyecto incluye un design system completo configurado en
`tailwind.config.ts`:

- **Colores**: Paleta completa con soporte dark mode
- **Tipografía**: Inter (sans), Cal Sans (display), JetBrains Mono (mono)
- **Espaciado**: Scale consistente
- **Radius**: Sistema de border radius

Ver documentación completa en:

- `../DESIGN_SYSTEM.md`
- `../UI_COMPONENTS.md`
- `../FRONTEND_MODERNIZATION.md`

## 🏃 Comandos

```bash
# Desarrollo (puerto 3002)
npm run dev

# Build producción
npm run build

# Iniciar producción
npm start

# Lint
npm run lint
```

## 🌐 Puertos

- **Frontend público**: http://localhost:3002
- **Backend API**: http://localhost:3000
- **Dashboard interno**: http://localhost:3000 (Alpine.js)

## 🔗 Integración con Backend

El frontend está configurado para consumir la API del backend Express en
`localhost:3000`.

Ver `next.config.js` para la configuración de rewrites de API.

## 📝 Próximos Pasos

1. ✅ Estructura básica Next.js creada
2. ✅ Tailwind + TypeScript configurados
3. ✅ Design system implementado
4. ✅ Landing page inicial
5. ⏳ Implementar componentes base (Button, Card, Badge)
6. ⏳ Añadir dark mode con next-themes
7. ⏳ Crear páginas adicionales (Blog, Estadísticas)
8. ⏳ Integrar con API backend
9. ⏳ Optimización SEO y performance

## 🎯 Objetivos

Este frontend está diseñado para:

- Escalar a millones de usuarios desde redes sociales
- Experiencia UX moderna y profesional
- Performance óptimo con SSR/SSG
- SEO optimizado para máxima visibilidad
- Dark mode nativo

---

**Fecha creación**: 30 de Septiembre de 2025 **Versión Next.js**: 15.5.4
**Puerto**: 3002
