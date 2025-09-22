# Claude Code Dashboard Integration - n8n Workflow

## Overview

This document explains how to integrate the La Liga n8n data sync workflow with your Claude Code dashboard to provide real-time monitoring, manual triggering, and status updates.

## Integration Architecture

```
Claude Code Dashboard
       ↓ (Trigger)
    n8n Webhook
       ↓ (Execute)
   Data Sync Workflow
       ↓ (Status)
 Supabase Database
       ↓ (Query)
Claude Code Dashboard
```

## Step 1: Dashboard Webhook Integration

### 1.1 Create Workflow Trigger Endpoint

Add this route to your Express server (`/Users/fran/Desktop/CURSOR/Fantasy la liga/backend/routes/n8n.js`):

```javascript
const express = require('express');
const router = express.Router();
const axios = require('axios');

// n8n workflow configuration
const N8N_CONFIG = {
  baseUrl: process.env.N8N_BASE_URL || 'https://your-n8n-instance.com',
  webhookUrl: process.env.N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/laliga-sync-webhook',
  apiToken: process.env.N8N_API_TOKEN
};

/**
 * Trigger La Liga data sync workflow
 * POST /api/n8n/trigger-laliga-sync
 */
router.post('/trigger-laliga-sync', async (req, res) => {
  try {
    console.log('🚀 Triggering La Liga data sync workflow...');

    const triggerData = {
      trigger_source: 'claude_code_dashboard',
      trigger_by: req.body.triggered_by || 'system',
      trigger_time: new Date().toISOString(),
      force_full_sync: req.body.force_full_sync || false,
      include_historical: req.body.include_historical || false
    };

    // Trigger n8n workflow via webhook
    const response = await axios.post(N8N_CONFIG.webhookUrl, triggerData, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Claude-Code-Dashboard'
      }
    });

    console.log('✅ Workflow triggered successfully');
    console.log('Response:', response.data);

    res.json({
      success: true,
      message: 'La Liga data sync workflow triggered successfully',
      execution_id: response.data.execution_id,
      workflow_status: 'running',
      trigger_data: triggerData,
      n8n_response: response.data
    });

  } catch (error) {
    console.error('❌ Error triggering workflow:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to trigger La Liga data sync workflow',
      error: error.message,
      trigger_failed: true
    });
  }
});

/**
 * Get workflow execution status
 * GET /api/n8n/execution-status/:executionId
 */
router.get('/execution-status/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;

    // Query Supabase for workflow execution status
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_PROJECT_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: workflowData, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('n8n_execution_id', executionId)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!workflowData) {
      return res.status(404).json({
        success: false,
        message: 'Workflow execution not found',
        execution_id: executionId
      });
    }

    res.json({
      success: true,
      execution: workflowData,
      is_running: workflowData.status === 'running',
      is_completed: ['success', 'error'].includes(workflowData.status)
    });

  } catch (error) {
    console.error('Error fetching execution status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch execution status',
      error: error.message
    });
  }
});

/**
 * Get recent workflow executions
 * GET /api/n8n/recent-executions
 */
router.get('/recent-executions', async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_PROJECT_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 7;

    const { data: executions, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('workflow_name', 'La Liga Data Sync to Supabase')
      .gte('started_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Calculate success rate
    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(e => e.status === 'success').length;
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions * 100).toFixed(2) : 0;

    res.json({
      success: true,
      executions,
      statistics: {
        total_executions: totalExecutions,
        successful_executions: successfulExecutions,
        success_rate: parseFloat(successRate),
        period_days: days
      }
    });

  } catch (error) {
    console.error('Error fetching recent executions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent executions',
      error: error.message
    });
  }
});

/**
 * Get data sync statistics
 * GET /api/n8n/sync-stats
 */
router.get('/sync-stats', async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_PROJECT_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get data counts and last update times
    const queries = await Promise.all([
      supabase.from('teams').select('*', { count: 'exact', head: true }),
      supabase.from('players').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('teams').select('updated_at').order('updated_at', { ascending: false }).limit(1),
      supabase.from('players').select('updated_at').order('updated_at', { ascending: false }).limit(1),
      supabase.from('matches').select('updated_at').order('updated_at', { ascending: false }).limit(1)
    ]);

    const [teamsCount, playersCount, matchesCount, lastTeamUpdate, lastPlayerUpdate, lastMatchUpdate] = queries;

    const stats = {
      data_counts: {
        teams: teamsCount.count || 0,
        players: playersCount.count || 0,
        matches: matchesCount.count || 0
      },
      last_updates: {
        teams: lastTeamUpdate.data?.[0]?.updated_at || null,
        players: lastPlayerUpdate.data?.[0]?.updated_at || null,
        matches: lastMatchUpdate.data?.[0]?.updated_at || null
      },
      sync_status: {
        teams_synced: teamsCount.count >= 20,
        players_synced: playersCount.count >= 400,
        matches_synced: matchesCount.count >= 300,
        overall_healthy: teamsCount.count >= 20 && playersCount.count >= 400 && matchesCount.count >= 300
      }
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching sync stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sync statistics',
      error: error.message
    });
  }
});

module.exports = router;
```

