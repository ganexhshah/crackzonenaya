# 🏦 Team Wallet System - Complete Implementation Guide

## 📋 Overview

The Team Wallet System allows teams to manage shared funds for tournament/scrim entries, with automatic entry fee splitting and prize distribution.

## 🎯 Key Features

### 1. **Team Wallet**
- Each team has its own wallet balance
- Separate from individual player wallets
- Used for team entry fees and receives team prizes

### 2. **Entry Fee Splitting**
- For 4-player team scrims: Entry fee ÷ 4 = per player contribution
- Leader requests money from team members
- Members approve and money transfers to team wallet

### 3. **Money Request System**
- Team leader creates money requests
- System checks if members have sufficient balance
- Members receive notifications
- Members approve/reject requests
- Approved money automatically transfers to team wallet

### 4. **Prize Distribution**
- Team winnings go directly to team wallet
- Team can manage prize distribution internally

## 🗄️ Database Schema

### New Tables Added:

```prisma
model Team {
  balance       Float     @default(0)  // NEW: Team wallet balance
  transactions  TeamTransaction[]      // NEW
  moneyRequests TeamMoneyRequest[]     // NEW
}

model TeamTransaction {
  id            String
  teamId        String
  userId        String?
  type          TeamTransactionType
  amount        Float
  description   String?
  reference     String?
  createdAt     DateTime
}

enum TeamTransactionType {
  DEPOSIT
  WITHDRAWAL
  ENTRY_FEE
  PRIZE_WINNING
  MEMBER_CONTRIBUTION
  REFUND
}

model TeamMoneyRequest {
  id            String
  teamId        String
  requestedBy   String    // Team leader ID
  requestedFrom String    // Member ID
  amount        Float
  reason        String?
  status        MoneyRequestStatus
  createdAt     DateTime
  respondedAt   DateTime?
}

enum MoneyRequestStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}
```

## 🔄 Complete Flow

### Scenario: 4-Player Team Scrim Registration

#### Step 1: User Clicks Register
```
User clicks "Register" on scrim page
↓
System checks:
- Is this a team scrim? (SQUAD/DUO)
- Does user have a team?
- Is user the team leader?
```

#### Step 2: Team Validation
```
If NO TEAM:
  → Show error: "You need to join a team first"
  → Redirect to teams page

If NOT LEADER:
  → Show error: "Only team leader can register"
  → Suggest contacting team leader

If IS LEADER:
  → Proceed to Step 3
```

#### Step 3: Calculate Split Entry Fee
```
Entry Fee: ₹100
Team Size: 4 players
Per Player: ₹100 ÷ 4 = ₹25

System checks:
- Team wallet balance: ₹0 (insufficient)
- Need to collect from members
```

#### Step 4: Money Request Dialog
```
Show dialog:
┌─────────────────────────────────────┐
│  Team Entry Fee Required            │
├─────────────────────────────────────┤
│  Total Entry Fee: ₹100              │
│  Team Wallet: ₹0                    │
│  Need to Collect: ₹100              │
│                                     │
│  Per Member Contribution: ₹25       │
│                                     │
│  Select Members:                    │
│  ☑ Player 2 (Balance: ₹50) ✓       │
│  ☑ Player 3 (Balance: ₹30) ✓       │
│  ☑ Player 4 (Balance: ₹20) ✗       │
│                                     │
│  ⚠️ Player 4 has insufficient       │
│     balance (₹20 < ₹25)            │
│                                     │
│  [Request Money from Selected]      │
└─────────────────────────────────────┘
```

#### Step 5: Send Money Requests
```
Leader clicks "Request Money"
↓
System creates money requests:
- Request to Player 2: ₹25
- Request to Player 3: ₹25
- Request to Player 4: ₹25 (will fail)
↓
Notifications sent to members
```

#### Step 6: Member Approval
```
Player 2 Dashboard:
┌─────────────────────────────────────┐
│  💰 Money Request                   │
├─────────────────────────────────────┤
│  From: Team Alpha                   │
│  Amount: ₹25                        │
│  Reason: Scrim entry fee            │
│  Your Balance: ₹50                  │
│                                     │
│  [Approve] [Reject]                 │
└─────────────────────────────────────┘

Player clicks "Approve"
↓
Transaction executed:
1. Deduct ₹25 from Player 2 wallet
2. Add ₹25 to Team wallet
3. Create transaction records
4. Update request status
```

#### Step 7: Team Wallet Updated
```
After all approvals:
Team Wallet: ₹0 + ₹25 + ₹25 + ₹25 = ₹75

Still need ₹25 from Player 4
Leader can:
- Wait for Player 4 to add money
- Find substitute player
- Cancel registration
```

#### Step 8: Registration Complete
```
Once team wallet has ₹100:
↓
Leader clicks "Register"
↓
System:
1. Deducts ₹100 from team wallet
2. Registers team for scrim
3. Creates team transaction record
4. Sends confirmation to all members
```

#### Step 9: Prize Distribution
```
Team wins ₹500:
↓
System:
1. Adds ₹500 to team wallet
2. Creates PRIZE_WINNING transaction
3. Notifies all team members
↓
Team wallet: ₹500
Leader can distribute or save for next entry
```

## 🔌 API Endpoints

### Team Wallet Endpoints

```typescript
// Get team wallet balance
GET /api/team-wallet/:teamId/balance
Response: { balance: number }

// Get team transactions
GET /api/team-wallet/:teamId/transactions
Response: TeamTransaction[]

// Request money from members (leader only)
POST /api/team-wallet/:teamId/request-money
Body: {
  memberIds: string[],
  amountPerMember: number,
  reason?: string
}
Response: {
  message: string,
  requests: MoneyRequest[]
}

// Get pending requests for current user
GET /api/team-wallet/requests/pending
Response: MoneyRequest[]

// Approve/Reject money request
POST /api/team-wallet/requests/:requestId/respond
Body: { action: 'approve' | 'reject' }
Response: { message: string }

// Get team requests (leader only)
GET /api/team-wallet/:teamId/requests
Response: MoneyRequest[]
```

