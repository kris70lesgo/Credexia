# TradeClear API Documentation

## Overview

TradeClear API provides a complete backend workflow for processing Notice of Assignment documents, validating ownership transfers, and maintaining an immutable audit trail of all trade events.

**Key Features:**
- ✅ Real Gemini 2.5 Pro AI extraction
- ✅ In-memory state management (no database)
- ✅ Ownership validation before transfer
- ✅ Full audit trail with blockchain simulation
- ✅ Honest error handling (no silent fallbacks)

---

## Global State

All data is stored in memory (`lib/trade-state.ts`):

```typescript
// Ownership registry
loanOwners = {
  "LN-2024-8392": [
    { name: "Pacific Rim Traders", share: 45.0 },
    { name: "Sovereign Wealth I", share: 30.0 },
    { name: "Maritime Ventures", share: 25.0 }
  ],
  "loan-001": [
    { name: "Bank A", share: 40.0 },
    { name: "Bank B", share: 60.0 }
  ]
};

// Trade events log
tradeEvents = [];
```

---

## API Endpoints

### 1. Upload Document
**POST** `/api/trade/upload`

Upload a Notice of Assignment PDF for processing.

**Request:**
```bash
curl -X POST http://localhost:3000/api/trade/upload \
  -F "file=@notice_of_assignment.pdf"
```

**Response:**
```json
{
  "success": true,
  "filename": "notice_of_assignment.pdf",
  "size": 245678,
  "base64": "JVBERi0xLjQK...",
  "mimeType": "application/pdf"
}
```

**Validations:**
- File must be PDF
- Max size: 10MB
- Returns base64 for immediate parsing

---

### 2. Parse Document (AI Extraction)
**POST** `/api/trade/parse`

Uses Gemini 2.5 Pro to extract trade data from PDF.

**Request:**
```bash
curl -X POST http://localhost:3000/api/trade/parse \
  -H "Content-Type: application/json" \
  -d '{
    "base64": "JVBERi0xLjQK...",
    "mimeType": "application/pdf"
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "seller": "Pacific Rim Traders",
    "buyer": "Quantum Capital Partners",
    "amount": 15000000,
    "loan_id": "LN-2024-8392",
    "percentage": 45.0,
    "confidence": 0.95
  }
}
```

**Response (Low Confidence):**
```json
{
  "error": "Low confidence extraction",
  "confidence": 0.55,
  "data": { ... }
}
```
**Status:** `422 Unprocessable Entity`

**Response (Missing Fields):**
```json
{
  "error": "Missing required fields",
  "missing": ["seller", "amount"],
  "data": { ... }
}
```
**Status:** `422 Unprocessable Entity`

**AI Rejection Rules:**
- Confidence < 0.6 → Reject
- Missing required fields → Reject
- Invalid JSON from Gemini → Error 500

---

### 3. Validate Trade
**POST** `/api/trade/validate`

Validates extracted trade data against ownership registry.

**Request:**
```bash
curl -X POST http://localhost:3000/api/trade/validate \
  -H "Content-Type: application/json" \
  -d '{
    "seller": "Pacific Rim Traders",
    "buyer": "Quantum Capital Partners",
    "amount": 15000000,
    "loan_id": "LN-2024-8392",
    "percentage": 45.0
  }'
```

**Response (Valid):**
```json
{
  "valid": true
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "errors": [
    "Seller \"Unknown Bank\" is not an owner of loan LN-2024-8392",
    "Percentage cannot exceed 100"
  ]
}
```

**Validation Rules:**
1. ✅ `loan_id` must exist in `loanOwners`
2. ✅ `seller` must be an owner of that loan
3. ✅ `seller.share` ≥ `percentage` (sufficient ownership)
4. ✅ `buyer` must not be empty
5. ✅ `percentage` > 0 and ≤ 100

---

### 4. Confirm Trade
**POST** `/api/trade/confirm`

Records trade event in **pending** state (does NOT update ownership yet).

**Request:**
```bash
curl -X POST http://localhost:3000/api/trade/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "seller": "Pacific Rim Traders",
    "buyer": "Quantum Capital Partners",
    "amount": 15000000,
    "loan_id": "LN-2024-8392",
    "percentage": 45.0
  }'
```