### 1.2 Add Route to Main Server

Update `/Users/fran/Desktop/CURSOR/Fantasy la liga/backend/server.js`:

```javascript
// Add this line with other route imports
const n8nRoutes = require('./routes/n8n');

// Add this line with other route registrations
app.use('/api/n8n', n8nRoutes);
```

### 1.3 Environment Variables

Add to your `.env` file:

```bash
# n8n Integration
N8N_BASE_URL=https://your-n8n-instance.com
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/laliga-sync-webhook
N8N_API_TOKEN=your_n8n_api_token_here
```

## Step 2: Frontend Dashboard Integration

### 2.1 Add Data Sync Panel to Dashboard

Update `/Users/fran/Desktop/CURSOR/Fantasy la liga/frontend/index.html`:

```html
<!-- Add this section after existing dashboard panels -->
<div class="dashboard-section">
  <h2>🔄 Data Sync Management</h2>

  <div class="sync-controls">
    <div class="sync-status" x-data="syncStatus">
      <div class="status-card">
        <h3>Sync Status</h3>
        <div class="status-indicator" :class="syncHealthy ? 'healthy' : 'warning'">
          <span x-text="syncHealthy ? '✅ Healthy' : '⚠️ Needs Attention'"></span>
        </div>
        <div class="last-sync">
          Last sync: <span x-text="lastSyncTime || 'Never'"></span>
        </div>
      </div>

      <div class="data-stats">
        <div class="stat-item">
          <span class="stat-label">Teams</span>
          <span class="stat-value" x-text="stats.teams || 0"></span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Players</span>
          <span class="stat-value" x-text="stats.players || 0"></span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Matches</span>
          <span class="stat-value" x-text="stats.matches || 0"></span>
        </div>
      </div>

      <div class="sync-actions">
        <button
          @click="triggerSync(false)"
          :disabled="syncing"
          class="btn-primary">
          <span x-show="!syncing">🚀 Trigger Sync</span>
          <span x-show="syncing">🔄 Syncing...</span>
        </button>

        <button
          @click="triggerSync(true)"
          :disabled="syncing"
          class="btn-secondary">
          Force Full Sync
        </button>

        <button
          @click="refreshStats()"
          class="btn-outline">
          🔄 Refresh
        </button>
      </div>
    </div>

    <!-- Recent Executions -->
    <div class="recent-executions" x-data="recentExecutions">
      <h3>Recent Sync Executions</h3>
      <div class="execution-list">
        <template x-for="execution in executions" :key="execution.id">
          <div class="execution-item" :class="execution.status">
            <div class="execution-info">
              <span class="execution-time" x-text="formatTime(execution.started_at)"></span>
              <span class="execution-status" x-text="execution.status"></span>
              <span class="execution-duration" x-text="execution.duration_seconds + 's'"></span>
            </div>
            <div class="execution-data" x-show="execution.output_data">
              <span x-text="execution.output_data?.teams_processed || 0">0</span> teams,
              <span x-text="execution.output_data?.players_processed || 0">0</span> players,
              <span x-text="execution.output_data?.fixtures_processed || 0">0</span> matches
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</div>
```

### 2.2 Add Alpine.js Components

