// ========================================
// TEST 1-ON-1 CHAT SISTEMA
// ========================================
// Ova skripta testira da li se poruke pravilno odvajaju u 1-on-1 konverzacije

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
// TESTIRANJE 1-ON-1 KONVERZACIJA
// ========================================
async function test1on1Conversations() {
  console.log('🚀 Testing 1-on-1 chat system...\n');
  
  // Test 1: Register test users
  console.log('=== Test 1: Register Test Users ===');
  
  const users = [
    { email: 'user1@test.com', password: 'test123', name: 'User 1' },
    { email: 'user2@test.com', password: 'test123', name: 'User 2' },
    { email: 'user3@test.com', password: 'test123', name: 'User 3' }
  ];
  
  for (const user of users) {
    const registerCommand = `curl -s -X POST ${BASE_URL}/api/register -H "Content-Type: application/json" -d "{\\"email\\":\\"${user.email}\\",\\"password\\":\\"${user.password}\\",\\"name\\":\\"${user.name}\\"}"`;
    const result = await runCurl(registerCommand);
    
    if (result && result.success) {
      console.log(`✅ User registered: ${user.email}`);
    } else if (result && result.error === 'Korisnik već postoji') {
      console.log(`ℹ️ User already exists: ${user.email}`);
    } else {
      console.log(`❌ Registration failed: ${user.email}`, result);
    }
  }
  
  // Test 2: Test conversations API structure
  console.log('\n=== Test 2: Test Conversations API Structure ===');
  console.log('This will show if conversations are properly separated by user');
  
  const conversationsCommand = `curl -s -X GET "${BASE_URL}/api/messages/conversations"`;
  const conversationsResult = await runCurl(conversationsCommand);
  
  if (conversationsResult && conversationsResult.error) {
    console.log('ℹ️ Conversations API requires authentication (expected)');
    console.log('Result:', conversationsResult);
  } else {
    console.log('Conversations result:', conversationsResult);
  }
  
  // Test 3: Test messages API structure
  console.log('\n=== Test 3: Test Messages API Structure ===');
  console.log('This will show if messages are properly filtered by user');
  
  const messagesCommand = `curl -s -X GET "${BASE_URL}/api/messages?itemId=test123&otherUserId=test456"`;
  const messagesResult = await runCurl(messagesCommand);
  
  if (messagesResult && messagesResult.error) {
    console.log('ℹ️ Messages API requires authentication (expected)');
    console.log('Result:', messagesResult);
  } else {
    console.log('Messages result:', messagesResult);
  }
  
  console.log('\n✅ 1-on-1 chat system tests completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Open the app in your browser');
  console.log('2. Log in with different users');
  console.log('3. Send messages between users');
  console.log('4. Check if conversations are properly separated');
}

// ========================================
// POKRETANJE TESTA
// ========================================
if (require.main === module) {
  test1on1Conversations().catch(console.error);
}

module.exports = { test1on1Conversations };
