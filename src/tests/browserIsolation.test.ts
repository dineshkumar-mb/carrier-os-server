import { browserPool } from '../utils/browserPool';

export async function runBrowserIsolationTest() {
  console.log('\n--- [Test] Running Browser Pool Context Isolation Validation ---');
  
  try {
    console.log('Acquiring Browser Context A...');
    const contextA = await browserPool.acquireContext();
    const pageA = await contextA.newPage();

    console.log('Acquiring Browser Context B...');
    const contextB = await browserPool.acquireContext();
    const pageB = await contextB.newPage();

    console.log('Setting cookies in Context A...');
    await contextA.addCookies([
      {
        name: 'test_session',
        value: 'context_a_secure_cookie',
        domain: 'example.com',
        path: '/'
      }
    ]);

    const cookiesA = await contextA.cookies('https://example.com');
    const cookiesB = await contextB.cookies('https://example.com');

    console.log('Context A cookie:', cookiesA[0]?.value);
    console.log('Context B cookie:', cookiesB[0]?.value);

    if (cookiesB.some(c => c.name === 'test_session')) {
      throw new Error('Sandbox violation: Context B shared cookies with Context A!');
    }

    console.log('Closing pages and releasing contexts...');
    await pageA.close();
    await pageB.close();
    
    await browserPool.releaseContext(contextA);
    await browserPool.releaseContext(contextB);
    
    console.log('✓ Browser Pool Context Isolation completed successfully!');
  } catch (err: any) {
    console.error('✗ Browser Pool Context Isolation failed:', err.message);
    throw err;
  }
}