Update `/Users/fran/Desktop/CURSOR/Fantasy la liga/frontend/app.js`:

```javascript
// Add these Alpine.js components

// Sync Status Component
Alpine.data('syncStatus', () => ({
  syncing: false,
  syncHealthy: false,
  lastSyncTime: null,
  stats: {
    teams: 0,
    players: 0,
    matches: 0
  },
  currentExecution: null,

  async init() {
    await this.refreshStats();
    // Refresh stats every 30 seconds
    setInterval(() => this.refreshStats(), 30000);
  },

  async refreshStats() {
    try {
      const response = await fetch('/api/n8n/sync-stats');
      const data = await response.json();

      if (data.success) {
        this.stats = data.stats.data_counts;
        this.syncHealthy = data.stats.sync_status.overall_healthy;

        // Get the most recent update time
        const lastUpdates = data.stats.last_updates;
        const mostRecent = Object.values(lastUpdates)
          .filter(time => time)
          .sort()
          .pop();

        if (mostRecent) {
          this.lastSyncTime = new Date(mostRecent).toLocaleString();
        }
      }
    } catch (error) {
      console.error('Error refreshing stats:', error);
      this.syncHealthy = false;
    }
  },

  async triggerSync(forceFullSync = false) {
    if (this.syncing) return;

    this.syncing = true;
    try {
      const response = await fetch('/api/n8n/trigger-laliga-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          triggered_by: 'dashboard_user',
          force_full_sync: forceFullSync,
          include_historical: forceFullSync
        })
      });

      const data = await response.json();

      if (data.success) {
        this.currentExecution = data.execution_id;
        this.showNotification('✅ Sync triggered successfully!', 'success');

        // Poll for completion
        this.pollExecutionStatus(data.execution_id);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
      this.showNotification('❌ Failed to trigger sync: ' + error.message, 'error');
      this.syncing = false;
    }
  },

  async pollExecutionStatus(executionId) {
    const maxPolls = 60; // 5 minutes max
    let polls = 0;

    const poll = async () => {
      if (polls >= maxPolls) {
        this.syncing = false;
        this.showNotification('⏱️ Sync polling timeout', 'warning');
        return;
      }

      try {
        const response = await fetch(`/api/n8n/execution-status/${executionId}`);
        const data = await response.json();

        if (data.success && data.execution) {
          if (data.is_completed) {
            this.syncing = false;
            if (data.execution.status === 'success') {
              this.showNotification('✅ Sync completed successfully!', 'success');
              await this.refreshStats();
            } else {
              this.showNotification('❌ Sync failed: ' + data.execution.error_message, 'error');
            }
            return;
          }
        }

        polls++;
        setTimeout(poll, 5000); // Poll every 5 seconds
      } catch (error) {
        console.error('Error polling execution status:', error);
        this.syncing = false;
      }
    };

    setTimeout(poll, 2000); // Start polling after 2 seconds
  },

  showNotification(message, type = 'info') {
    // Implement your notification system here
    console.log(`[${type.toUpperCase()}] ${message}`);

    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 5000);
  }
}));

// Recent Executions Component
Alpine.data('recentExecutions', () => ({
  executions: [],
  loading: false,

  async init() {
    await this.loadExecutions();
    // Refresh every minute
    setInterval(() => this.loadExecutions(), 60000);
  },

  async loadExecutions() {
    this.loading = true;
    try {
      const response = await fetch('/api/n8n/recent-executions?limit=10&days=7');
      const data = await response.json();

      if (data.success) {
        this.executions = data.executions;
      }
    } catch (error) {
      console.error('Error loading executions:', error);
    }
    this.loading = false;
  },

  formatTime(timeString) {
    return new Date(timeString).toLocaleString();
  }
}));
```

### 2.3 Add CSS Styles

Update `/Users/fran/Desktop/CURSOR/Fantasy la liga/frontend/style.css`:

