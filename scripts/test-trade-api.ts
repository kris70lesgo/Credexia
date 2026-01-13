/**
 * TradeClear API Test Script
 * Run this to test the complete trade workflow
 */

const API_BASE = 'http://localhost:3000';

async function testTradeWorkflow() {
  console.log('🚀 Starting TradeClear API Test\n');

  // Step 1: Check initial ownership
  console.log('1️⃣ Checking initial ownership...');
  const ownersResponse = await fetch(`${API_BASE}/api/trade/owners?loan_id=LN-2024-8392`);
  const ownersData = await ownersResponse.json();
  console.log('Initial owners:', JSON.stringify(ownersData, null, 2));
  console.log('');

  // Step 2: Simulate trade data (normally comes from Gemini AI parsing)
  console.log('2️⃣ Simulating AI extraction result...');
  const tradeData = {
    seller: 'Pacific Rim Traders',
    buyer: 'Quantum Capital Partners',
    amount: 15000000,
    loan_id: 'LN-2024-8392',
    percentage: 45.0,
  };
  console.log('Trade data:', JSON.stringify(tradeData, null, 2));
  console.log('');

  // Step 3: Validate trade
  console.log('3️⃣ Validating trade...');
  const validateResponse = await fetch(`${API_BASE}/api/trade/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tradeData),
  });
  const validateData = await validateResponse.json();
  console.log('Validation result:', JSON.stringify(validateData, null, 2));

  if (!validateData.valid) {
    console.error('❌ Validation failed:', validateData.errors);
    return;
  }
  console.log('✅ Validation passed\n');

  // Step 4: Confirm trade (record as pending)
  console.log('4️⃣ Confirming trade...');
  const confirmResponse = await fetch(`${API_BASE}/api/trade/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tradeData),
  });
  const confirmData = await confirmResponse.json();
  console.log('Trade confirmed:', JSON.stringify(confirmData, null, 2));
  const tradeId = confirmData.trade.id;
  console.log('');

  // Step 5: Approve trade (execute ownership transfer)
  console.log('5️⃣ Approving trade...');
  const approveResponse = await fetch(`${API_BASE}/api/trade/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trade_id: tradeId }),
  });
  const approveData = await approveResponse.json();
  console.log('Trade approved:', JSON.stringify(approveData, null, 2));
  console.log('');

  // Step 6: Check updated ownership
  console.log('6️⃣ Checking updated ownership...');
  const updatedOwnersResponse = await fetch(`${API_BASE}/api/trade/owners?loan_id=LN-2024-8392`);
  const updatedOwnersData = await updatedOwnersResponse.json();
  console.log('Updated owners:', JSON.stringify(updatedOwnersData, null, 2));
  console.log('');

  // Step 7: View all trade events
  console.log('7️⃣ Viewing all trade events...');
  const eventsResponse = await fetch(`${API_BASE}/api/trade/events`);
  const eventsData = await eventsResponse.json();
  console.log('Trade events:', JSON.stringify(eventsData, null, 2));
  console.log('');

  console.log('✅ Test completed successfully!');
  console.log(`\n🔒 Trade hash: ${approveData.trade.hash}`);
  console.log(`📊 Ownership transferred: ${tradeData.seller} → ${tradeData.buyer} (${tradeData.percentage}%)`);
}

// Run test
testTradeWorkflow().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