**Response:**
```json
{
  "success": true,
  "trade": {
    "id": "TRD-1736789234567-ABC123XYZ",
    "loan_id": "LN-2024-8392",
    "seller": "Pacific Rim Traders",
    "buyer": "Quantum Capital Partners",
    "amount": 15000000,
    "percentage": 45.0,
    "status": "pending",
    "created_at": "2026-01-13T10:30:45.123Z"
  }
}
```

**Important:** This does NOT transfer ownership. Trade is logged but awaits approval.

---

### 5. Approve Trade
**POST** `/api/trade/approve`

Executes ownership transfer and updates trade status to `approved`.

**Request:**
```bash
curl -X POST http://localhost:3000/api/trade/approve \
  -H "Content-Type: application/json" \
  -d '{
    "trade_id": "TRD-1736789234567-ABC123XYZ"
  }'
```

**Response:**
```json
{
  "success": true,
  "trade": {
    "id": "TRD-1736789234567-ABC123XYZ",
    "loan_id": "LN-2024-8392",
    "seller": "Pacific Rim Traders",
    "buyer": "Quantum Capital Partners",
    "amount": 15000000,
    "percentage": 45.0,
    "status": "approved",
    "created_at": "2026-01-13T10:30:45.123Z",
    "approved_at": "2026-01-13T10:35:12.456Z",
    "hash": "a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1"
  },
  "ownership": [
    { "name": "Quantum Capital Partners", "share": 45.0 },
    { "name": "Sovereign Wealth I", "share": 30.0 },
    { "name": "Maritime Ventures", "share": 25.0 }
  ]
}
```

**What Happens:**
1. Finds trade event by ID
2. Subtracts `percentage` from seller's share
3. Adds `percentage` to buyer's share (or creates new owner)
4. Removes seller if they have 0% ownership
5. Updates trade status to `approved`
6. Generates SHA-256 hash (blockchain simulation)

**Error Cases:**
- Trade not found → 404
- Already approved → 400
- Seller has insufficient ownership → 400

---

### 6. Get Trade Events
**GET** `/api/trade/events`

Returns all trade events with optional filtering.

**Query Parameters:**
- `loan_id` (optional) - Filter by loan ID
- `status` (optional) - Filter by status (`pending`, `approved`, `rejected`)

**Request:**
```bash
# Get all events
curl http://localhost:3000/api/trade/events

# Get events for specific loan
curl http://localhost:3000/api/trade/events?loan_id=LN-2024-8392

# Get pending trades
curl http://localhost:3000/api/trade/events?status=pending
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "events": [
    {
      "id": "TRD-1736789234567-ABC123XYZ",
      "loan_id": "LN-2024-8392",
      "seller": "Pacific Rim Traders",
      "buyer": "Quantum Capital Partners",
      "amount": 15000000,
      "percentage": 45.0,
      "status": "approved",
      "created_at": "2026-01-13T10:30:45.123Z",
      "approved_at": "2026-01-13T10:35:12.456Z",
      "hash": "a3f8b2c1..."
    },
    { ... }
  ]
}
```

---

### 7. Get Loan Owners
**GET** `/api/trade/owners`

Returns ownership structure for loans.

**Query Parameters:**
- `loan_id` (optional) - Get owners for specific loan

**Request:**
```bash
# Get all loans and their owners
curl http://localhost:3000/api/trade/owners

# Get owners for specific loan
curl http://localhost:3000/api/trade/owners?loan_id=LN-2024-8392
```

**Response (All Loans):**
```json
{
  "success": true,
  "loans": [
    {
      "loan_id": "LN-2024-8392",
      "owners": [
        { "name": "Pacific Rim Traders", "share": 45.0 },
        { "name": "Sovereign Wealth I", "share": 30.0 },
        { "name": "Maritime Ventures", "share": 25.0 }
      ],
      "total_ownership": 100.0
    },
    {
      "loan_id": "loan-001",
      "owners": [
        { "name": "Bank A", "share": 40.0 },
        { "name": "Bank B", "share": 60.0 }
      ],
      "total_ownership": 100.0
    }
  ]
}
```

**Response (Specific Loan):**
```json
{
  "success": true,
  "loan_id": "LN-2024-8392",
  "owners": [
    { "name": "Quantum Capital Partners", "share": 45.0 },
    { "name": "Sovereign Wealth I", "share": 30.0 },
    { "name": "Maritime Ventures", "share": 25.0 }
  ],
  "total_ownership": 100.0
}
```