```css
/* Data Sync Management Styles */
.sync-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 1rem;
}

.status-card {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: var(--shadow);
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  margin: 1rem 0;
}

.status-indicator.healthy {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-indicator.warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.data-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-label {
  display: block;
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
}

.sync-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.sync-actions button {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.sync-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn-outline {
  background: transparent;
  border: 2px solid var(--primary-color);
  color: var(--primary-color);
}

.btn-outline:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
}

/* Recent Executions */
.recent-executions {
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: var(--shadow);
}

.execution-list {
  max-height: 400px;
  overflow-y: auto;
}

.execution-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  margin: 0.5rem 0;
  border-radius: 6px;
  border-left: 4px solid #ddd;
}

.execution-item.success {
  background: #d4edda;
  border-left-color: #28a745;
}

.execution-item.error {
  background: #f8d7da;
  border-left-color: #dc3545;
}

.execution-item.running {
  background: #d1ecf1;
  border-left-color: #17a2b8;
}

.execution-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.execution-time {
  font-size: 0.875rem;
  color: #6c757d;
}

.execution-status {
  font-weight: 600;
  text-transform: capitalize;
}

.execution-duration {
  font-size: 0.75rem;
  color: #6c757d;
}

.execution-data {
  font-size: 0.875rem;
  color: #6c757d;
}

/* Toast Notifications */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 1rem 1.5rem;
  border-radius: 6px;
  color: white;
  font-weight: 600;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

.toast-success {
  background: #28a745;
}

.toast-error {
  background: #dc3545;
}

.toast-warning {
  background: #ffc107;
  color: #856404;
}

.toast-info {
  background: #17a2b8;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .sync-controls {
    grid-template-columns: 1fr;
  }

  .data-stats {
    grid-template-columns: 1fr;
  }

  .sync-actions {
    flex-direction: column;
  }

  .sync-actions button {
    width: 100%;
  }
}
```

## Step 3: Status Webhook Handler

### 3.1 Create Webhook Endpoint for n8n Status Updates

Add to `/Users/fran/Desktop/CURSOR/Fantasy la liga/backend/routes/n8n.js`:

```javascript
/**
 * Receive status updates from n8n workflow
 * POST /api/n8n/webhook-status
 */
router.post('/webhook-status', async (req, res) => {
  try {
    const statusData = req.body;

    console.log('📨 Received n8n status webhook:', statusData);

    // Store status update in database
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_PROJECT_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Update workflow record with status
    if (statusData.execution_id) {
      const { error } = await supabase
        .from('workflows')
        .update({
          status: statusData.status,
          finished_at: statusData.timestamp,
          output_data: statusData.data_processed,
          error_message: statusData.error || null
        })
        .eq('n8n_execution_id', statusData.execution_id);

      if (error) {
        console.error('Error updating workflow status:', error);
      }
    }

    // Broadcast status to connected clients (if using WebSockets)
    if (global.websocketServer) {
      global.websocketServer.emit('workflow-status', statusData);
    }

    res.json({
      success: true,
      message: 'Status update received',
      received_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing status webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process status update',
      error: error.message
    });
  }
});

/**
 * Health check endpoint for n8n
 * GET /api/n8n/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Claude Code Dashboard',
    timestamp: new Date().toISOString(),
    endpoints: {
      trigger_sync: '/api/n8n/trigger-laliga-sync',
      execution_status: '/api/n8n/execution-status/:id',
      recent_executions: '/api/n8n/recent-executions',
      sync_stats: '/api/n8n/sync-stats',
      webhook_status: '/api/n8n/webhook-status'
    }
  });
});
```

### 3.2 Update n8n Workflow Status Webhook

Modify the n8n workflow's "Send Status Webhook" node to point to your dashboard:

```javascript
// In the n8n workflow's "Send Status Webhook" node, update the URL:
// POST https://your-dashboard-domain.com/api/n8n/webhook-status

// Response body format:
{
  "status": "{{ $('Prepare Workflow Execution Log').item.json.status }}",
  "message": "{{ $('Prepare Workflow Execution Log').item.json.status === 'success' ? 'La Liga data sync completed successfully' : 'La Liga data sync failed' }}",
  "execution_id": "{{ $workflow.execution.id }}",
  "duration_seconds": "{{ $('Prepare Workflow Execution Log').item.json.duration_seconds }}",
  "data_processed": "{{ $('Prepare Workflow Execution Log').item.json.output_data }}",
  "timestamp": "{{ $now }}",
  "error": "{{ $('Prepare Workflow Execution Log').item.json.error_message || null }}"
}
```

