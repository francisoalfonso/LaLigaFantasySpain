#!/usr/bin/env node

/**
 * Supabase Keep-Alive Script
 *
 * Genera actividad mínima en Supabase para evitar pausa por inactividad (7 días)
 * Inserta un registro temporal y lo elimina inmediatamente
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.supabase' });

const logger = {
    info: (msg, data) => console.log(`✅ ${msg}`, data ? JSON.stringify(data, null, 2) : ''),
    error: (msg, error) => console.error(`❌ ${msg}`, error?.message || error),
    warn: (msg, data) => console.warn(`⚠️  ${msg}`, data ? JSON.stringify(data, null, 2) : '')
};

async function keepAlive() {
    try {
        logger.info('🚀 Iniciando Supabase Keep-Alive...');

        // Validar variables de entorno
        if (!process.env.SUPABASE_PROJECT_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            logger.error('Variables de entorno faltantes en .env.supabase');
            logger.warn('Ejecuta: cp .env.supabase.example .env.supabase');
            process.exit(1);
        }

        // Crear cliente Supabase
        const supabase = createClient(
            process.env.SUPABASE_PROJECT_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        logger.info('📡 Conectando a Supabase...', {
            url: process.env.SUPABASE_PROJECT_URL.substring(0, 40) + '...'
        });

        // ====================================
        // PASO 1: La tabla keep_alive_pings debe existir previamente
        // ====================================
        const tableName = 'keep_alive_pings';

        logger.info('🔧 Usando tabla keep_alive_pings (debe existir previamente)...');
        logger.warn('⚠️  Si el INSERT falla, ejecuta: npm run db:init');

        // ====================================
        // PASO 2: Insertar ping temporal
        // ====================================
        const pingMessage = `Keep-alive ping at ${new Date().toISOString()}`;

        logger.info('📝 Insertando ping temporal...');

        const { data: insertData, error: insertError } = await supabase
            .from(tableName)
            .insert({ message: pingMessage })
            .select();

        if (insertError) {
            logger.error('Error insertando ping:', insertError);
            throw insertError;
        }

        const pingId = insertData[0]?.id;
        logger.info('✅ Ping insertado correctamente', {
            id: pingId,
            message: pingMessage
        });

        // ====================================
        // PASO 3: Esperar 2 segundos
        // ====================================
        logger.info('⏳ Esperando 2 segundos...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // ====================================
        // PASO 4: Eliminar ping temporal
        // ====================================
        logger.info('🗑️  Eliminando ping temporal...');

        const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .eq('id', pingId);

        if (deleteError) {
            logger.error('Error eliminando ping:', deleteError);
            throw deleteError;
        }

        logger.info('✅ Ping eliminado correctamente');

        // ====================================
        // PASO 5: Verificar conexión con SELECT simple
        // ====================================
        logger.info('🔍 Verificando conexión final...');

        const { data: countData, error: countError } = await supabase
            .from(tableName)
            .select('id', { count: 'exact', head: true });

        if (countError) {
            logger.error('Error verificando conexión:', countError);
            throw countError;
        }

        logger.info('✅ Conexión verificada correctamente');

        // ====================================
        // RESUMEN
        // ====================================
        console.log('\n');
        logger.info('🎉 Keep-Alive completado exitosamente!');
        console.log('\n📊 Resumen:');
        console.log(`   • Ping insertado: ID ${pingId}`);
        console.log(`   • Ping eliminado: ID ${pingId}`);
        console.log(`   • Conexión Supabase: OK`);
        console.log(`   • Timestamp: ${new Date().toISOString()}`);
        console.log('\n💡 Próximo keep-alive recomendado: En 5-6 días');
        console.log('\n');

        process.exit(0);

    } catch (error) {
        logger.error('\n❌ Error en Keep-Alive:', error);
        console.error('\n🔧 Troubleshooting:');
        console.error('   1. Verificar .env.supabase existe y tiene credenciales correctas');
        console.error('   2. Verificar proyecto Supabase está activo (no pausado)');
        console.error('   3. Verificar firewall/network permite conexión a Supabase');
        console.error('\n');
        process.exit(1);
    }
}

// Ejecutar keep-alive
keepAlive();
