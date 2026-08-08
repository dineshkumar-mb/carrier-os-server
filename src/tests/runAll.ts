import 'dotenv/config';
import { runAIValidationTest } from './aiValidation.test';
import { runBrowserIsolationTest } from './browserIsolation.test';
import { runQueueRecoveryTest } from './queueRecovery.test';
import { runJobDiscoveryTest } from './jobDiscovery.test';
import { runDiscoveryEngineTest } from './discoveryEngine.test';
import mongoose from 'mongoose';
import { browserPool } from '../utils/browserPool';

async function executeSuite() {
  console.log('==================================================');
  console.log('          CARRIER-OS INTEGRATION TEST SUITE       ');
  console.log('==================================================');

  try {
    await runBrowserIsolationTest();
    await runQueueRecoveryTest();
    await runDiscoveryEngineTest();
    await runJobDiscoveryTest();
    await runAIValidationTest();

    console.log('\n==================================================');
    console.log('          ALL INTEGRATION TESTS PASSED SUCCESSFULLY!          ');
    console.log('==================================================');
  } catch (error: any) {
    console.error('\n==================================================');
    console.error('          TEST SUITE FAILURE DETECTED!            ');
    console.error('Reason:', error.message);
    console.error('==================================================');
    process.exit(1);
  } finally {
    await browserPool.shutdown();
    await mongoose.connection.close();
    process.exit(0);
  }
}

executeSuite();
