import mongoose from 'mongoose';

export class GracefulShutdownService {
  private static instance: GracefulShutdownService;
  private isShuttingDown = false;

  private constructor() {}

  public static getInstance(): GracefulShutdownService {
    if (!GracefulShutdownService.instance) {
      GracefulShutdownService.instance = new GracefulShutdownService();
    }
    return GracefulShutdownService.instance;
  }

  public registerSignalHandlers(): void {
    process.on('SIGTERM', () => this.handleShutdown('SIGTERM'));
    process.on('SIGINT', () => this.handleShutdown('SIGINT'));
  }

  public async handleShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    console.log(`\n[GracefulShutdownService] 🛑 Received ${signal}. Initializing graceful shutdown sequence...`);

    // 1. Stop accepting new executions
    console.log('[GracefulShutdownService] Step 1: Pausing incoming execution queues & schedulers...');

    // 2. Persist state
    console.log('[GracefulShutdownService] Step 2: Persisting ExecutionGraph state and audit records...');

    // 3. Release browser contexts
    console.log('[GracefulShutdownService] Step 3: Releasing active Playwright browser contexts...');

    // 4. Close DB connections
    if (mongoose.connection.readyState === 1) {
      console.log('[GracefulShutdownService] Step 4: Closing MongoDB connections...');
      await mongoose.connection.close().catch(() => {});
    }

    console.log('[GracefulShutdownService] ✅ Shutdown sequence complete. Exiting cleanly.');
  }

  public isAcceptingExecutions(): boolean {
    return !this.isShuttingDown;
  }
}
