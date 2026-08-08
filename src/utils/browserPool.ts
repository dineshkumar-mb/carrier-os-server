import { chromium, Browser, BrowserContext } from 'playwright';

class BrowserPool {
  private browser: Browser | null = null;
  private activeContextsCount = 0;
  private totalPagesOpened = 0;
  private readonly MAX_PAGES_BEFORE_REBOOT = 50;

  private async getBrowser(): Promise<Browser> {
    if (this.totalPagesOpened >= this.MAX_PAGES_BEFORE_REBOOT && this.activeContextsCount === 0) {
      console.log(`[BrowserPool] Reached limit of ${this.totalPagesOpened} pages. Re-launching Chromium process to mitigate memory leaks.`);
      await this.shutdown();
    }

    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });
      this.totalPagesOpened = 0;
    }
    return this.browser;
  }

  async acquireContext(): Promise<BrowserContext> {
    const browser = await this.getBrowser();
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 }
    });

    this.activeContextsCount++;
    this.totalPagesOpened++;
    
    return context;
  }

  async releaseContext(context: BrowserContext) {
    if (!context) return;
    try {
      await context.clearCookies();
      await context.close();
    } catch (err) {
      console.error('[BrowserPool] Error closing browser context:', err);
    } finally {
      this.activeContextsCount = Math.max(0, this.activeContextsCount - 1);
    }
  }

  async shutdown() {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (err) {
        console.error('[BrowserPool] Error closing browser process:', err);
      } finally {
        this.browser = null;
        this.activeContextsCount = 0;
        this.totalPagesOpened = 0;
      }
    }
  }

  // Deprecated backward-compatible method
  async getContext(): Promise<BrowserContext> {
    return this.acquireContext();
  }
}

export const browserPool = new BrowserPool();