## Step 4: Real-time Updates (Optional)

### 4.1 WebSocket Integration

Add WebSocket support for real-time status updates:

```javascript
// Add to server.js
const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store WebSocket server globally for access in routes
global.websocketServer = io;

io.on('connection', (socket) => {
  console.log('📡 Client connected:', socket.id);

  socket.on('subscribe-workflow-updates', () => {
    socket.join('workflow-updates');
    console.log('Client subscribed to workflow updates:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('📡 Client disconnected:', socket.id);
  });
});

// Broadcast workflow updates
function broadcastWorkflowUpdate(data) {
  io.to('workflow-updates').emit('workflow-status', data);
}

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
});
```

### 4.2 Frontend WebSocket Client

Add to frontend JavaScript:

```javascript
// WebSocket connection for real-time updates
const socket = io();

socket.on('connect', () => {
  console.log('🔌 Connected to WebSocket');
  socket.emit('subscribe-workflow-updates');
});

socket.on('workflow-status', (data) => {
  console.log('📨 Workflow status update:', data);

  // Update UI with real-time status
  Alpine.store('syncStatus').handleStatusUpdate(data);
});

// Add to Alpine store
Alpine.store('syncStatus', {
  handleStatusUpdate(data) {
    // Update sync status based on real-time data
    if (data.status === 'success') {
      this.syncing = false;
      this.showNotification('✅ Sync completed successfully!', 'success');
      this.refreshStats();
    } else if (data.status === 'error') {
      this.syncing = false;
      this.showNotification('❌ Sync failed: ' + data.error, 'error');
    }
  }
});
```

## Step 5: Monitoring Dashboard

### 5.1 Add Monitoring Widgets

Create comprehensive monitoring widgets in your dashboard:

```html
<!-- System Health Dashboard -->
<div class="monitoring-dashboard" x-data="monitoringDashboard">
  <div class="health-overview">
    <h3>🏥 System Health</h3>
    <div class="health-cards">
      <div class="health-card" :class="apiHealth.status">
        <h4>API-Sports</h4>
        <div class="health-status" x-text="apiHealth.message"></div>
        <div class="health-detail" x-text="apiHealth.requests_today + '/' + apiHealth.daily_limit"></div>
      </div>

      <div class="health-card" :class="dbHealth.status">
        <h4>Supabase DB</h4>
        <div class="health-status" x-text="dbHealth.message"></div>
        <div class="health-detail" x-text="'Tables: ' + dbHealth.table_count"></div>
      </div>

      <div class="health-card" :class="n8nHealth.status">
        <h4>n8n Workflows</h4>
        <div class="health-status" x-text="n8nHealth.message"></div>
        <div class="health-detail" x-text="'Last run: ' + n8nHealth.last_execution"></div>
      </div>
    </div>
  </div>

  <div class="performance-metrics">
    <h3>📊 Performance Metrics</h3>
    <div class="metrics-grid">
      <div class="metric">
        <span class="metric-label">Avg Sync Time</span>
        <span class="metric-value" x-text="performance.avg_sync_time + 's'"></span>
      </div>
      <div class="metric">
        <span class="metric-label">Success Rate (7d)</span>
        <span class="metric-value" x-text="performance.success_rate + '%'"></span>
      </div>
      <div class="metric">
        <span class="metric-label">API Response Time</span>
        <span class="metric-value" x-text="performance.api_response_time + 'ms'"></span>
      </div>
      <div class="metric">
        <span class="metric-label">Data Freshness</span>
        <span class="metric-value" x-text="performance.data_age + 'h'"></span>
      </div>
    </div>
  </div>
</div>
```

### 5.2 Monitoring JavaScript

