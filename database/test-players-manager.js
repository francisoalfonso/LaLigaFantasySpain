/**
 * Debug script to see what PlayersManager actually returns
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env.supabase') });

const PlayersManager = require('../backend/services/playersManager');

async function testPlayersManager() {
    console.log('🔍 Testing PlayersManager output...\n');

    const playersManager = new PlayersManager();

    try {
        const result = await playersManager.getAllPlayers();

        console.log('Result structure:');
        console.log(`- success: ${result.success}`);
        console.log(`- data length: ${result.data?.length || 0}`);
        console.log(`- cached: ${result.cached}`);
        console.log('');

        if (result.data && result.data.length > 0) {
            console.log('First player structure:');
            console.log(JSON.stringify(result.data[0], null, 2));
            console.log('');

            console.log('Checking player.name vs player.player.name:');
            const first = result.data[0];
            console.log('- player.name:', first.name);
            console.log('- player.player:', first.player);
            console.log('- player.player?.name:', first.player?.name);
            console.log('');

            console.log('First 5 players:');
            result.data.slice(0, 5).forEach((p, idx) => {
                console.log(`${idx + 1}.`, {
                    id: p.id || p.player?.id,
                    name: p.name || p.player?.name,
                    hasPlayer: !!p.player,
                    hasStatistics: !!p.statistics
                });
            });
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

testPlayersManager()
    .then(() => {
        console.log('\n✅ Test completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Fatal error:', error.message);
        process.exit(1);
    });
