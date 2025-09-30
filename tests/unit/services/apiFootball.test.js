/**
 * Tests para ApiFootballClient
 * Servicio crítico que conecta con API-Sports
 */

const ApiFootballClient = require('../../../backend/services/apiFootball');

describe('ApiFootballClient', () => {
    let client;

    beforeEach(() => {
        client = new ApiFootballClient();
    });

    describe('Constructor', () => {
        test('debe inicializar con la configuración correcta', () => {
            expect(client.baseURL).toBe('https://v3.football.api-sports.io');
            expect(client.LEAGUES.LA_LIGA).toBe(140);
            expect(client.LEAGUES.CURRENT_SEASON).toBe(2025);
            expect(client.rateLimitDelay).toBe(1000);
        });

        test('debe tener el API key configurado', () => {
            // API key puede estar en .env o no, test condicional
            if (process.env.API_FOOTBALL_KEY) {
                expect(client.apiKey).toBeDefined();
                expect(typeof client.apiKey).toBe('string');
            } else {
                expect(client.apiKey).toBeUndefined();
            }
        });
    });

    describe('Rate Limiting', () => {
        test('debe implementar waitForRateLimit', () => {
            expect(typeof client.waitForRateLimit).toBe('function');
        });

        test('debe respetar el delay entre requests', async () => {
            const startTime = Date.now();

            // Simular dos requests consecutivos
            await client.waitForRateLimit();
            client.lastRequestTime = Date.now();
            await client.waitForRateLimit();

            const elapsed = Date.now() - startTime;

            // Debe haber esperado al menos el rateLimitDelay
            expect(elapsed).toBeGreaterThanOrEqual(client.rateLimitDelay);
        }, 15000);
    });

    describe('Constantes de Liga', () => {
        test('debe tener los IDs correctos de La Liga', () => {
            expect(client.LEAGUES.LA_LIGA).toBe(140);
            expect(client.LEAGUES.CURRENT_SEASON).toBe(2025); // Temporada 2025-26
        });
    });
});