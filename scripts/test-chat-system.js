// ========================================
// TEST SKRIPTA ZA CHAT SISTEM
// ========================================
// Ova skripta testira chat sistem sa različitim korisnicima
// da vidimo da li se poruke pravilno filtriraju

const axios = require('axios');

// ========================================
// KONFIGURACIJA
// ========================================
const BASE_URL = 'http://localhost:3000';
const TEST_USERS = [
  {
    email: 'test1@example.com',
    password: 'test123',
    name: 'Test User 1'
  },
  {
    email: 'test2@example.com',
    password: 'test123',
    name: 'Test User 2'
  },
  {
    email: 'test3@example.com',
    password: 'test123',
    name: 'Test User 3'
  }
];

// ========================================
// POMOĆNE FUNKCIJE
// ========================================

// Funkcija za login korisnika
async function loginUser(user) {
  try {
    console.log(`🔐 Logging in user: ${user.email}`);
    
    // Prvo pokušajmo da se registrujemo (možda korisnik ne postoji)
    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/register`, {
        email: user.email,
        password: user.password,
        name: user.name
      });
      console.log(`✅ User registered: ${user.email}`);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`ℹ️ User already exists: ${user.email}`);
      } else {
        console.log(`⚠️ Registration failed: ${user.email}`, error.response?.data);
      }
    }

    // Sada se pokušajmo ulogovati
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/signin`, {
      email: user.email,
      password: user.password
    });

    if (loginResponse.data?.accessToken) {
      console.log(`✅ Login successful: ${user.email}`);
      return loginResponse.data.accessToken;
    } else {
      console.log(`❌ Login failed: ${user.email}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Login error for ${user.email}:`, error.response?.data || error.message);
    return null;
  }
}

