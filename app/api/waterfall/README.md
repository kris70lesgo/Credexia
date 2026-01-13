# Payment Waterfall API

## Endpoint

```
POST /api/waterfall
```

## Description

Payment Waterfall Engine that:
1. Extracts total payment amount from Payment Advice PDF using Gemini AI
2. Calculates lender distributions with strict rounding control
3. Returns downloadable CSV output for payment execution

**No database storage** - processes in-memory only.

## Request

### Headers
```
Content-Type: application/json
```

### Body

```json
{
  "loanId": "loan-001",
  "owners": [
    {
      "name": "New Capital LLP",
      "bic": "CHASGB2L",
      "account": "12345678",
      "share": 0.40
    },
    {
      "name": "Bank B",
      "bic": "BOFAGB2L",
      "account": "87654321",
      "share": 0.60
    }
  ],
  "base64Pdf": "<BASE64_ENCODED_PDF>"
}
```

### Field Descriptions

- `loanId` (string, optional): Loan identifier for reference
- `owners` (array, required): Array of ownership entities
  - `name` (string, required): Bank/lender legal name
  - `bic` (string, required): SWIFT/BIC code
  - `account` (string, required): Account number
  - `share` (number, required): Ownership percentage as decimal (0.0 to 1.0)
- `base64Pdf` (string, required): Payment Advice PDF encoded as base64

### Validation Rules

- `owners` array must not be empty
- Total shares must sum to 1.0 (within 0.0001 tolerance)
- Each owner must have all required fields
- PDF must be valid base64 string

## Response

### Success (200)

```json
{
  "loan_id": "loan-001",
  "total_cash_in": 10000000,
  "distribution": [
    {
      "name": "New Capital LLP",
      "bic": "CHASGB2L",
      "account": "12345678",
      "amount": 4000000
    },
    {
      "name": "Bank B",
      "bic": "BOFAGB2L",
      "account": "87654321",
      "amount": 6000000
    }
  ],
  "csv": "Bank Name,BIC Code,Currency,Account Number,Amount\nNew Capital LLP,CHASGB2L,USD,12345678,4000000.00\nBank B,BOFAGB2L,USD,87654321,6000000.00\n",
  "processing_time_ms": 2145,
  "extraction_time_ms": 1892
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "error": "base64Pdf is required"
}
```

```json
{
  "error": "owners array is required and must not be empty"
}
```

```json
{
  "error": "Each owner must have name, bic, account, and share (number)"
}
```

#### 422 Unprocessable Entity
```json
{
  "error": "AI extraction failed: Gemini failed to return numeric payment amount"
}
```

```json
{
  "error": "Waterfall calculation failed: Total shares must equal 1.0, got 0.95"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Waterfall rounding integrity failed"
}
```

```json
{
  "error": "CSV integrity validation failed"
}
```

## Business Rules

### Rounding Integrity

1. **No premature rounding**: Calculations maintain full floating-point precision
2. **Agent Bank absorbs remainder**: The last entry (Agent Bank) receives any rounding difference
3. **Exact sum guarantee**: Final distribution always equals total cash input exactly
4. **CSV formatting**: Amounts formatted to 2 decimal places for banking systems

### Example: 3-Way Split with Rounding

**Input:**
- Total: $10,000,000
- Shares: 33.33% / 33.33% / 33.34%

**Output:**
```
Lender A: $3,333,000.00
Lender B: $3,333,000.00
Agent Bank: $3,334,000.00  ← Absorbs remainder
Total: $10,000,000.00 ✅
```

## AI Extraction

### Model Fallback Chain

The API tries Gemini models in order until one succeeds:

1. `gemini-2.5-flash` (preferred - fast, good quota)
2. `gemini-2.5-pro` (fallback 1)
3. `gemini-1.5-flash-latest` (fallback 2)
4. `gemini-pro` (fallback 3)

### Extraction Rules

- Returns **only** the numeric payment amount
- Removes currency symbols, commas, formatting
- Validates result is a positive number
- Fails honestly if extraction unsuccessful

## Usage Examples

### PowerShell

```powershell
# Read PDF and encode to base64
$pdfBytes = [System.IO.File]::ReadAllBytes("payment-advice.pdf")
$base64Pdf = [System.Convert]::ToBase64String($pdfBytes)

# Make API request
$body = @{
    loanId = "loan-001"
    owners = @(
        @{
            name = "New Capital LLP"
            bic = "CHASGB2L"
            account = "12345678"
            share = 0.40
        },
        @{
            name = "Bank B"
            bic = "BOFAGB2L"
            account = "87654321"
            share = 0.60
        }
    )
    base64Pdf = $base64Pdf
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:3000/api/waterfall" -Method POST -ContentType "application/json" -Body $body
```

### cURL

```bash
curl -X POST http://localhost:3000/api/waterfall \
  -H "Content-Type: application/json" \
  -d '{
    "loanId": "loan-001",
    "owners": [
      {
        "name": "New Capital LLP",
        "bic": "CHASGB2L",
        "account": "12345678",
        "share": 0.40
      },
      {
        "name": "Bank B",
        "bic": "BOFAGB2L",
        "account": "87654321",
        "share": 0.60
      }
    ],
    "base64Pdf": "<BASE64_STRING>"
  }'
```

### JavaScript/TypeScript

```typescript
const response = await fetch('/api/waterfall', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
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
    base64Pdf: base64String
  })
});

const result = await response.json();
console.log('CSV:', result.csv);
```

## CSV Output Format

```
Bank Name,BIC Code,Currency,Account Number,Amount
New Capital LLP,CHASGB2L,USD,12345678,4000000.00
Bank B,BOFAGB2L,USD,87654321,6000000.00
```

### CSV Fields

1. **Bank Name**: Legal entity name
2. **BIC Code**: SWIFT/BIC identifier
3. **Currency**: Always USD (hardcoded)
4. **Account Number**: Destination account
5. **Amount**: Payment amount with 2 decimal places

## Performance

Typical processing times:
- **AI Extraction**: 1-3 seconds
- **Calculation**: < 10ms
- **Total**: 1-3 seconds

## Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Required for AI extraction functionality.

## Real-World Use Cases

This API simulates real loan agency payment allocation logic used in:

- **Syndicated loans**: Multi-lender credit facilities
- **Agent banks**: Managing borrower payments to lender consortium
- **Loan servicing**: Automated payment distribution
- **Payment waterfalls**: Priority-based distribution models

## Integrity Guarantees

✅ **Exact sum**: Distribution always equals input total  
✅ **No silent failures**: Errors reported honestly  
✅ **No mock data**: All extractions use real AI  
✅ **Deterministic**: Same input always produces same output  
✅ **Audit trail**: Full logging of calculations
