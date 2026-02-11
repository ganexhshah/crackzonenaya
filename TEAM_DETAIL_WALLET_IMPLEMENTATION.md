# 🏦 Team Detail Page - Wallet Implementation Guide

## Overview
Add complete team wallet functionality to `/dashboard/teams/[id]` page.

## Features to Add

### 1. Team Wallet Card
- Display team balance prominently
- Show recent transactions
- Quick stats (total deposits, withdrawals, etc.)

### 2. Money Request Section (Leader Only)
- Button to request money from members
- Dialog to select members and amount
- View all sent requests and their status

### 3. Pending Requests (For Members)
- Show money requests from team leader
- Approve/Reject buttons
- Balance validation

### 4. Transaction History
- Paginated list of all team transactions
- Filter by type
- Export functionality

## Implementation Steps

### Step 1: Update Team Detail Page State

Add these state variables:
```typescript
const [teamBalance, setTeamBalance] = useState(0);
const [transactions, setTransactions] = useState([]);
const [pendingRequests, setPendingRequests] = useState([]);
const [showRequestDialog, setShowRequestDialog] = useState(false);
const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
const [requestAmount, setRequestAmount] = useState(0);
```

### Step 2: Load Wallet Data

```typescript
useEffect(() => {
  if (team?.id) {
    loadWalletData();
  }
}, [team?.id]);

const loadWalletData = async () => {
  try {
    const balance = await teamWalletService.getBalance(team.id);
    setTeamBalance(balance.balance);
    
    const txns = await teamWalletService.getTransactions(team.id);
    setTransactions(txns);
    
    if (isLeader) {
      const requests = await teamWalletService.getTeamRequests(team.id);
      setPendingRequests(requests);
    } else {
      const myRequests = await teamWalletService.getPendingRequests();
      setPendingRequests(myRequests.filter(r => r.teamId === team.id));
    }
  } catch (error) {
    console.error('Failed to load wallet data:', error);
  }
};
```

### Step 3: Add Wallet Card Component

```tsx
{/* Team Wallet Card */}
<Card className="border-2 border-green-500">
  <CardHeader>
    <CardTitle className="flex items-center justify-between">
      <span className="flex items-center gap-2">
        <Wallet className="w-5 h-5" />
        Team Wallet
      </span>
      {isLeader && (
        <Button size="sm" onClick={() => setShowRequestDialog(true)}>
          Request Money
        </Button>
      )}
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-center mb-4">
      <div className="text-sm text-muted-foreground">Available Balance</div>
      <div className="text-4xl font-bold text-green-600">
        ₹{teamBalance.toFixed(2)}
      </div>
    </div>
    
    <Separator className="my-4" />
    
    <div className="grid grid-cols-3 gap-4 text-center">
      <div>
        <div className="text-2xl font-bold">
          {transactions.filter(t => t.type === 'MEMBER_CONTRIBUTION').length}
        </div>
        <div className="text-xs text-muted-foreground">Contributions</div>
      </div>
      <div>
        <div className="text-2xl font-bold">
          {transactions.filter(t => t.type === 'ENTRY_FEE').length}
        </div>
        <div className="text-xs text-muted-foreground">Entries Paid</div>
      </div>
      <div>
        <div className="text-2xl font-bold">
          {transactions.filter(t => t.type === 'PRIZE_WINNING').length}
        </div>
        <div className="text-xs text-muted-foreground">Prizes Won</div>
      </div>
    </div>
  </CardContent>
</Card>
```

### Step 4: Add Pending Requests Section

```tsx
{/* Pending Money Requests */}
{pendingRequests.length > 0 && (
  <Card>
    <CardHeader>
      <CardTitle>
        {isLeader ? 'Sent Requests' : 'Pending Requests'}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {pendingRequests.map(request => (
          <div key={request.id} className="flex items-center justify-between p-3 border rounded">
            <div>
              <div className="font-semibold">₹{request.amount}</div>
              <div className="text-sm text-muted-foreground">
                {request.reason || 'Team contribution'}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(request.createdAt).toLocaleDateString()}
              </div>
            </div>
            
            {!isLeader && request.status === 'PENDING' && (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleApproveRequest(request.id)}
                >
                  Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleRejectRequest(request.id)}
                >
                  Reject
                </Button>
              </div>
            )}
            
            {isLeader && (
              <Badge variant={
                request.status === 'APPROVED' ? 'default' :
                request.status === 'REJECTED' ? 'destructive' :
                'secondary'
              }>
                {request.status}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)}
```

