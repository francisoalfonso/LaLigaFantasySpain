# 🔒 Configuración Segura de Credenciales

## 📋 Guía Paso a Paso (No-Developer Friendly)

### 1. 🔑 Archivo .env (YA CREADO)

Tu archivo `.env` está configurado para guardar todas las credenciales de forma segura:

```env
# GitHub Token
GITHUB_PERSONAL_ACCESS_TOKEN=tu_token_aqui

# HeyGen API Key
HEYGEN_API_KEY=tu_api_key_aqui

# Otras configuraciones...
```

### 2. 🚀 Cómo añadir tu GitHub Token de forma SEGURA

#### Paso A: Crear nuevo token
1. Ve a: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Nombre: `LaLigaFantasySpain-Local`
4. Permisos:
   - ✅ `repo` (todos los sub-permisos)
   - ✅ `workflow`
5. Click "Generate token"
6. **COPIA el token inmediatamente**

#### Paso B: Guardarlo de forma segura
1. Abre el archivo `.env` (en la carpeta del proyecto)
2. Busca la línea: `GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token_here`
3. Reemplaza `your_github_token_here` con tu token real
4. Guarda el archivo
5. **NUNCA compartas este archivo en chats**

### 3. 🎬 Para HeyGen (Futuro)

Cuando tengas tu HeyGen API key:
1. Abre `.env`
2. Busca: `HEYGEN_API_KEY=your_heygen_api_key_here`
3. Reemplaza con tu API key real
4. Guarda

## ✅ Verificación de Seguridad

### Archivos SEGUROS (no se suben a GitHub):
- ✅ `.env` - Tu archivo con credenciales reales
- ✅ `node_modules/` - Dependencias
- ✅ `*.log` - Archivos de log

### Archivos que SÍ se suben:
- ✅ `.env.example` - Template sin credenciales
- ✅ `SECURITY-SETUP.md` - Esta guía
- ✅ Todo el código del proyecto

## 🔧 Uso de las Credenciales

Una vez configurado el `.env`, el proyecto automáticamente:
- Lee las credenciales de forma segura
- Las usa para GitHub API
- Las usa para HeyGen API
- Nunca las expone en el código

## 🚨 Reglas de Oro

1. **NUNCA** compartas el archivo `.env` en chats
2. **NUNCA** subas `.env` a GitHub (ya está en .gitignore)
3. **SÍ** usa `.env.example` como referencia
4. **SÍ** renueva tokens periódicamente

## 📞 Si necesitas ayuda

- Abre el archivo `.env` y verifica que las variables estén correctas
- Usa `.env.example` como referencia
- Las credenciales son solo para uso local, nunca se comparten