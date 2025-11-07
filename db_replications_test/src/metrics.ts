import { DatabaseConnection } from './db';

export interface PhysicalReplicationMetrics {
  node: string;
  type: 'primary' | 'standby';
  timestamp: Date;
  // Primary metrics
  replicationState?: {
    applicationName: string;
    clientAddr: string;
    state: string;
    sentLsn: string;
    writeLsn: string;
    flushLsn: string;
    replayLsn: string;
    writeLag: string | null;
    flushLag: string | null;
    replayLag: string | null;
    syncState: string;
  }[];
  // Standby metrics
  lastWalReplayLsn?: string;
  lastXactReplayTimestamp?: Date | null;
  isInRecovery?: boolean;
  replayPaused?: boolean;
}

export interface LogicalReplicationMetrics {
  node: string;
  timestamp: Date;
  // Subscription metrics
  subscriptions: {
    subname: string;
    pid: number | null;
    relid: number | null;
    receivedLsn: string | null;
    lastMsgSendTime: Date | null;
    lastMsgReceiptTime: Date | null;
    latestEndLsn: string | null;
    latestEndTime: Date | null;
  }[];
  // Publication metrics
  publications: {
    pubname: string;
    tablename: string;
  }[];
  // Replication slots
  slots: {
    slotName: string;
    pluginName: string;
    slotType: string;
    active: boolean;
    activePid: number | null;
  }[];
}

export class MetricsCollector {
  constructor(private db: DatabaseConnection) {}

  async collectPhysicalMetrics(nodeType: 'primary' | 'standby'): Promise<PhysicalReplicationMetrics> {
    const metrics: PhysicalReplicationMetrics = {
      node: this.db.label,
      type: nodeType,
      timestamp: new Date(),
    };

    if (nodeType === 'primary') {
      // Collect pg_stat_replication data
      const { result } = await this.db.query(`
        SELECT
          application_name,
          client_addr::text,
          state,
          sent_lsn::text,
          write_lsn::text,
          flush_lsn::text,
          replay_lsn::text,
          EXTRACT(EPOCH FROM write_lag) as write_lag_seconds,
          EXTRACT(EPOCH FROM flush_lag) as flush_lag_seconds,
          EXTRACT(EPOCH FROM replay_lag) as replay_lag_seconds,
          sync_state
        FROM pg_stat_replication
      `);

      metrics.replicationState = result.rows.map((row: any) => ({
        applicationName: row.application_name,
        clientAddr: row.client_addr,
        state: row.state,
        sentLsn: row.sent_lsn,
        writeLsn: row.write_lsn,
        flushLsn: row.flush_lsn,
        replayLsn: row.replay_lsn,
        writeLag: row.write_lag_seconds ? `${row.write_lag_seconds}s` : null,
        flushLag: row.flush_lag_seconds ? `${row.flush_lag_seconds}s` : null,
        replayLag: row.replay_lag_seconds ? `${row.replay_lag_seconds}s` : null,
        syncState: row.sync_state,
      }));
    } else {
      // Standby metrics
      const { result: recoveryResult } = await this.db.query(`
        SELECT pg_is_in_recovery() as is_in_recovery
      `);
      metrics.isInRecovery = recoveryResult.rows[0].is_in_recovery;

      const { result: lsnResult } = await this.db.query(`
        SELECT
          pg_last_wal_replay_lsn()::text as last_wal_replay_lsn,
          pg_last_xact_replay_timestamp() as last_xact_replay_timestamp
      `);

      metrics.lastWalReplayLsn = lsnResult.rows[0].last_wal_replay_lsn;
      metrics.lastXactReplayTimestamp = lsnResult.rows[0].last_xact_replay_timestamp;

      const { result: pausedResult } = await this.db.query(`
        SELECT pg_is_wal_replay_paused() as replay_paused
      `);
      metrics.replayPaused = pausedResult.rows[0].replay_paused;
    }

    return metrics;
  }

