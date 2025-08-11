// ========================================
// JEDNOSTAVNI TEST 1-ON-1 CHAT SISTEMA
// ========================================
// Ova skripta testira da li se poruke pravilno filtriraju

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// ========================================
// KONFIGURACIJA
// ========================================
const BASE_URL = 'http://localhost:3000';

// ========================================
// POMOĆNE FUNKCIJE
// ========================================

// Funkcija za izvršavanje curl komande
async function runCurl(command) {
  try {
    console.log(`🔄 Running: ${command}`);
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      console.log(`⚠️ Stderr: ${stderr}`);
    }
    
    try {
      const result = JSON.parse(stdout);
      return result;
    } catch (e) {
      console.log(`📄 Raw response: ${stdout}`);
      return stdout;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

// ========================================
// TESTIRANJE API RUTA
// ========================================
async function testAPIEndpoints() {
  console.log('🚀 Testing API endpoints...\n');
  
  // Test 1: Register a test user
  console.log('=== Test 1: Register User ===');
  const registerCommand = `curl -s -X POST ${BASE_URL}/api/register -H "Content-Type: application/json" -d "{\\"email\\":\\"test@example.com\\",\\"password\\":\\"test123\\",\\"name\\":\\"Test User\\"}"`;
  const registerResult = await runCurl(registerCommand);
  console.log('Register result:', registerResult);
  
  // Test 2: Test messages API without auth (should fail)
  console.log('\n=== Test 2: Messages API without auth ===');
  const messagesCommand = `curl -s -X GET "${BASE_URL}/api/messages?itemId=test123&otherUserId=test456"`;
  const messagesResult = await runCurl(messagesCommand);
  console.log('Messages result:', messagesResult);
  
  // Test 3: Test conversations API without auth (should fail)
  console.log('\n=== Test 3: Conversations API without auth ===');
  const conversationsCommand = `curl -s -X GET "${BASE_URL}/api/messages/conversations"`;
  const conversationsResult = await runCurl(conversationsCommand);
  console.log('Conversations result:', conversationsResult);
  
  console.log('\n✅ API endpoint tests completed!');
}

// ========================================
// POKRETANJE TESTA
// ========================================
if (require.main === module) {
  testAPIEndpoints().catch(console.error);
}

module.exports = { testAPIEndpoints };
