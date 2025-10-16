#!/bin/bash

# validate-dns.sh
# Verifica que el DNS esté correctamente configurado y propagado

VPS_IP="151.80.119.163"
DOMAIN="laligafantasyspain.com"

echo "🔍 Verificando configuración DNS..."
echo ""

echo "1️⃣ Verificando dominio principal: $DOMAIN"
MAIN_IP=$(dig +short $DOMAIN | tail -n1)
if [ "$MAIN_IP" = "$VPS_IP" ]; then
    echo "   ✅ $DOMAIN → $VPS_IP"
else
    echo "   ❌ $DOMAIN → ${MAIN_IP:-NO_RESUELVE} (esperado: $VPS_IP)"
    echo "   ⏳ DNS aún no propagado. Espera 5-30 minutos."
fi

echo ""
echo "2️⃣ Verificando www.$DOMAIN"
WWW_IP=$(dig +short www.$DOMAIN | tail -n1)
if [ "$WWW_IP" = "$VPS_IP" ]; then
    echo "   ✅ www.$DOMAIN → $VPS_IP"
else
    echo "   ❌ www.$DOMAIN → ${WWW_IP:-NO_RESUELVE} (esperado: $VPS_IP)"
    echo "   ⏳ DNS aún no propagado. Espera 5-30 minutos."
fi

echo ""

# Resumen
if [ "$MAIN_IP" = "$VPS_IP" ] && [ "$WWW_IP" = "$VPS_IP" ]; then
    echo "🎉 DNS CORRECTAMENTE PROPAGADO"
    echo ""
    echo "✅ Siguiente paso: Generar SSH key en VPS"
    echo "   ssh root@151.80.119.163"
    echo "   ssh-keygen -t ed25519 -C \"vps-ovh-fantasy\""
else
    echo "⏳ DNS AÚN NO PROPAGADO"
    echo ""
    echo "⏱️  Espera 5-30 minutos y ejecuta de nuevo:"
    echo "   ./deploy/validate-dns.sh"
fi