---

## Complete Workflow Example

```bash
# Step 1: Upload PDF
UPLOAD_RESPONSE=$(curl -X POST http://localhost:3000/api/trade/upload \
  -F "file=@notice.pdf")

BASE64=$(echo $UPLOAD_RESPONSE | jq -r '.base64')

# Step 2: Parse with Gemini AI
PARSE_RESPONSE=$(curl -X POST http://localhost:3000/api/trade/parse \
  -H "Content-Type: application/json" \
  -d "{\"base64\": \"$BASE64\", \"mimeType\": \"application/pdf\"}")

TRADE_DATA=$(echo $PARSE_RESPONSE | jq '.data')

# Step 3: Validate
VALIDATE_RESPONSE=$(curl -X POST http://localhost:3000/api/trade/validate \
  -H "Content-Type: application/json" \
  -d "$TRADE_DATA")

# Step 4: Confirm (record trade)
CONFIRM_RESPONSE=$(curl -X POST http://localhost:3000/api/trade/confirm \
  -H "Content-Type: application/json" \
  -d "$TRADE_DATA")

TRADE_ID=$(echo $CONFIRM_RESPONSE | jq -r '.trade.id')

# Step 5: Approve (execute ownership transfer)
APPROVE_RESPONSE=$(curl -X POST http://localhost:3000/api/trade/approve \
  -H "Content-Type: application/json" \
  -d "{\"trade_id\": \"$TRADE_ID\"}")

echo "Trade hash: $(echo $APPROVE_RESPONSE | jq -r '.trade.hash')"

# Step 6: Verify ownership changed
curl http://localhost:3000/api/trade/owners?loan_id=LN-2024-8392
```

---

## Blockchain Simulation

On approval, a SHA-256 hash is generated:

```typescript
hash = sha256(JSON.stringify({
  id,
  loan_id,
  seller,
  buyer,
  amount,
  percentage,
  status,
  approved_at
}))
```

This simulates immutable blockchain recording without actual chain calls.

---

## Error Handling Philosophy

**No Mocks. No Silent Fallbacks. Honest Failures.**

- ❌ Gemini API key missing → `503 Service Unavailable`
- ❌ Gemini returns invalid JSON → `500 Internal Server Error`
- ❌ Confidence < 0.6 → `422 Unprocessable Entity`
- ❌ Missing fields → `422 Unprocessable Entity`
- ❌ Validation fails → `200 OK` with `valid: false`
- ❌ Trade not found → `404 Not Found`
- ❌ Insufficient ownership → `400 Bad Request`

All errors include descriptive messages for debugging.

---

## Testing

```bash
# Test AI parsing with mock data
curl -X POST http://localhost:3000/api/trade/parse \
  -H "Content-Type: application/json" \
  -d '{"base64": "mock-base64-here", "mimeType": "application/pdf"}'

# Test validation rules
curl -X POST http://localhost:3000/api/trade/validate \
  -H "Content-Type: application/json" \
  -d '{
    "seller": "Nonexistent Bank",
    "buyer": "Fund X",
    "amount": 1000000,
    "loan_id": "invalid-loan",
    "percentage": 150
  }'

# View all trades
curl http://localhost:3000/api/trade/events

# View ownership
curl http://localhost:3000/api/trade/owners
```

---

## Architecture

```
Frontend (TradeClear Page)
    ↓
Upload PDF → /api/trade/upload (returns base64)
    ↓
Parse AI → /api/trade/parse (Gemini 2.5 Pro extraction)
    ↓
Validate → /api/trade/validate (ownership checks)
    ↓
Confirm → /api/trade/confirm (record pending trade)
    ↓
Approve → /api/trade/approve (execute transfer + hash)
    ↓
Query → /api/trade/events + /api/trade/owners
```

**State Management:**
- `loanOwners`: Current ownership (mutated on approval)
- `tradeEvents`: Immutable audit trail (append-only)

---

## Environment Variables

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Without this key, parsing endpoint will return `503 Service Unavailable`.

---

## Future Enhancements

- [ ] Persistent storage (Supabase)
- [ ] Real blockchain integration (Polygon)
- [ ] Multi-signature approval workflow
- [ ] Trade rejection endpoint
- [ ] Email notifications
- [ ] Audit log export

---

Built with ❤️ for CovenantGuard TradeClear