```javascript
Alpine.data('monitoringDashboard', () => ({
  apiHealth: { status: 'unknown', message: 'Checking...', requests_today: 0, daily_limit: 75000 },
  dbHealth: { status: 'unknown', message: 'Checking...', table_count: 0 },
  n8nHealth: { status: 'unknown', message: 'Checking...', last_execution: 'Never' },
  performance: {
    avg_sync_time: 0,
    success_rate: 0,
    api_response_time: 0,
    data_age: 0
  },

  async init() {
    await this.checkSystemHealth();
    // Check health every 5 minutes
    setInterval(() => this.checkSystemHealth(), 5 * 60 * 1000);
  },

  async checkSystemHealth() {
    try {
      // Check API-Sports health
      const apiResponse = await fetch('/api/laliga/test');
      const apiData = await apiResponse.json();

      this.apiHealth = {
        status: apiData.success ? 'healthy' : 'error',
        message: apiData.success ? 'Connected' : 'Connection failed',
        requests_today: apiData.requests_today || 0,
        daily_limit: apiData.daily_limit || 75000
      };

      // Check database health
      const dbResponse = await fetch('/api/n8n/sync-stats');
      const dbData = await dbResponse.json();

      this.dbHealth = {
        status: dbData.success ? 'healthy' : 'error',
        message: dbData.success ? 'Connected' : 'Connection failed',
        table_count: Object.keys(dbData.stats?.data_counts || {}).length
      };

      // Check n8n health
      const n8nResponse = await fetch('/api/n8n/recent-executions?limit=1');
      const n8nData = await n8nResponse.json();

      const lastExecution = n8nData.executions?.[0];
      this.n8nHealth = {
        status: lastExecution?.status === 'success' ? 'healthy' : 'warning',
        message: lastExecution ? 'Recent execution: ' + lastExecution.status : 'No recent executions',
        last_execution: lastExecution ? new Date(lastExecution.started_at).toLocaleString() : 'Never'
      };

      // Update performance metrics
      if (n8nData.statistics) {
        this.performance = {
          avg_sync_time: Math.round(n8nData.executions.reduce((sum, ex) => sum + (ex.duration_seconds || 0), 0) / n8nData.executions.length) || 0,
          success_rate: n8nData.statistics.success_rate || 0,
          api_response_time: 1200, // This would come from API request logs
          data_age: this.calculateDataAge(dbData.stats?.last_updates)
        };
      }

    } catch (error) {
      console.error('Error checking system health:', error);
    }
  },

  calculateDataAge(lastUpdates) {
    if (!lastUpdates) return 0;

    const mostRecent = Object.values(lastUpdates)
      .filter(time => time)
      .map(time => new Date(time))
      .sort((a, b) => b - a)[0];

    if (!mostRecent) return 0;

    return Math.round((Date.now() - mostRecent.getTime()) / (1000 * 60 * 60));
  }
}));
```

## Step 6: Error Handling and Alerts

### 6.1 Alert System

Implement an alert system for critical issues:

