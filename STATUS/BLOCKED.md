# 🚫 Funcionalidades Bloqueadas

**Última actualización**: 4 Octubre 2025, 11:00h

---

## ⚠️ BLOQUEADORES ACTIVOS

### 1. ContentDrips API Key - Carruseles Instagram

**Afecta**: Instagram Automatización Carruseles (Martes)
**Severity**: ALTA
**Started**: 1 Oct 2025
**Owner**: Usuario

#### Descripción

El workflow de carruseles Instagram (Martes 10AM) requiere ContentDrips API key para funcionar.

#### Impacto

- ❌ No se pueden publicar carruseles automáticamente
- ❌ Workflow n8n Martes sin API key
- ⚠️ Afecta 20% del contenido Instagram (carruseles)

#### Acción Requerida

**Usuario debe**:
1. Registrarse en ContentDrips: https://contentdrips.com
2. Elegir plan Starter ($39/mes) - 1000 API calls
3. Obtener API key del dashboard
4. Proveer API key a Claude Code

#### Alternativas

**Opción A (Recomendada)**: Esperar API key ContentDrips
- Mejor herramienta para carruseles
- Integración nativa n8n
- $39/mes razonable

**Opción B**: Usar otra herramienta
- Bannerbear ($49/mes)
- Placid ($59/mes)
- Custom solution (más trabajo)

#### Workaround Temporal

Mientras se obtiene API key:
- Publicar solo Reels Ana (Lunes, Miércoles, Jueves, Viernes, Domingo)
- Carruseles manuales temporalmente
- No afecta funcionalidad core

#### Próximo Paso

Esperar que usuario provea API key.

---

## 🔓 BLOQUEADORES RESUELTOS RECIENTEMENTE

### n8n Instance URL (Resuelto - No necesario)

**Afectaba**: Workflows con webhooks
**Severity**: BAJA
**Resolved**: 4 Oct 2025

#### Solución

Usar schedule triggers en lugar de webhooks para automatización.

**Antes**:
- Webhooks requerían URL instance n8n
- Complicaba deployment

**Después**:
- Schedule triggers (`cron` expressions)
- No requieren configuración externa
- Más simples y confiables

---

## 📊 Estadísticas Bloqueadores

### Actuales

- **Total bloqueadores**: 1
- **Severity ALTA**: 1
- **Severity MEDIA**: 0
- **Severity BAJA**: 0

### Histórico (Últimos 30 días)

- **Total bloqueadores encontrados**: 8
- **Resueltos**: 7 (87.5%)
- **Activos**: 1 (12.5%)
- **Tiempo promedio resolución**: 1.5 días

---

## 🎯 Prevención de Bloqueadores

### Lecciones Aprendidas

1. **API keys early** - Identificar dependencias API temprano
2. **Fallback plans** - Siempre tener plan B
3. **Communication** - Clarificar qué necesita usuario proveer
4. **Documentation** - Documentar requirements claramente

### Dependencias Externas Futuras

#### YouTube Shorts (Próximo mes)
- OAuth2 Google requerido
- **Acción**: Configurar temprano con usuario

#### Instagram Graph API (Próximo mes)
- Meta Business Account requerido
- Meta Access Token requerido
- **Acción**: Setup con usuario anticipadamente

---

**Mantenido por**: Claude Code
**Actualizar**: Al encontrar o resolver bloqueadores
**Propósito**: Visibilidad de impedimentos y seguimiento
