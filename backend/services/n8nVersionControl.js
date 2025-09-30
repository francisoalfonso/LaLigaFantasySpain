/**
 * Sistema de Control de Versiones n8n MCP vs VPS
 * Monitoriza diferencias entre versiones local (MCP) y servidor (VPS)
 * Genera alertas automáticas cuando hay desincronización
 */

const axios = require('axios');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: '.env.n8n' });

class N8nVersionControl {
    constructor() {
        // Configuración local (MCP)
        this.localApiToken = process.env.N8N_API_TOKEN;
        this.localBaseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678';

        // Configuración VPS
        this.vpsApiToken = process.env.N8N_VPS_API_TOKEN;
        this.vpsBaseUrl = process.env.N8N_VPS_BASE_URL;

        // Path para almacenar snapshots de versiones
        this.snapshotsDir = path.join(__dirname, '../../logs/n8n-versions');

        // Crear directorio si no existe
        this.initSnapshotsDir();

        logger.info('N8n Version Control System inicializado', {
            localUrl: this.localBaseUrl,
            vpsUrl: this.vpsBaseUrl || 'NO_CONFIGURADO'
        });
    }

    async initSnapshotsDir() {
        try {
            await fs.mkdir(this.snapshotsDir, { recursive: true });
        } catch (error) {
            logger.error('Error creando directorio snapshots:', error.message);
        }
    }