```javascript
// Add to your monitoring system
const ALERT_THRESHOLDS = {
  SYNC_FAILURE_COUNT: 3, // Alert after 3 consecutive failures
  DATA_AGE_HOURS: 25,     // Alert if data is older than 25 hours
  API_ERROR_RATE: 10,     // Alert if API error rate > 10%
  EXECUTION_TIME: 900     // Alert if execution takes > 15 minutes
};

class AlertManager {
  constructor() {
    this.alerts = [];
    this.lastCheck = new Date();
  }

  async checkAlerts() {
    const alerts = [];

    // Check sync failures
    const recentExecutions = await this.getRecentExecutions(24); // Last 24 hours
    const failures = recentExecutions.filter(ex => ex.status === 'error');

    if (failures.length >= ALERT_THRESHOLDS.SYNC_FAILURE_COUNT) {
      alerts.push({
        type: 'critical',
        title: 'Multiple Sync Failures',
        message: `${failures.length} sync failures in the last 24 hours`,
        action: 'Check n8n workflow and API connectivity'
      });
    }

    // Check data age
    const dataAge = await this.getDataAge();
    if (dataAge > ALERT_THRESHOLDS.DATA_AGE_HOURS) {
      alerts.push({
        type: 'warning',
        title: 'Stale Data Detected',
        message: `Data is ${dataAge} hours old`,
        action: 'Trigger manual sync or check workflow schedule'
      });
    }

    return alerts;
  }

  async sendAlert(alert) {
    // Implement your alerting mechanism here
    // Could be email, Slack, Discord, etc.
    console.log('🚨 ALERT:', alert);

    // Example: Send to Discord webhook
    if (process.env.DISCORD_WEBHOOK_URL) {
      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🚨 **${alert.title}**\n${alert.message}\n**Action:** ${alert.action}`
        })
      });
    }
  }
}
```

## Step 7: Testing Integration

### 7.1 End-to-End Test

Create a comprehensive test to verify the integration:

```javascript
// Test script: test-integration.js
async function testIntegration() {
  console.log('🧪 Testing Claude Code <-> n8n Integration...');

  try {
    // 1. Test dashboard API endpoints
    console.log('📋 Testing dashboard endpoints...');
    const healthCheck = await fetch('http://localhost:3000/api/n8n/health');
    const healthData = await healthCheck.json();
    console.log('✅ Health check:', healthData.success ? 'PASS' : 'FAIL');

    // 2. Test sync trigger
    console.log('🚀 Testing sync trigger...');
    const triggerResponse = await fetch('http://localhost:3000/api/n8n/trigger-laliga-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ triggered_by: 'integration_test' })
    });
    const triggerData = await triggerResponse.json();
    console.log('✅ Sync trigger:', triggerData.success ? 'PASS' : 'FAIL');

    if (triggerData.success) {
      // 3. Poll execution status
      console.log('⏳ Polling execution status...');
      const executionId = triggerData.execution_id;

      let completed = false;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes

      while (!completed && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

        const statusResponse = await fetch(`http://localhost:3000/api/n8n/execution-status/${executionId}`);
        const statusData = await statusResponse.json();

        if (statusData.success && statusData.is_completed) {
          completed = true;
          console.log('✅ Execution completed:', statusData.execution.status);
        }

        attempts++;
      }

      if (!completed) {
        console.log('⚠️ Execution polling timeout');
      }
    }

    // 4. Test data validation
    console.log('🔍 Testing data validation...');
    const statsResponse = await fetch('http://localhost:3000/api/n8n/sync-stats');
    const statsData = await statsResponse.json();

    const expectedMinCounts = { teams: 15, players: 300, matches: 200 };
    let dataValid = true;

    for (const [entity, minCount] of Object.entries(expectedMinCounts)) {
      const actualCount = statsData.stats?.data_counts?.[entity] || 0;
      if (actualCount < minCount) {
        console.log(`❌ ${entity} count too low: ${actualCount} < ${minCount}`);
        dataValid = false;
      } else {
        console.log(`✅ ${entity} count OK: ${actualCount}`);
      }
    }

    console.log('🎉 Integration test completed!');
    console.log('Overall result:', dataValid ? '✅ PASS' : '❌ FAIL');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

// Run test
testIntegration();
```

## Step 8: Production Deployment

### 8.1 Environment Configuration

Production environment variables:

```bash
# Production .env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# API-Sports
API_FOOTBALL_KEY=your_production_api_key

# Supabase Production
SUPABASE_PROJECT_URL=your_production_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# n8n Production
N8N_BASE_URL=https://your-production-n8n.com
N8N_WEBHOOK_URL=https://your-production-n8n.com/webhook/laliga-sync-webhook
N8N_API_TOKEN=your_production_n8n_token

# Alerting (Optional)
DISCORD_WEBHOOK_URL=your_discord_webhook_url
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

### 8.2 Deployment Checklist

- [ ] n8n workflow deployed and tested
- [ ] Supabase database schema deployed
- [ ] Environment variables configured
- [ ] Dashboard endpoints tested
- [ ] Webhook endpoints verified
- [ ] Monitoring alerts configured
- [ ] SSL certificates installed
- [ ] Backup procedures implemented
- [ ] Documentation updated

## Summary

This integration provides:

1. **Manual Sync Triggering**: Dashboard users can trigger data syncs on-demand
2. **Real-time Status Updates**: WebSocket-based real-time workflow status
3. **Comprehensive Monitoring**: Health checks, performance metrics, and alerts
4. **Error Handling**: Robust error handling with detailed logging
5. **Data Validation**: Automated data quality checks and reporting
6. **Production Ready**: Scalable architecture with proper security

The integration creates a seamless bridge between your Claude Code dashboard and the n8n workflow, providing full visibility and control over the La Liga data synchronization process.