## 💻 Frontend Implementation

### 1. Scrim Registration with Team Check

```typescript
// In scrim detail page
const handleRegister = async () => {
  const scrimType = scrim.scrimConfig?.basicInformation?.scrimType;
  
  // Check if team scrim
  if (scrimType === 'SQUAD' || scrimType === 'DUO') {
    // Check if user has team
    const userTeams = await teamService.getUserTeams();
    
    if (userTeams.length === 0) {
      toast.error('You need to join a team first');
      router.push('/dashboard/teams');
      return;
    }
    
    // Check if user is team leader
    const leaderTeam = userTeams.find(t => t.ownerId === user.id);
    
    if (!leaderTeam) {
      toast.error('Only team leader can register for team scrims');
      return;
    }
    
    // Check team wallet balance
    const { balance } = await teamWalletService.getBalance(leaderTeam.id);
    const entryFee = scrim.scrimConfig?.entryPrizeSettings?.entryFeeAmount || 0;
    
    if (balance < entryFee) {
      // Show money request dialog
      setShowMoneyRequestDialog(true);
      return;
    }
    
    // Proceed with registration
    await registerTeamForScrim(leaderTeam.id);
  } else {
    // Solo scrim - existing logic
    await registerSoloForScrim();
  }
};
```

### 2. Money Request Dialog Component

```typescript
<Dialog open={showMoneyRequestDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Team Entry Fee Required</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded">
        <div className="flex justify-between">
          <span>Total Entry Fee:</span>
          <span className="font-bold">₹{entryFee}</span>
        </div>
        <div className="flex justify-between">
          <span>Team Wallet:</span>
          <span>₹{teamBalance}</span>
        </div>
        <div className="flex justify-between text-red-600">
          <span>Need to Collect:</span>
          <span className="font-bold">₹{entryFee - teamBalance}</span>
        </div>
      </div>
      
      <div>
        <h4>Per Member Contribution</h4>
        <p className="text-2xl font-bold">
          ₹{(entryFee - teamBalance) / teamMembers.length}
        </p>
      </div>
      
      <div>
        <h4>Select Members</h4>
        {teamMembers.map(member => (
          <div key={member.id} className="flex items-center gap-2">
            <Checkbox
              checked={selectedMembers.includes(member.id)}
              onCheckedChange={(checked) => toggleMember(member.id)}
              disabled={member.balance < perMemberAmount}
            />
            <span>{member.username}</span>
            <span className={member.balance < perMemberAmount ? 'text-red-600' : 'text-green-600'}>
              (Balance: ₹{member.balance})
            </span>
          </div>
        ))}
      </div>
      
      <Button onClick={sendMoneyRequests}>
        Request Money from Selected Members
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

### 3. Money Request Notifications

```typescript
// In dashboard or team page
const [pendingRequests, setPendingRequests] = useState([]);

useEffect(() => {
  loadPendingRequests();
}, []);

const loadPendingRequests = async () => {
  const requests = await teamWalletService.getPendingRequests();
  setPendingRequests(requests);
};

const handleApprove = async (requestId: string) => {
  await teamWalletService.respondToRequest(requestId, 'approve');
  toast.success('Money transferred to team wallet');
  loadPendingRequests();
};
```

## 🚀 Setup Instructions

### 1. Update Database
```bash
cd backend
npx prisma generate
npx prisma db push
```

### 2. Restart Backend
```bash
npm run dev
```

### 3. Test the Flow
1. Create a team (or use existing)
2. Add members to team
3. Find a team scrim
4. Try to register as team leader
5. System will prompt for money requests
6. Members approve requests
7. Team wallet gets funded
8. Complete registration

## 🎨 UI Components Needed

### 1. Team Wallet Page
- Display team balance
- Show transaction history
- Money request management
- Member contribution tracking

### 2. Money Request Card
- Request details
- Approve/Reject buttons
- Balance check
- Transaction confirmation

### 3. Scrim Registration Flow
- Team validation
- Wallet balance check
- Money request dialog
- Registration confirmation

## 📊 Transaction Types

```typescript
DEPOSIT          // Manual deposit to team wallet
WITHDRAWAL       // Manual withdrawal from team wallet
ENTRY_FEE        // Deducted for scrim/tournament entry
PRIZE_WINNING    // Added when team wins
MEMBER_CONTRIBUTION // Added when member approves request
REFUND           // Refunded entry fee
```

## ✅ Benefits

1. **Fair Distribution**: Entry fees split equally among team members
2. **Transparent**: All transactions recorded and visible
3. **Automated**: No manual money transfers needed
4. **Secure**: Balance checks prevent insufficient funds
5. **Flexible**: Team can accumulate funds for future entries
6. **Prize Management**: Winnings go to team wallet for fair distribution

## 🔒 Security Features

- Only team leader can request money
- Balance validation before requests
- Transaction atomicity (all-or-nothing)
- Audit trail for all transactions
- Member authorization required
- Duplicate request prevention

## 📱 Mobile Responsive

All components are mobile-optimized:
- Touch-friendly buttons
- Responsive layouts
- Easy-to-read transaction history
- Quick approve/reject actions

---

**This system is now ready for implementation!** 🎉

All backend APIs are created, database schema is updated, and frontend services are ready. You just need to integrate the UI components into your pages.