// Funkcija za kreiranje predmeta
async function createItem(token, user) {
  try {
    console.log(`🏠 Creating item for user: ${user.email}`);
    
    const itemData = {
      title: `Test Item by ${user.name}`,
      description: `This is a test item created by ${user.name}`,
      pricePerDay: 25.0,
      location: 'Test Location',
      images: JSON.stringify(['test-image-1.jpg', 'test-image-2.jpg'])
    };

    const response = await axios.post(`${BASE_URL}/api/add-item`, itemData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Item created: ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.log(`❌ Failed to create item for ${user.email}:`, error.response?.data || error.message);
    return null;
  }
}

// Funkcija za slanje poruke
async function sendMessage(token, itemId, recipientId, content) {
  try {
    console.log(`💬 Sending message: "${content}" to user ${recipientId}`);
    
    const messageData = {
      itemId,
      content,
      recipientId
    };

    const response = await axios.post(`${BASE_URL}/api/messages`, messageData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Message sent: ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.log(`❌ Failed to send message:`, error.response?.data || error.message);
    return null;
  }
}

// Funkcija za dohvaćanje poruka
async function getMessages(token, itemId, otherUserId = null) {
  try {
    const params = new URLSearchParams({ itemId });
    if (otherUserId) {
      params.append('otherUserId', otherUserId);
    }

    console.log(`📥 Fetching messages for item ${itemId}${otherUserId ? ` with user ${otherUserId}` : ''}`);
    
    const response = await axios.get(`${BASE_URL}/api/messages?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`✅ Messages fetched: ${response.data.length} messages`);
    return response.data;
  } catch (error) {
    console.log(`❌ Failed to fetch messages:`, error.response?.data || error.message);
    return [];
  }
}

// Funkcija za dohvaćanje konverzacija
async function getConversations(token) {
  try {
    console.log(`📋 Fetching conversations`);
    
    const response = await axios.get(`${BASE_URL}/api/messages/conversations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`✅ Conversations fetched: ${response.data.length} conversations`);
    return response.data;
  } catch (error) {
    console.log(`❌ Failed to fetch conversations:`, error.response?.data || error.message);
    return [];
  }
}

// ========================================
// GLAVNA TEST FUNKCIJA
// ========================================
async function testChatSystem() {
  console.log('🚀 Starting chat system test...\n');

  // ========================================
  // KORAK 1: LOGIN SVIH KORISNIKA
  // ========================================
  console.log('=== STEP 1: LOGIN ALL USERS ===');
  const userTokens = {};
  
  for (const user of TEST_USERS) {
    const token = await loginUser(user);
    if (token) {
      userTokens[user.email] = token;
    }
  }

  if (Object.keys(userTokens).length === 0) {
    console.log('❌ No users could log in. Test failed.');
    return;
  }

  console.log(`✅ ${Object.keys(userTokens).length} users logged in successfully\n`);

  // ========================================
  // KORAK 2: KREIRANJE PREDMETA
  // ========================================
  console.log('=== STEP 2: CREATING ITEMS ===');
  const items = {};
  
  for (const user of TEST_USERS) {
    if (userTokens[user.email]) {
      const item = await createItem(userTokens[user.email], user);
      if (item) {
        items[user.email] = item;
      }
    }
  }

  if (Object.keys(items).length === 0) {
    console.log('❌ No items could be created. Test failed.');
    return;
  }

  console.log(`✅ ${Object.keys(items).length} items created successfully\n`);

  // ========================================
  // KORAK 3: SLANJE PORUKA IZMEĐU KORISNIKA
  // ========================================
  console.log('=== STEP 3: SENDING MESSAGES BETWEEN USERS ===');
  
  const userEmails = Object.keys(userTokens);
  
  // User 1 šalje poruku User 2 o User 1-ovom predmetu
  if (userTokens[userEmails[0]] && items[userEmails[0]]) {
    const item1 = items[userEmails[0]];
    const user2Id = userEmails[1]; // Email user 2
    
    console.log(`\n📤 User 1 (${userEmails[0]}) sending message to User 2 (${user2Id}) about item: ${item1.title}`);
    
    await sendMessage(
      userTokens[userEmails[0]], 
      item1.id, 
      user2Id, 
      'Zdravo! Zanima me vaš predmet. Možete li mi dati više informacija?'
    );
  }

  // User 2 šalje poruku User 1 o User 1-ovom predmetu
  if (userTokens[userEmails[1]] && items[userEmails[0]]) {
    const item1 = items[userEmails[0]];
    const user1Id = userEmails[0]; // Email user 1
    
    console.log(`\n📤 User 2 (${userEmails[1]}) sending message to User 1 (${user1Id}) about item: ${item1.title}`);
    
    await sendMessage(
      userTokens[userEmails[1]], 
      item1.id, 
      user1Id, 
      'Naravno! Predmet je u odličnom stanju. Kada biste željeli da ga vidite?'
    );
  }

  // User 3 šalje poruku User 1 o User 1-ovom predmetu
  if (userTokens[userEmails[2]] && items[userEmails[0]]) {
    const item1 = items[userEmails[0]];
    const user1Id = userEmails[0]; // Email user 1
    
    console.log(`\n📤 User 3 (${userEmails[2]}) sending message to User 1 (${user1Id}) about item: ${item1.title}`);
    
    await sendMessage(
      userTokens[userEmails[2]], 
      item1.id, 
      user1Id, 
      'Pozdrav! Vidim da imate predmet na prodaju. Koja je cijena?'
    );
  }

  // User 1 šalje poruku User 3 o User 1-ovom predmetu
  if (userTokens[userEmails[0]] && items[userEmails[0]]) {
    const item1 = items[userEmails[0]];
    const user3Id = userEmails[2]; // Email user 3
    
    console.log(`\n📤 User 1 (${userEmails[0]}) sending message to User 3 (${user3Id}) about item: ${item1.title}`);
    
    await sendMessage(
      userTokens[userEmails[0]], 
      item1.id, 
      user3Id, 
      'Cijena je 25 KM po danu. Predmet je u odličnom stanju!'
    );
  }

  console.log('\n✅ All messages sent successfully\n');

  // ========================================
  // KORAK 4: TESTIRANJE FILTRIRANJA PORUKA
  // ========================================
  console.log('=== STEP 4: TESTING MESSAGE FILTERING ===');
  
  // Test 1: User 1 vidi sve poruke za svoj predmet (bez otherUserId)
  if (userTokens[userEmails[0]] && items[userEmails[0]]) {
    console.log(`\n🔍 Test 1: User 1 (${userEmails[0]}) viewing all messages for their item (no otherUserId)`);
    const allMessages = await getMessages(userTokens[userEmails[0]], items[userEmails[0]].id);
    console.log(`📊 Found ${allMessages.length} total messages`);
    
    allMessages.forEach(msg => {
      console.log(`  - ${msg.sender.email} → ${msg.recipient.email}: "${msg.content.substring(0, 50)}..."`);
    });
  }

  // Test 2: User 1 vidi poruke samo sa User 2
  if (userTokens[userEmails[0]] && items[userEmails[0]]) {
    console.log(`\n🔍 Test 2: User 1 (${userEmails[0]}) viewing messages only with User 2 (${userEmails[1]})`);
    const user2Messages = await getMessages(userTokens[userEmails[0]], items[userEmails[0]].id, userEmails[1]);
    console.log(`📊 Found ${user2Messages.length} messages with User 2`);
    
    user2Messages.forEach(msg => {
      console.log(`  - ${msg.sender.email} → ${msg.recipient.email}: "${msg.content.substring(0, 50)}..."`);
    });
  }

  // Test 3: User 1 vidi poruke samo sa User 3
  if (userTokens[userEmails[0]] && items[userEmails[0]]) {
    console.log(`\n🔍 Test 3: User 1 (${userEmails[0]}) viewing messages only with User 3 (${userEmails[2]})`);
    const user3Messages = await getMessages(userTokens[userEmails[0]], items[userEmails[0]].id, userEmails[2]);
    console.log(`📊 Found ${user3Messages.length} messages with User 3`);
    
    user3Messages.forEach(msg => {
      console.log(`  - ${msg.sender.email} → ${msg.recipient.email}: "${msg.content.substring(0, 50)}..."`);
    });
  }

  // Test 4: User 2 vidi poruke samo sa User 1
  if (userTokens[userEmails[1]] && items[userEmails[0]]) {
    console.log(`\n🔍 Test 4: User 2 (${userEmails[1]}) viewing messages only with User 1 (${userEmails[0]})`);
    const user1Messages = await getMessages(userTokens[userEmails[1]], items[userEmails[0]].id, userEmails[0]);
    console.log(`📊 Found ${user1Messages.length} messages with User 1`);
    
    user1Messages.forEach(msg => {
      console.log(`  - ${msg.sender.email} → ${msg.recipient.email}: "${msg.content.substring(0, 50)}..."`);
    });
  }

  // ========================================
  // KORAK 5: TESTIRANJE KONVERZACIJA
  // ========================================
  console.log('\n=== STEP 5: TESTING CONVERSATIONS ===');
  
  // Test konverzacija za User 1
  if (userTokens[userEmails[0]]) {
    console.log(`\n🔍 User 1 (${userEmails[0]}) conversations:`);
    const conversations = await getConversations(userTokens[userEmails[0]]);
    
    conversations.forEach(conv => {
      console.log(`  - Item: ${conv.itemTitle}`);
      console.log(`    Other user: ${conv.otherUser.email}`);
      console.log(`    Last message: "${conv.lastMessage.content.substring(0, 50)}..."`);
      console.log(`    Unread: ${conv.unreadCount}`);
      console.log('');
    });
  }

  // Test konverzacija za User 2
  if (userTokens[userEmails[1]]) {
    console.log(`\n🔍 User 2 (${userEmails[1]}) conversations:`);
    const conversations = await getConversations(userTokens[userEmails[1]]);
    
    conversations.forEach(conv => {
      console.log(`  - Item: ${conv.itemTitle}`);
      console.log(`    Other user: ${conv.otherUser.email}`);
      console.log(`    Last message: "${conv.lastMessage.content.substring(0, 50)}..."`);
      console.log(`    Unread: ${conv.unreadCount}`);
      console.log('');
    });
  }

  // Test konverzacija za User 3
  if (userTokens[userEmails[2]]) {
    console.log(`\n🔍 User 3 (${userEmails[2]}) conversations:`);
    const conversations = await getConversations(userTokens[userEmails[2]]);
    
    conversations.forEach(conv => {
      console.log(`  - Item: ${conv.itemTitle}`);
      console.log(`    Other user: ${conv.otherUser.email}`);
      console.log(`    Last message: "${conv.lastMessage.content.substring(0, 50)}..."`);
      console.log(`    Unread: ${conv.unreadCount}`);
      console.log('');
    });
  }

  console.log('\n🎉 Chat system test completed!');
}

// ========================================
// POKRETANJE TESTA
// ========================================
if (require.main === module) {
  testChatSystem().catch(console.error);
}

module.exports = { testChatSystem };
