/**
 * Servicio para calcular y gestionar la evolución del valor Fantasy de jugadores
 * Genera datos históricos basados en rendimiento y estadísticas
 */

class FantasyEvolution {
    constructor() {
        this.seasonStart = new Date('2024-08-17'); // Inicio temporada 2025-26
        this.currentGameweek = this.calculateCurrentGameweek();
    }

    /**
     * Calcular jornada actual basada en la fecha
     */
    calculateCurrentGameweek() {
        const now = new Date();
        const diffTime = Math.abs(now - this.seasonStart);
        const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
        return Math.min(Math.max(diffWeeks, 1), 38); // Entre jornada 1 y 38
    }

    /**
     * Generar evolución de valor Fantasy para un jugador
     */
    generatePlayerEvolution(player) {
        const evolution = [];
        const baseValue = this.calculateBaseValue(player);

        // Generar datos para las jornadas hasta la actual
        for (let gameweek = 1; gameweek <= this.currentGameweek; gameweek++) {
            const gameweekData = this.generateGameweekData(player, gameweek, baseValue, evolution);
            evolution.push(gameweekData);
        }

        return {
            playerId: player.id,
            playerName: player.name,
            team: player.team?.name,
            position: player.position,
            currentGameweek: this.currentGameweek,
            evolution: evolution,
            summary: this.calculateSummary(evolution),
            trend: this.calculateTrend(evolution)
        };
    }

    /**
     * Calcular valor base del jugador
     */
    calculateBaseValue(player) {
        const stats = player.stats || {};
        const games = stats.games || {};
        const goals = stats.goals || {};

        // Valor base según posición
        const positionMultiplier = {
            'Goalkeeper': 5.5,
            'Defender': 6.0,
            'Midfielder': 7.0,
            'Attacker': 8.5
        };

        const baseByPosition = positionMultiplier[player.position] || 6.5;

        // Ajustes por rendimiento
        const rating = parseFloat(games.rating) || 6.0;
        const goalBonus = (goals.total || 0) * 0.3;
        const assistBonus = (goals.assists || 0) * 0.2;

        return Math.round((baseByPosition + (rating - 6.0) + goalBonus + assistBonus) * 10) / 10;
    }

    /**
     * Generar datos para una jornada específica
     */
    generateGameweekData(player, gameweek, baseValue, previousData) {
        const prevValue = previousData.length > 0 ?
            previousData[previousData.length - 1].fantasyValue : baseValue;

        // Simular variación basada en rendimiento típico
        const variation = this.calculateVariation(player, gameweek);
        const newValue = Math.max(4.0, Math.min(15.0, prevValue + variation));

        // Calcular otros métricas
        const rating = this.simulateRating(player, gameweek);
        const fantasyPoints = this.simulateFantasyPoints(player, gameweek, rating);
        const form = this.calculateForm(previousData, fantasyPoints);

        return {
            gameweek: gameweek,
            date: this.getGameweekDate(gameweek),
            fantasyValue: Math.round(newValue * 10) / 10,
            rating: rating,
            fantasyPoints: fantasyPoints,
            form: form,
            priceChange: gameweek > 1 ?
                Math.round((newValue - prevValue) * 10) / 10 : 0,
            percentageChange: gameweek > 1 ?
                Math.round(((newValue - prevValue) / prevValue) * 100 * 10) / 10 : 0
        };
    }

    /**
     * Calcular variación de valor para una jornada
     */
    calculateVariation(player, gameweek) {
        // Variación base aleatoria
        const randomFactor = (Math.random() - 0.5) * 0.4;

        // Tendencia según rendimiento del jugador
        const performanceFactor = this.getPerformanceFactor(player);

        // Factor de jornada (algunos momentos de la temporada más volátiles)
        const gameweekFactor = this.getGameweekFactor(gameweek);

        return randomFactor + performanceFactor + gameweekFactor;
    }

    /**
     * Factor de rendimiento del jugador
     */
    getPerformanceFactor(player) {
        const stats = player.stats || {};
        const rating = parseFloat(stats.games?.rating) || 6.0;

        if (rating >= 7.5) return 0.15; // Jugadores top tienden a subir
        if (rating >= 7.0) return 0.05; // Jugadores buenos estables
        if (rating >= 6.5) return -0.05; // Jugadores normales bajan ligeramente
        return -0.15; // Jugadores malos bajan más
    }

    /**
     * Factor de volatilidad por jornada
     */
    getGameweekFactor(gameweek) {
        // Primeras jornadas más volátiles
        if (gameweek <= 5) return 0.1;
        // Mercado enero
        if (gameweek >= 20 && gameweek <= 23) return 0.15;
        // Final de temporada
        if (gameweek >= 35) return 0.2;
        return 0;
    }

