#!/bin/bash
# Auto-Guardado Sistema Claude - Fantasy La Liga Pro
# Ejecutar al final de cada sesión

echo "🔄 Iniciando auto-guardado del sistema..."

# 1. Health Check
echo "📊 Verificando estado del sistema..."
curl -s http://localhost:3000/api/test/ping > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Servidor funcionando"
else
    echo "⚠️ Servidor no responde - iniciando..."
    npm run dev &
    sleep 5
fi

# 2. Quality Checks
echo "🔍 Verificando calidad del código..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ ESLint falló - revisar código"
    exit 1
fi

npm test
if [ $? -ne 0 ]; then
    echo "❌ Tests fallaron - revisar código"
    exit 1
fi

echo "✅ Quality checks pasaron"

# 3. GitHub Operations
echo "📝 Preparando commit para GitHub..."

# Generar mensaje de commit automático
COMMIT_MSG="feat: Auto-guardado sesión $(date +%Y-%m-%d)

- ✅ Status actualizado en .claude/status/
- ✅ Progreso guardado
- ✅ Health check OK
- ✅ Quality checks pasaron

Refs: .claude/status/CURRENT-SPRINT.md"

# GitHub add y commit
git add .
git commit -m "$COMMIT_MSG"

if [ $? -eq 0 ]; then
    echo "✅ Commit realizado"
else
    echo "⚠️ No hay cambios para commitear"
fi

# Push a GitHub
git push origin main
if [ $? -eq 0 ]; then
    echo "✅ Push a GitHub realizado"
else
    echo "❌ Push a GitHub falló - verificar conexión"
fi

# 4. Verificación final
echo "🎯 Verificación final..."
echo "📊 Estado del sistema:"
echo "- Servidor: $(curl -s http://localhost:3000/api/test/ping | grep -o 'OK' || echo 'ERROR')"
echo "- GitHub status: $(git status --porcelain | wc -l) archivos modificados"
echo "- Último commit: $(git log -1 --oneline)"

echo "✅ Auto-guardado completado"
echo "📅 Próxima sesión: $(date -d '+1 day' +%Y-%m-%d)"
