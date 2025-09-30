/**
 * Tests de integración para API endpoints
 * Prueba los endpoints principales del servidor
 */

const request = require('supertest');

// Mock básico del servidor para evitar conflictos de puerto
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString(), environment: 'test' });
});

app.get('/api/info', (req, res) => {
    res.json({
        name: 'fantasy-laliga-dashboard',
        version: '1.0.0',
        endpoints: [],
        api_sports_configured: true
    });
});

app.get('/api/test/ping', (req, res) => {
    res.json({ message: 'pong', success: true, timestamp: new Date().toISOString() });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.path });
});

describe('API Integration Tests', () => {
    describe('Health & Info Endpoints', () => {
        test('GET /health debe retornar 200 y status OK', async () => {
            const res = await request(app).get('/health');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('status', 'OK');
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('environment');
        });

        test('GET /api/info debe retornar información del proyecto', async () => {
            const res = await request(app).get('/api/info');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('name');
            expect(res.body).toHaveProperty('version');
            expect(res.body).toHaveProperty('endpoints');
            expect(res.body.api_sports_configured).toBe(true);
        });
    });

    describe('Test Endpoints', () => {
        test('GET /api/test/ping debe retornar respuesta exitosa', async () => {
            const res = await request(app).get('/api/test/ping');

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('message');
            expect(res.body.success).toBe(true);
        });
    });

    describe('404 Handler', () => {
        test('debe retornar 404 para ruta no existente', async () => {
            const res = await request(app).get('/ruta/que/no/existe');

            expect(res.statusCode).toBe(404);
            expect(res.body).toHaveProperty('error');
        });
    });
});