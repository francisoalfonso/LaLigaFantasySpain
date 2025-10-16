module.exports = {
    apps: [
        {
            name: 'fantasy-laliga-pro',
            script: './backend/server.js',
            instances: 1,
            exec_mode: 'cluster',
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
                HOST: 'localhost'
            },
            error_file: './logs/pm2-error.log',
            out_file: './logs/pm2-out.log',
            log_file: './logs/pm2-combined.log',
            time: true,
            merge_logs: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

            // Restart strategies
            min_uptime: '10s',
            max_restarts: 10,
            restart_delay: 4000,

            // Advanced features
            kill_timeout: 5000,
            listen_timeout: 3000,
            shutdown_with_message: true,

            // Environment-specific overrides
            env_development: {
                NODE_ENV: 'development',
                watch: true,
                ignore_watch: ['node_modules', 'logs', 'output', '.git']
            },

            env_staging: {
                NODE_ENV: 'staging',
                PORT: 3001
            }
        }
    ],

    deploy: {
        production: {
            user: 'www-data',
            host: '151.80.119.163',
            ref: 'origin/main',
            repo: 'git@github.com:tu-usuario/fantasy-laliga-pro.git', // ⚠️ ACTUALIZAR
            path: '/var/www/fantasy-laliga-pro',
            'post-deploy':
                'npm install --production && pm2 reload ecosystem.config.js --env production',
            'pre-deploy-local': '',
            'post-setup': 'npm install --production'
        }
    }
};