    /**
     * Crea un cliente axios para una instancia específica
     */
    createClient(apiToken, baseUrl) {
        if (!apiToken || !baseUrl) {
            return null;
        }

        return axios.create({
            baseURL: baseUrl,
            headers: {
                Authorization: `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
    }

    /**
     * Obtiene información de versión de una instancia n8n
     */
    async getInstanceInfo(client, instanceName) {
        try {
            // Obtener versión desde endpoint de health/info
            const response = await client.get('/api/v1/workflows');

            // n8n devuelve la versión en headers o metadata
            const version = response.headers['x-n8n-version'] || 'unknown';

            return {
                success: true,
                instance: instanceName,
                version: version,
                workflowCount: response.data.data.length,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error(`Error obteniendo info de ${instanceName}:`, error.message);
            return {
                success: false,
                instance: instanceName,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Obtiene lista de workflows con metadata
     */
    async getWorkflowsMetadata(client, instanceName) {
        try {
            const response = await client.get('/api/v1/workflows');

            const workflows = response.data.data.map((workflow) => ({
                id: workflow.id,
                name: workflow.name,
                active: workflow.active,
                nodes: workflow.nodes?.length || 0,
                connections: Object.keys(workflow.connections || {}).length,
                tags: workflow.tags || [],
                createdAt: workflow.createdAt,
                updatedAt: workflow.updatedAt,
                versionId: workflow.versionId || null
            }));

            return {
                success: true,
                instance: instanceName,
                workflows: workflows,
                count: workflows.length,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error(`Error obteniendo workflows de ${instanceName}:`, error.message);
            return {
                success: false,
                instance: instanceName,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Compara versiones entre MCP local y VPS
     */
    async compareVersions() {
        const localClient = this.createClient(this.localApiToken, this.localBaseUrl);
        const vpsClient = this.createClient(this.vpsApiToken, this.vpsBaseUrl);

        if (!localClient) {
            logger.warn('Cliente local n8n no configurado');
            return {
                success: false,
                error: 'Configuración local n8n incompleta'
            };
        }

        // Obtener info de ambas instancias
        const localInfo = await this.getInstanceInfo(localClient, 'LOCAL_MCP');
        const vpsInfo = vpsClient
            ? await this.getInstanceInfo(vpsClient, 'VPS')
            : { success: false, error: 'VPS no configurado' };

        // Obtener workflows
        const localWorkflows = await this.getWorkflowsMetadata(localClient, 'LOCAL_MCP');
        const vpsWorkflows = vpsClient
            ? await this.getWorkflowsMetadata(vpsClient, 'VPS')
            : { success: false, error: 'VPS no configurado' };

        // Analizar diferencias
        const comparison = this.analyzeDifferences(
            localInfo,
            vpsInfo,
            localWorkflows,
            vpsWorkflows
        );

        // Guardar snapshot
        await this.saveSnapshot(comparison);

        // Generar alertas si hay desincronización
        if (comparison.needsUpdate) {
            this.generateAlert(comparison);
        }

        return comparison;
    }

    /**
     * Analiza diferencias entre local y VPS
     */
    analyzeDifferences(localInfo, vpsInfo, localWorkflows, vpsWorkflows) {
        const differences = {
            timestamp: new Date().toISOString(),
            local: {
                version: localInfo.version,
                workflowCount: localWorkflows.count,
                status: localInfo.success ? 'ONLINE' : 'ERROR'
            },
            vps: {
                version: vpsInfo.version || 'NO_CONFIGURADO',
                workflowCount: vpsWorkflows.count || 0,
                status: vpsInfo.success ? 'ONLINE' : 'OFFLINE'
            },
            differences: [],
            needsUpdate: false,
            severity: 'LOW'
        };

        // Si VPS no está configurado
        if (!vpsInfo.success && vpsInfo.error === 'VPS no configurado') {
            differences.differences.push({
                type: 'VPS_NOT_CONFIGURED',
                message: 'VPS n8n no está configurado en .env.n8n',
                severity: 'HIGH'
            });
            differences.needsUpdate = true;
            differences.severity = 'HIGH';
            return differences;
        }

        // Si VPS está offline
        if (!vpsInfo.success) {
            differences.differences.push({
                type: 'VPS_OFFLINE',
                message: `VPS n8n no accesible: ${vpsInfo.error}`,
                severity: 'CRITICAL'
            });
            differences.needsUpdate = true;
            differences.severity = 'CRITICAL';
            return differences;
        }

        // Comparar versiones
        if (localInfo.version !== vpsInfo.version) {
            differences.differences.push({
                type: 'VERSION_MISMATCH',
                message: `Versión diferente: Local (${localInfo.version}) vs VPS (${vpsInfo.version})`,
                severity: 'MEDIUM',
                local: localInfo.version,
                vps: vpsInfo.version
            });
            differences.needsUpdate = true;
            differences.severity = 'MEDIUM';
        }

        // Comparar cantidad de workflows
        if (localWorkflows.count !== vpsWorkflows.count) {
            differences.differences.push({
                type: 'WORKFLOW_COUNT_MISMATCH',
                message: `Workflows diferentes: Local (${localWorkflows.count}) vs VPS (${vpsWorkflows.count})`,
                severity: 'HIGH',
                local: localWorkflows.count,
                vps: vpsWorkflows.count
            });
            differences.needsUpdate = true;
            if (differences.severity === 'LOW') {
                differences.severity = 'HIGH';
            }
        }

        // Comparar workflows individuales (por nombre)
        if (localWorkflows.success && vpsWorkflows.success) {
            const localWorkflowNames = new Set(
                localWorkflows.workflows.map((w) => w.name)
            );
            const vpsWorkflowNames = new Set(vpsWorkflows.workflows.map((w) => w.name));

            // Workflows solo en local
            const onlyInLocal = [...localWorkflowNames].filter(
                (name) => !vpsWorkflowNames.has(name)
            );
            if (onlyInLocal.length > 0) {
                differences.differences.push({
                    type: 'WORKFLOWS_ONLY_IN_LOCAL',
                    message: `${onlyInLocal.length} workflows solo en LOCAL`,
                    severity: 'MEDIUM',
                    workflows: onlyInLocal
                });
                differences.needsUpdate = true;
            }

            // Workflows solo en VPS
            const onlyInVps = [...vpsWorkflowNames].filter(
                (name) => !localWorkflowNames.has(name)
            );
            if (onlyInVps.length > 0) {
                differences.differences.push({
                    type: 'WORKFLOWS_ONLY_IN_VPS',
                    message: `${onlyInVps.length} workflows solo en VPS`,
                    severity: 'MEDIUM',
                    workflows: onlyInVps
                });
                differences.needsUpdate = true;
            }

            // Comparar updatedAt de workflows comunes
            const updatedMismatch = [];
            localWorkflows.workflows.forEach((localWf) => {
                const vpsWf = vpsWorkflows.workflows.find(
                    (w) => w.name === localWf.name
                );
                if (
                    vpsWf &&
                    new Date(localWf.updatedAt) > new Date(vpsWf.updatedAt)
                ) {
                    updatedMismatch.push({
                        name: localWf.name,
                        localUpdate: localWf.updatedAt,
                        vpsUpdate: vpsWf.updatedAt
                    });
                }
            });

            if (updatedMismatch.length > 0) {
                differences.differences.push({
                    type: 'WORKFLOWS_OUTDATED_IN_VPS',
                    message: `${updatedMismatch.length} workflows desactualizados en VPS`,
                    severity: 'HIGH',
                    workflows: updatedMismatch
                });
                differences.needsUpdate = true;
                differences.severity = 'HIGH';
            }
        }

        return differences;
    }

    /**
     * Guarda snapshot de comparación
     */
    async saveSnapshot(comparison) {
        try {
            const filename = `n8n-comparison-${new Date().toISOString().replace(/:/g, '-')}.json`;
            const filepath = path.join(this.snapshotsDir, filename);

            await fs.writeFile(filepath, JSON.stringify(comparison, null, 2));

            logger.info('Snapshot n8n guardado', { filepath, needsUpdate: comparison.needsUpdate });
        } catch (error) {
            logger.error('Error guardando snapshot:', error.message);
        }
    }

    /**
     * Genera alerta de desincronización
     */
    generateAlert(comparison) {
        const severityEmoji = {
            LOW: '🟢',
            MEDIUM: '🟡',
            HIGH: '🟠',
            CRITICAL: '🔴'
        };

        const emoji = severityEmoji[comparison.severity] || '⚠️';

        logger.warn(`${emoji} ALERTA: n8n MCP vs VPS desincronizado`, {
            severity: comparison.severity,
            differenceCount: comparison.differences.length,
            differences: comparison.differences
        });

        // Alert visual en logs
        const alertMessage = [
            '\n' + '='.repeat(80),
            `${emoji} ALERTA DE SINCRONIZACIÓN N8N - Severity: ${comparison.severity}`,
            '='.repeat(80),
            `Timestamp: ${comparison.timestamp}`,
            `Local MCP: ${comparison.local.version} (${comparison.local.workflowCount} workflows)`,
            `VPS: ${comparison.vps.version} (${comparison.vps.workflowCount} workflows)`,
            '\nDiferencias encontradas:'
        ];

        comparison.differences.forEach((diff, index) => {
            alertMessage.push(`${index + 1}. [${diff.severity}] ${diff.type}: ${diff.message}`);
        });

        alertMessage.push('\n🔧 ACCIÓN REQUERIDA: Sincronizar VPS con versión local MCP');
        alertMessage.push('='.repeat(80) + '\n');

        // Log alert con severity apropiado
        const logLevel = comparison.severity === 'CRITICAL' || comparison.severity === 'HIGH'
            ? 'error'
            : 'warn';

        logger[logLevel](alertMessage.join('\n'), {
            service: 'N8nVersionControl',
            severity: comparison.severity,
            differences: comparison.differences.length
        });
    }

    /**
     * Obtiene último snapshot guardado
     */
    async getLatestSnapshot() {
        try {
            const files = await fs.readdir(this.snapshotsDir);
            const snapshots = files
                .filter((f) => f.startsWith('n8n-comparison-'))
                .sort()
                .reverse();

            if (snapshots.length === 0) {
                return null;
            }

            const latestFile = path.join(this.snapshotsDir, snapshots[0]);
            const content = await fs.readFile(latestFile, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            logger.error('Error obteniendo último snapshot:', error.message);
            return null;
        }
    }

    /**
     * Obtiene historial de snapshots (últimos 10)
     */
    async getSnapshotHistory(limit = 10) {
        try {
            const files = await fs.readdir(this.snapshotsDir);
            const snapshots = files
                .filter((f) => f.startsWith('n8n-comparison-'))
                .sort()
                .reverse()
                .slice(0, limit);

            const history = await Promise.all(
                snapshots.map(async (file) => {
                    const filepath = path.join(this.snapshotsDir, file);
                    const content = await fs.readFile(filepath, 'utf-8');
                    return JSON.parse(content);
                })
            );

            return {
                success: true,
                count: history.length,
                snapshots: history
            };
        } catch (error) {
            logger.error('Error obteniendo historial snapshots:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = N8nVersionControl;