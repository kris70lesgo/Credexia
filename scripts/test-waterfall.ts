/**
 * Test script for Payment Waterfall API
 * Run: npx ts-node scripts/test-waterfall.ts
 */

import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:3000/api/waterfall';

async function testWaterfall() {
  console.log('🧪 Testing Payment Waterfall API\n');

  // Example: Read a sample PDF and convert to base64
  // For testing, you can create a sample payment advice PDF
  const pdfPath = path.join(__dirname, '../test-payment-advice.pdf');
  
  let base64Pdf = '';
  if (fs.existsSync(pdfPath)) {
    const pdfBuffer = fs.readFileSync(pdfPath);
    base64Pdf = pdfBuffer.toString('base64');
    console.log('✅ Loaded test PDF:', pdfPath);
  } else {
    console.log('⚠️  No test PDF found at:', pdfPath);
    console.log('   Using empty string for testing (will fail at AI extraction)');
  }

  const requestBody = {
    loanId: 'loan-001',
    owners: [
      {
        name: 'New Capital LLP',
        bic: 'CHASGB2L',
        account: '12345678',
        share: 0.40
      },
      {
        name: 'Bank B',
        bic: 'BOFAGB2L',
        account: '87654321',
        share: 0.60
      }
    ],
    base64Pdf: base64Pdf
  };

  console.log('\n📤 Sending request to', API_URL);
  console.log('📋 Request body:');
  console.log(JSON.stringify({
    ...requestBody,
    base64Pdf: base64Pdf ? `<${base64Pdf.length} chars>` : '<empty>'
  }, null, 2));

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log('\n❌ API Error:', response.status);
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    console.log('\n✅ Success! Response:');
    console.log(JSON.stringify(data, null, 2));

    // Verify integrity
    if (data.distribution) {
      const sum = data.distribution.reduce((total: number, d: any) => total + d.amount, 0);
      console.log('\n🔍 Integrity Check:');
      console.log(`   Total Cash In: ${data.total_cash_in}`);
      console.log(`   Distribution Sum: ${sum}`);
      console.log(`   Match: ${Math.abs(sum - data.total_cash_in) < 0.01 ? '✅' : '❌'}`);
    }

    // Show CSV preview
    if (data.csv) {
      console.log('\n📄 CSV Output:');
      console.log(data.csv);
    }

  } catch (error) {
    console.error('\n❌ Request failed:', error);
  }
}

// Test with specific amounts to verify rounding
async function testRoundingIntegrity() {
  console.log('\n\n🧮 Testing Rounding Integrity (3-way split)...\n');

  // This tests the edge case: 10000000 split 33.33% / 33.33% / 33.34%
  // Should still sum to exactly 10000000
  
  console.log('⚠️  This test requires a PDF with $10,000,000 payment');
  console.log('   Or you can manually create a mock response in the API\n');
}

// Run tests
testWaterfall().then(() => {
  testRoundingIntegrity();
});