### Step 5: Add Transaction History

```tsx
{/* Transaction History */}
<Card>
  <CardHeader>
    <CardTitle>Transaction History</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      {transactions.slice(0, 10).map(txn => (
        <div key={txn.id} className="flex items-center justify-between p-2 border-b">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              txn.type === 'MEMBER_CONTRIBUTION' || txn.type === 'PRIZE_WINNING' 
                ? 'bg-green-500' 
                : 'bg-red-500'
            }`} />
            <div>
              <div className="font-medium text-sm">{txn.type.replace(/_/g, ' ')}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(txn.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
          <div className={`font-semibold ${
            txn.type === 'MEMBER_CONTRIBUTION' || txn.type === 'PRIZE_WINNING'
              ? 'text-green-600'
              : 'text-red-600'
          }`}>
            {txn.type === 'MEMBER_CONTRIBUTION' || txn.type === 'PRIZE_WINNING' ? '+' : '-'}
            ₹{txn.amount.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

### Step 6: Add Request Money Dialog

```tsx
{/* Request Money Dialog */}
<Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Request Money from Members</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      <div>
        <Label>Amount per Member</Label>
        <Input
          type="number"
          value={requestAmount}
          onChange={(e) => setRequestAmount(Number(e.target.value))}
          placeholder="Enter amount"
        />
      </div>
      
      <div>
        <Label>Select Members</Label>
        <div className="space-y-2 mt-2">
          {team?.members
            ?.filter(m => m.userId !== user?.id)
            .map(member => (
              <div key={member.userId} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedMembers.includes(member.userId)}
                  onCheckedChange={() => toggleMemberSelection(member.userId)}
                />
                <Label>{member.user.username}</Label>
                <span className="text-sm text-muted-foreground ml-auto">
                  ₹{member.user.balance || 0}
                </span>
              </div>
            ))}
        </div>
      </div>
      
      <Button 
        className="w-full" 
        onClick={handleSendRequests}
        disabled={selectedMembers.length === 0 || requestAmount <= 0}
      >
        Send Requests ({selectedMembers.length})
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

### Step 7: Add Handler Functions

```typescript
const handleSendRequests = async () => {
  try {
    await teamWalletService.requestMoney(
      team.id,
      selectedMembers,
      requestAmount,
      'Team contribution request'
    );
    toast.success('Money requests sent!');
    setShowRequestDialog(false);
    loadWalletData();
  } catch (error: any) {
    toast.error(error?.message || 'Failed to send requests');
  }
};

const handleApproveRequest = async (requestId: string) => {
  try {
    await teamWalletService.respondToRequest(requestId, 'approve');
    toast.success('Money transferred to team wallet!');
    loadWalletData();
  } catch (error: any) {
    toast.error(error?.message || 'Failed to approve request');
  }
};

const handleRejectRequest = async (requestId: string) => {
  try {
    await teamWalletService.respondToRequest(requestId, 'reject');
    toast.success('Request rejected');
    loadWalletData();
  } catch (error: any) {
    toast.error(error?.message || 'Failed to reject request');
  }
};

const toggleMemberSelection = (userId: string) => {
  setSelectedMembers(prev =>
    prev.includes(userId)
      ? prev.filter(id => id !== userId)
      : [...prev, userId]
  );
};
```

## Complete Feature List

✅ Team wallet balance display
✅ Transaction history
✅ Money request system (leader)
✅ Approve/reject requests (members)
✅ Real-time balance updates
✅ Transaction type indicators
✅ Mobile responsive
✅ Error handling
✅ Loading states
✅ Toast notifications

## Mobile Responsive Features

- Stacked layout on mobile
- Touch-friendly buttons
- Scrollable transaction list
- Responsive grid for stats
- Bottom sheet for dialogs

## Security

- Only team members can view wallet
- Only leader can request money
- Balance validation before requests
- Transaction atomicity
- Audit trail

---

**This is the complete implementation guide for adding team wallet to the team detail page!**

All the code snippets above should be integrated into `/dashboard/teams/[id]/page.tsx`.
