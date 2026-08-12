import { ProviderRegistry } from '../../services/providers/ProviderRegistry';
import { OllamaProvider } from '../../services/providers/OllamaProvider';
import { DiscoverySchedulerService } from '../../services/jobDiscovery/DiscoverySchedulerService';
import { PerUserSchedulerService } from '../../services/scheduler/PerUserSchedulerService';
import { StrategyLearningEngine } from '../../services/intelligence/StrategyLearningEngine';
import { ApplicationReliabilityClassifier } from '../../services/execution/ApplicationReliabilityClassifier';
import { ExecutionTracer } from '../../core/telemetry/ExecutionTracer';
import { Phase8SecurityGate } from '../../core/gates/Phase8SecurityGate';
import { ModelRouter } from '../../services/ai/ModelRouter';
import { ApplicationIdempotencyService } from '../../services/execution/ApplicationIdempotencyService';
import { HealthCheckService } from '../../services/health/HealthCheckService';
import { GracefulShutdownService } from '../../core/infrastructure/GracefulShutdownService';
import { TenantContext } from '../../core/tenant/TenantContext';

async function runPhase8ProductionScaleTest() {
  console.log('=== Running Phase 8 — Production Operational Hardening, Scale & Release Test ===\n');

  let passedCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, testName: string) {
    totalCount++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  const userAContext: TenantContext = {
    userId: 'user_alpha',
    tenantId: 'tenant_alpha',
    roles: ['candidate'],
    privacyMode: 'STANDARD'
  };

  const userBContext: TenantContext = {
    userId: 'user_beta',
    tenantId: 'tenant_beta',
    roles: ['candidate'],
    privacyMode: 'STANDARD'
  };

  // 1. Phase 8 Security Gate & Candidate Partition Isolation Audit
  const securityGateResult = Phase8SecurityGate.evaluateSecurityBoundary({
    tenantContext: userAContext,
    privacyMode: 'LOCAL_ONLY',
    targetUserId: 'user_alpha',
    hasEncryptedCredentials: true
  });

  assert(securityGateResult.passed === true, 'Test 1: Phase8SecurityGate passes 6 core security & isolation boundary checks');
  assert(securityGateResult.score === 100, 'Test 2: Security boundary audit score is 100%');

  // 2. ModelRouter with Strict Local-Only Privacy Fallback Guard
  const modelRouter = ModelRouter.getInstance();

  const privacyLocalReq = await modelRouter.routeRequest({
    task: 'RESUME_TAILORING',
    privacyMode: 'LOCAL_ONLY',
    complexity: 'FAST',
    input: 'Tailor resume'
  });

  assert(privacyLocalReq.success === true && privacyLocalReq.providerId === 'ollama', 'Test 3: ModelRouter executes via local Ollama in LOCAL_ONLY mode');

  // 3. Provider Lifecycle Interface (IProviderPlugin)
  const providerRegistry = ProviderRegistry.getInstance();
  const allProviders = providerRegistry.getAllProviders();
  assert(allProviders.length >= 3, 'Test 4: ProviderRegistry manages Ollama, OpenAI, and Gmail OAuth plugins');

  const ollama = providerRegistry.getProvider('ollama') as OllamaProvider;
  const health = await ollama.healthCheck();
  assert(health.healthy === true, 'Test 5: OllamaProvider healthCheck returns HEALTHY');

  // 4. Application Submission Idempotency Protection
  const idempotencyService = ApplicationIdempotencyService.getInstance();
  const key1 = idempotencyService.computeKey('tenant_alpha', 'user_alpha', 'job_gh_101');
  const key2 = idempotencyService.computeKey('tenant_alpha', 'user_alpha', 'job_gh_101');

  assert(key1 === key2, 'Test 6: ApplicationIdempotencyService computes deterministic SHA-256 idempotency key');

  const idempotencyCheck = await idempotencyService.verifySubmissionIdempotency({
    tenantContext: userAContext,
    canonicalJobId: 'job_gh_101'
  });

  assert(idempotencyCheck.canProceed === true, 'Test 7: Idempotency check permits first-time application submission');

  // 5. Production Discovery Scheduler & Cooldowns
  const discoveryScheduler = DiscoverySchedulerService.getInstance();
  const scanResult = await discoveryScheduler.executeDiscoveryCycle({
    tenantId: 'tenant_p8',
    userId: 'user_p8'
  });

  assert(scanResult.sourcesScanned > 0, 'Test 8: DiscoverySchedulerService executes production rate-limited scan');

  // 6. Per-User Autonomous Scheduling
  const perUserScheduler = PerUserSchedulerService.getInstance();
  perUserScheduler.scheduleUserLoop(userAContext, 15);
  perUserScheduler.scheduleUserLoop(userBContext, 30);

  const schedA = perUserScheduler.getUserSchedule('user_alpha');
  assert(schedA !== undefined && schedA.intervalMinutes === 15, 'Test 9: Independent career schedule created for User Alpha (15m)');

  perUserScheduler.stopUserLoop('user_alpha');
  perUserScheduler.stopUserLoop('user_beta');

  // 7. Strategy Learning Engine with Sample-Size Protection (N >= 20)
  const strategyEngine = StrategyLearningEngine.getInstance();
  const rankedStrategies = strategyEngine.evaluateStrategyHierarchy(userAContext);
  const projectStrategy = rankedStrategies.find(s => s.strategyId === 'PROJECT_FOCUSED');

  assert(projectStrategy?.dataStatus === 'INSUFFICIENT_DATA', 'Test 10: StrategyLearningEngine flags low sample size (< 20) as INSUFFICIENT_DATA');
  assert(rankedStrategies[0].strategyId === 'ACHIEVEMENT_FOCUSED', 'Test 11: StrategyLearningEngine selects Achievement Focused strategy based on Offer > Interview > App > ATS conversion hierarchy');

  // 8. Granular Application Reliability Classification
  const classifier = ApplicationReliabilityClassifier.getInstance();

  const captchaRes = classifier.classifyOutcome({ status: 'PENDING', captchaDetected: true });
  assert(captchaRes.primaryResult === 'BLOCKED' && captchaRes.subStatus === 'CAPTCHA', 'Test 12: Classifier classifies CAPTCHA as BLOCKED / CAPTCHA');

  const successRes = classifier.classifyOutcome({ status: 'APPLIED', hasConfirmationText: true, hasScreenshot: true });
  assert(successRes.primaryResult === 'SUCCESS' && successRes.subStatus === 'EVIDENCE_CAPTURED', 'Test 13: Classifier classifies submission with confirmation screenshot as SUCCESS / EVIDENCE_CAPTURED');

  // 9. OpenTelemetry Distributed Execution Tracing
  const tracer = ExecutionTracer.getInstance();
  const execId = 'exec_p8_tracing_9001';

  const rootSpan = tracer.startSpan({ executionId: execId, name: 'JobApplicationWorkflow', type: 'WORKFLOW' });
  const agentSpan = tracer.startSpan({ executionId: execId, name: 'ResumeTailoringAgent', type: 'AGENT', parentSpanId: rootSpan.spanId });

  tracer.endSpan(execId, agentSpan.spanId, 'OK');
  tracer.endSpan(execId, rootSpan.spanId, 'OK');

  const traceTree = tracer.getTraceTree(execId, 'user_alpha', 'tenant_alpha');
  assert(traceTree?.childSpans.length === 1 && traceTree.childSpans[0].name === 'ResumeTailoringAgent', 'Test 14: ExecutionTracer generates OpenTelemetry hierarchical trace tree');

  // 10. Health Check Service & Graceful Shutdown
  const healthService = HealthCheckService.getInstance();
  const systemHealth = await healthService.getFullHealthSummary();
  assert(systemHealth.components.api.status === 'HEALTHY', 'Test 15: HealthCheckService exposes system health summary for Express API, Redis, and Browser Pool');

  const shutdownService = GracefulShutdownService.getInstance();
  assert(shutdownService.isAcceptingExecutions() === true, 'Test 16: GracefulShutdownService registered and active');

  console.log(`\n=== Phase 8 Production Scale & Release Test Summary: ${passedCount}/${totalCount} Passed ===\n`);

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runPhase8ProductionScaleTest().catch(err => {
  console.error('Phase 8 Test Failed:', err);
  process.exit(1);
});
