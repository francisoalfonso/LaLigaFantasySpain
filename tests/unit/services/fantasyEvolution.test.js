/**
 * Tests para FantasyEvolution
 * Sistema crítico que muestra evolución de valor de jugadores
 * Recientemente corregido para usar datos REALES (no ficticios)
 */

const FantasyEvolution = require('../../../backend/services/fantasyEvolution');

describe('FantasyEvolution', () => {
    let evolution;

    beforeEach(() => {
        evolution = new FantasyEvolution();
    });

    describe('Constructor', () => {
        test('debe inicializar con ApiFootballClient', () => {
            expect(evolution.apiClient).toBeDefined();
            expect(evolution.season).toBe(2025); // Temporada 2025-26
            expect(evolution.leagueId).toBe(140); // La Liga
        });
    });

    describe('calculateRealCurrentGameweek', () => {
        test('debe retornar 0 si no hay fixtures', () => {
            const fixtures = [];
            const gameweek = evolution.calculateRealCurrentGameweek(fixtures);
            expect(gameweek).toBe(0);
        });

        test('debe extraer el número de jornada del fixture', () => {
            const fixtures = [
                {
                    round: 'Regular Season - 7',
                    date: '2025-09-15'
                }
            ];
            const gameweek = evolution.calculateRealCurrentGameweek(fixtures);
            expect(gameweek).toBe(7);
        });

        test('debe usar el último fixture para determinar jornada actual', () => {
            const fixtures = [
                { round: 'Regular Season - 1', date: '2025-08-15' },
                { round: 'Regular Season - 2', date: '2025-08-22' },
                { round: 'Regular Season - 5', date: '2025-09-12' }
            ];
            const gameweek = evolution.calculateRealCurrentGameweek(fixtures);
            expect(gameweek).toBe(5);
        });
    });

    describe('calculateRealFantasyPoints', () => {
        test('debe calcular puntos base por jugar', () => {
            const stats = {
                games: { minutes: 90 },
                goals: { total: 0, assists: 0 },
                cards: { yellow: 0, red: 0 }
            };
            const points = evolution.calculateRealFantasyPoints(stats);
            expect(points).toBeGreaterThanOrEqual(2); // +2 puntos base
        });

        test('debe sumar puntos por goles', () => {
            const stats = {
                games: { minutes: 90 },
                goals: { total: 2, assists: 0 },
                cards: { yellow: 0, red: 0 }
            };
            const points = evolution.calculateRealFantasyPoints(stats);
            expect(points).toBeGreaterThanOrEqual(12); // 2 base + 10 goles
        });

        test('debe sumar puntos por asistencias', () => {
            const stats = {
                games: { minutes: 90 },
                goals: { total: 0, assists: 2 },
                cards: { yellow: 0, red: 0 }
            };
            const points = evolution.calculateRealFantasyPoints(stats);
            expect(points).toBeGreaterThanOrEqual(8); // 2 base + 6 asistencias
        });

        test('debe restar puntos por tarjetas amarillas', () => {
            const stats = {
                games: { minutes: 90 },
                goals: { total: 0, assists: 0 },
                cards: { yellow: 1, red: 0 }
            };
            const points = evolution.calculateRealFantasyPoints(stats);
            expect(points).toBe(1); // 2 base - 1 amarilla
        });

        test('debe restar puntos por tarjetas rojas', () => {
            const stats = {
                games: { minutes: 90 },
                goals: { total: 0, assists: 0 },
                cards: { yellow: 0, red: 1 }
            };
            const points = evolution.calculateRealFantasyPoints(stats);
            expect(points).toBe(0); // 2 base - 3 roja = -1, pero min 0
        });

        test('no debe dar puntos negativos', () => {
            const stats = {
                games: { minutes: 90 },
                goals: { total: 0, assists: 0 },
                cards: { yellow: 5, red: 1 }
            };
            const points = evolution.calculateRealFantasyPoints(stats);
            expect(points).toBeGreaterThanOrEqual(0);
        });
    });

    describe('normalizePosition', () => {
        test('debe normalizar Goalkeeper a GK', () => {
            expect(evolution.normalizePosition('Goalkeeper')).toBe('GK');
        });

        test('debe normalizar Defender a DEF', () => {
            expect(evolution.normalizePosition('Defender')).toBe('DEF');
        });

        test('debe normalizar Midfielder a MID', () => {
            expect(evolution.normalizePosition('Midfielder')).toBe('MID');
        });

        test('debe normalizar Attacker a FWD', () => {
            expect(evolution.normalizePosition('Attacker')).toBe('FWD');
        });

        test('debe retornar Unknown para posición inválida', () => {
            expect(evolution.normalizePosition(null)).toBe('Unknown');
            expect(evolution.normalizePosition(undefined)).toBe('Unknown');
        });
    });

    describe('calculateSummary', () => {
        test('debe retornar estructura vacía si no hay datos', () => {
            const summary = evolution.calculateSummary([]);
            expect(summary.gamesPlayed).toBe(0);
            expect(summary.totalFantasyPoints).toBe(0);
        });

        test('debe calcular estadísticas correctamente', () => {
            const evolutionData = [
                { fantasyValue: 6.5, fantasyPoints: 8, goals: 1, assists: 0 },
                { fantasyValue: 6.7, fantasyPoints: 5, goals: 0, assists: 1 },
                { fantasyValue: 6.9, fantasyPoints: 10, goals: 2, assists: 1 }
            ];
            const summary = evolution.calculateSummary(evolutionData);

            expect(summary.gamesPlayed).toBe(3);
            expect(summary.startValue).toBe(6.5);
            expect(summary.currentValue).toBe(6.9);
            expect(summary.totalFantasyPoints).toBe(23);
            expect(summary.totalGoals).toBe(3);
            expect(summary.totalAssists).toBe(2);
        });
    });

    describe('calculateTrend', () => {
        test('debe retornar insufficient_data si hay menos de 3 datos', () => {
            const evolutionData = [
                { fantasyValue: 6.5 },
                { fantasyValue: 6.7 }
            ];
            expect(evolution.calculateTrend(evolutionData)).toBe('insufficient_data');
        });

        test('debe detectar tendencia rising', () => {
            const evolutionData = [
                { fantasyValue: 6.0 },
                { fantasyValue: 6.3 },
                { fantasyValue: 6.6 }
            ];
            expect(evolution.calculateTrend(evolutionData)).toBe('rising');
        });

        test('debe detectar tendencia falling', () => {
            const evolutionData = [
                { fantasyValue: 7.0 },
                { fantasyValue: 6.7 },
                { fantasyValue: 6.4 }
            ];
            expect(evolution.calculateTrend(evolutionData)).toBe('falling');
        });

        test('debe detectar tendencia stable', () => {
            const evolutionData = [
                { fantasyValue: 6.5 },
                { fantasyValue: 6.5 },
                { fantasyValue: 6.6 }
            ];
            expect(evolution.calculateTrend(evolutionData)).toBe('stable');
        });
    });
});