  async collectLogicalMetrics(): Promise<LogicalReplicationMetrics> {
    const metrics: LogicalReplicationMetrics = {
      node: this.db.label,
      timestamp: new Date(),
      subscriptions: [],
      publications: [],
      slots: [],
    };

    // Collect subscription metrics
    try {
      const { result: subResult } = await this.db.query(`
        SELECT
          subname,
          pid,
          relid,
          received_lsn::text,
          last_msg_send_time,
          last_msg_receipt_time,
          latest_end_lsn::text,
          latest_end_time
        FROM pg_stat_subscription
      `);

      metrics.subscriptions = subResult.rows.map((row: any) => ({
        subname: row.subname,
        pid: row.pid,
        relid: row.relid,
        receivedLsn: row.received_lsn,
        lastMsgSendTime: row.last_msg_send_time,
        lastMsgReceiptTime: row.last_msg_receipt_time,
        latestEndLsn: row.latest_end_lsn,
        latestEndTime: row.latest_end_time,
      }));
    } catch (error) {
      console.error(`[${this.db.label}] Error collecting subscription metrics:`, error);
    }

    // Collect publication info
    try {
      const { result: pubResult } = await this.db.query(`
        SELECT p.pubname, pt.tablename
        FROM pg_publication p
        LEFT JOIN pg_publication_tables pt ON p.pubname = pt.pubname
      `);

      metrics.publications = pubResult.rows;
    } catch (error) {
      console.error(`[${this.db.label}] Error collecting publication info:`, error);
    }

    // Collect replication slot info
    try {
      const { result: slotResult } = await this.db.query(`
        SELECT
          slot_name,
          plugin,
          slot_type,
          active,
          active_pid
        FROM pg_replication_slots
      `);

      metrics.slots = slotResult.rows.map((row: any) => ({
        slotName: row.slot_name,
        pluginName: row.plugin,
        slotType: row.slot_type,
        active: row.active,
        activePid: row.active_pid,
      }));
    } catch (error) {
      console.error(`[${this.db.label}] Error collecting slot info:`, error);
    }

    return metrics;
  }
}

export function printPhysicalMetrics(metrics: PhysicalReplicationMetrics) {
  console.log('\n' + '='.repeat(80));
  console.log(`Physical Replication Metrics - ${metrics.node} (${metrics.type})`);
  console.log(`Timestamp: ${metrics.timestamp.toISOString()}`);
  console.log('='.repeat(80));

  if (metrics.type === 'primary' && metrics.replicationState) {
    console.log('\nReplication State:');
    metrics.replicationState.forEach((state, idx) => {
      console.log(`\n  Replica ${idx + 1}:`);
      console.log(`    Application: ${state.applicationName}`);
      console.log(`    Client: ${state.clientAddr}`);
      console.log(`    State: ${state.state}`);
      console.log(`    Sync State: ${state.syncState}`);
      console.log(`    Sent LSN: ${state.sentLsn}`);
      console.log(`    Replay LSN: ${state.replayLsn}`);
      console.log(`    Write Lag: ${state.writeLag || 'N/A'}`);
      console.log(`    Flush Lag: ${state.flushLag || 'N/A'}`);
      console.log(`    Replay Lag: ${state.replayLag || 'N/A'}`);
    });
  } else {
    console.log('\nStandby Status:');
    console.log(`  In Recovery: ${metrics.isInRecovery}`);
    console.log(`  Replay Paused: ${metrics.replayPaused}`);
    console.log(`  Last WAL Replay LSN: ${metrics.lastWalReplayLsn}`);
    console.log(`  Last Transaction Replay: ${metrics.lastXactReplayTimestamp || 'N/A'}`);
  }

  console.log('='.repeat(80) + '\n');
}

export function printLogicalMetrics(metrics: LogicalReplicationMetrics) {
  console.log('\n' + '='.repeat(80));
  console.log(`Logical Replication Metrics - ${metrics.node}`);
  console.log(`Timestamp: ${metrics.timestamp.toISOString()}`);
  console.log('='.repeat(80));

  console.log('\nPublications:');
  if (metrics.publications.length > 0) {
    metrics.publications.forEach((pub) => {
      console.log(`  - ${pub.pubname}: ${pub.tablename}`);
    });
  } else {
    console.log('  No publications found');
  }

  console.log('\nSubscriptions:');
  if (metrics.subscriptions.length > 0) {
    metrics.subscriptions.forEach((sub) => {
      console.log(`\n  ${sub.subname}:`);
      console.log(`    PID: ${sub.pid || 'N/A'}`);
      console.log(`    Received LSN: ${sub.receivedLsn || 'N/A'}`);
      console.log(`    Latest End LSN: ${sub.latestEndLsn || 'N/A'}`);
      console.log(`    Last Message Send: ${sub.lastMsgSendTime || 'N/A'}`);
      console.log(`    Last Message Receipt: ${sub.lastMsgReceiptTime || 'N/A'}`);
      console.log(`    Latest End Time: ${sub.latestEndTime || 'N/A'}`);
    });
  } else {
    console.log('  No subscriptions found');
  }

  console.log('\nReplication Slots:');
  if (metrics.slots.length > 0) {
    metrics.slots.forEach((slot) => {
      console.log(`  - ${slot.slotName}:`);
      console.log(`    Type: ${slot.slotType}`);
      console.log(`    Plugin: ${slot.pluginName}`);
      console.log(`    Active: ${slot.active} ${slot.activePid ? `(PID: ${slot.activePid})` : ''}`);
    });
  } else {
    console.log('  No replication slots found');
  }

  console.log('='.repeat(80) + '\n');
}