    /**
     * Simular rating para una jornada
     */
    simulateRating(player, gameweek) {
        const baseRating = parseFloat(player.stats?.games?.rating) || 6.5;
        const variation = (Math.random() - 0.5) * 1.0; // Variación de ±0.5
        return Math.round((baseRating + variation) * 10) / 10;
    }

    /**
     * Simular puntos Fantasy para una jornada
     */
    simulateFantasyPoints(player, gameweek, rating) {
        const basePoints = 2; // Puntos por jugar

        // Bonus por rating
        const ratingBonus = Math.max(0, (rating - 6.0) * 2);

        // Bonus aleatorio por goles/asistencias
        const randomBonus = Math.random() > 0.7 ?
            (Math.random() > 0.5 ? 4 : 3) : 0; // 30% probabilidad de gol/asistencia

        return Math.round(basePoints + ratingBonus + randomBonus);
    }

    /**
     * Calcular forma actual (últimas 3 jornadas)
     */
    calculateForm(previousData, currentPoints) {
        const recentGames = previousData.slice(-2); // Últimas 2 + actual = 3
        const totalPoints = recentGames.reduce((sum, game) => sum + game.fantasyPoints, 0) + currentPoints;
        const avgPoints = totalPoints / (recentGames.length + 1);

        if (avgPoints >= 8) return 'excellent';
        if (avgPoints >= 6) return 'good';
        if (avgPoints >= 4) return 'average';
        return 'poor';
    }

    /**
     * Obtener fecha de jornada
     */
    getGameweekDate(gameweek) {
        const weeksSinceStart = (gameweek - 1) * 7;
        const gameDate = new Date(this.seasonStart);
        gameDate.setDate(gameDate.getDate() + weeksSinceStart);
        return gameDate.toISOString().split('T')[0];
    }

    /**
     * Calcular resumen de evolución
     */
    calculateSummary(evolution) {
        if (evolution.length === 0) return {};

        const values = evolution.map(e => e.fantasyValue);
        const points = evolution.map(e => e.fantasyPoints);

        return {
            startValue: values[0],
            currentValue: values[values.length - 1],
            maxValue: Math.max(...values),
            minValue: Math.min(...values),
            totalPriceChange: Math.round((values[values.length - 1] - values[0]) * 10) / 10,
            totalPercentChange: Math.round(((values[values.length - 1] - values[0]) / values[0]) * 100 * 10) / 10,
            averageFantasyPoints: Math.round(points.reduce((a, b) => a + b, 0) / points.length * 10) / 10,
            totalFantasyPoints: points.reduce((a, b) => a + b, 0)
        };
    }

    /**
     * Calcular tendencia actual
     */
    calculateTrend(evolution) {
        if (evolution.length < 3) return 'stable';

        const recent = evolution.slice(-3);
        const changes = recent.slice(1).map((curr, i) => curr.fantasyValue - recent[i].fantasyValue);
        const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;

        if (avgChange > 0.15) return 'rising';
        if (avgChange < -0.15) return 'falling';
        return 'stable';
    }

    /**
     * Comparar jugador con promedio de su posición
     */
    compareWithPositionAverage(playerEvolution, allPlayersData) {
        // Filtrar jugadores de la misma posición
        const samePosition = allPlayersData.filter(p => p.position === playerEvolution.position);

        if (samePosition.length === 0) return null;

        const avgValue = samePosition.reduce((sum, p) => {
            const currentValue = p.evolution[p.evolution.length - 1]?.fantasyValue || 0;
            return sum + currentValue;
        }, 0) / samePosition.length;

        const playerCurrentValue = playerEvolution.evolution[playerEvolution.evolution.length - 1]?.fantasyValue || 0;

        return {
            positionAverage: Math.round(avgValue * 10) / 10,
            playerValue: playerCurrentValue,
            difference: Math.round((playerCurrentValue - avgValue) * 10) / 10,
            percentile: this.calculatePercentile(playerCurrentValue, samePosition.map(p =>
                p.evolution[p.evolution.length - 1]?.fantasyValue || 0
            ))
        };
    }

    /**
     * Calcular percentil del jugador en su posición
     */
    calculatePercentile(playerValue, allValues) {
        const sorted = allValues.sort((a, b) => a - b);
        const rank = sorted.filter(v => v < playerValue).length;
        return Math.round((rank / sorted.length) * 100);
    }
}

module.exports = FantasyEvolution;