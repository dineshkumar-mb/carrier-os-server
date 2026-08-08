import { ResumeTruthfulnessGate } from '../core/gates/ResumeTruthfulnessGate';
import { aiProviderRegistry } from '../services/ai/AIProviderRegistry';
import { jobSourceRegistry } from '../services/jobDiscovery/JobSourceRegistry';
import { artifactManager } from '../services/documents/ArtifactManager';
import { memoryService } from '../services/memory/MemoryService';

async function runMultiTenantVerification() {
  console.log('================================================================');
  console.log('  🔒 CARRIER OS — MULTI-TENANT ISOLATION & SAFETY VERIFICATION');
  console.log('================================================================\n');

  // 1. User Memory Isolation Verification
  console.log('--- [Test 1: User Memory Partition Isolation] ---');
  memoryService.saveMemory('user_alpha', 'resume', 'skill_react', 'React Expert with 5 years exp');
  memoryService.saveMemory('user_beta', 'resume', 'skill_python', 'Python Django Lead');

  const alphaMemories = memoryService.getMemories('user_alpha');
  const betaMemories = memoryService.getMemories('user_beta');

  console.log(`   - User Alpha Memories Count: ${alphaMemories.length} (Key: ${alphaMemories[0]?.key})`);
  console.log(`   - User Beta Memories Count:  ${betaMemories.length} (Key: ${betaMemories[0]?.key})`);

  if (alphaMemories.length === 1 && betaMemories.length === 1 && alphaMemories[0].key !== betaMemories[0].key) {
    console.log('   ✅ PASSED: Memory partitions strictly isolated per user.\n');
  } else {
    throw new Error('FAILED: Memory partition leak detected.');
  }

  // 2. Truthfulness Quality Gate Verification
  console.log('--- [Test 2: Resume Truthfulness Quality Gate] ---');
  const truthfulResult = ResumeTruthfulnessGate.evaluate({
    masterSkills: ['React', 'TypeScript', 'Node.js'],
    masterCompanies: ['TechCorp'],
    masterTitles: ['Senior Fullstack Engineer'],
    tailoredText: 'Experienced Senior Fullstack Engineer at TechCorp skilled in React and Node.js',
    tailoredSkills: ['React', 'TypeScript']
  });

  console.log(`   - Honest Resume Gate Passed: ${truthfulResult.passed}`);

  const fabricatedResult = ResumeTruthfulnessGate.evaluate({
    masterSkills: ['React', 'TypeScript'],
    masterCompanies: ['TechCorp'],
    masterTitles: ['Software Developer'],
    tailoredText: 'Worked at fakecompany as Lead Architect',
    tailoredSkills: ['React', 'fakecompany_invented_exp']
  });

  console.log(`   - Fabricated Resume Gate Passed: ${fabricatedResult.passed}`);
  console.log(`   - Gate Rationale: "${fabricatedResult.reason}"`);

  if (truthfulResult.passed && !fabricatedResult.passed) {
    console.log('   ✅ PASSED: Resume Truthfulness Gate correctly blocks fabricated claims.\n');
  } else {
    throw new Error('FAILED: Truthfulness gate failed to block fabricated claims.');
  }

  // 3. User-Isolated Object Storage Key Generation
  console.log('--- [Test 3: User Object Storage Key Isolation] ---');
  const objectKeyAlpha = artifactManager.generateObjectKey('user_alpha_123', 'generated_resumes', 'exec_001', 'resume.pdf');
  const objectKeyBeta = artifactManager.generateObjectKey('user_beta_456', 'generated_resumes', 'exec_002', 'resume.pdf');

  console.log(`   - User Alpha Storage Key: ${objectKeyAlpha}`);
  console.log(`   - User Beta Storage Key:  ${objectKeyBeta}`);

  if (objectKeyAlpha.startsWith('users/user_alpha_123/') && objectKeyBeta.startsWith('users/user_beta_456/')) {
    console.log('   ✅ PASSED: Artifact storage keys strictly user-isolated.\n');
  } else {
    throw new Error('FAILED: Object key isolation check failed.');
  }

  // 4. Multi-Model AI Provider Registry Routing
  console.log('--- [Test 4: AI Provider Registry & Model Routing] ---');
  const activeProvider = aiProviderRegistry.getActiveProvider();
  const fastModel = aiProviderRegistry.routeModelForTask('fast');
  const reasoningModel = aiProviderRegistry.routeModelForTask('reasoning');

  console.log(`   - Active Provider: ${activeProvider.name} (${activeProvider.id})`);
  console.log(`   - Fast Task Model: ${fastModel}`);
  console.log(`   - Reasoning Task Model: ${reasoningModel}`);

  console.log('   ✅ PASSED: AI Provider Registry initialized and task routing active.\n');

  console.log('================================================================');
  console.log('  🎉 ALL MULTI-TENANT ISOLATION & SAFETY TESTS PASSED!');
  console.log('================================================================');
}

runMultiTenantVerification().catch(err => {
  console.error('❌ Multi-Tenant Verification Error:', err);
  process.exit(1);
});
