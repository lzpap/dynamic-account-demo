# iSafe Architecture Documentation

This document describes the architecture of the iSafe decentralized application, a multi-signature account management system built on the IOTA blockchain.

## System Overview

iSafe implements a **Dynamic Authentication Scheme** that enables:
- Creating shared custody accounts with weighted member approval
- Proposing, approving, and executing transactions through multi-signature voting
- Dynamic member and threshold management
- Account migration with authenticator rotation capabilities

---

## Architectural Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    USER LAYER                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │                         Frontend dApp (Next.js 16)                              ││
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ ││
│  │  │  Create     │  │   Account    │  │ Transactions │  │      Settings         │ ││
│  │  │  Account    │  │   Dashboard  │  │    View      │  │   (Members/Threshold) │ ││
│  │  └─────────────┘  └──────────────┘  └──────────────┘  └───────────────────────┘ ││
│  │                                      │                                           ││
│  │  ┌───────────────────────────────────┴───────────────────────────────────────┐  ││
│  │  │                    React Hooks & Providers                                 │  ││
│  │  │  useGetMembers | useGetThreshold | useGetAccountTransactions | etc.       │  ││
│  │  └───────────────────────────────────┬───────────────────────────────────────┘  ││
│  └──────────────────────────────────────┼──────────────────────────────────────────┘│
└─────────────────────────────────────────┼───────────────────────────────────────────┘
                                          │
         ┌────────────────────────────────┼────────────────────────────────┐
         │                                │                                │
         ▼                                ▼                                ▼
┌─────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────┐
│   IOTA Wallet SDK   │      │   iSafe Indexer         │      │   TX Service        │
│   (@iota/dapp-kit)  │      │   (Rust/Axum)           │      │   (Rust/Axum)       │
│                     │      │   :3030                 │      │   :3031             │
│  ┌───────────────┐  │      │                         │      │                     │
│  │ Sign & Execute│  │      │  GET /accounts/{addr}   │      │  POST /add_tx       │
│  │ Transactions  │  │      │  GET /transactions/{id} │      │  GET /transaction   │
│  └───────────────┘  │      │  GET /events/{id}       │      │                     │
└──────────┬──────────┘      └───────────┬─────────────┘      └──────────┬──────────┘
           │                             │                               │
           │                             │ Checkpoint                    │
           │                             │ Processing                    │
           │                             │                               │
           ▼                             ▼                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              IOTA BLOCKCHAIN LAYER                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │                         iSafe Move Smart Contracts                              ││
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  ┌───────────────┐  ││
│  │  │   account.move  │  │  members.move   │  │transactions  │  │ dynamic_auth  │  ││
│  │  │                 │  │                 │  │   .move      │  │    .move      │  ││
│  │  │ - Account mgmt  │  │ - Member CRUD   │  │              │  │               │  ││
│  │  │ - Authenticator │  │ - Weight mgmt   │  │ - Propose    │  │ - Orchestrator│  ││
│  │  │   rotation      │  │ - Validation    │  │ - Approve    │  │ - Authenticate│  ││
│  │  │ - Dynamic fields│  │                 │  │ - Execute    │  │ - Events      │  ││
│  │  └─────────────────┘  └─────────────────┘  └──────────────┘  └───────────────┘  ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │                              Emitted Events                                     ││
│  │  AccountCreated | MemberAdded | MemberRemoved | ThresholdChanged |              ││
│  │  TransactionProposed | TransactionApproved | TransactionExecuted | ...         ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          │ Events (BCS)
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               PERSISTENCE LAYER                                      │
│  ┌──────────────────────────────────┐    ┌──────────────────────────────────────┐   │
│  │     iSafe Indexer Database       │    │      TX Service Database             │   │
│  │         (SQLite)                 │    │         (SQLite)                     │   │
│  │                                  │    │                                      │   │
│  │  ┌────────────┐ ┌─────────────┐  │    │  ┌──────────────────────────────────┐│   │
│  │  │  accounts  │ │   members   │  │    │  │         transactions             ││   │
│  │  └────────────┘ └─────────────┘  │    │  │  digest | sender | tx_data | ... ││   │
│  │  ┌────────────┐ ┌─────────────┐  │    │  └──────────────────────────────────┘│   │
│  │  │transactions│ │  approvals  │  │    │                                      │   │
│  │  └────────────┘ └─────────────┘  │    │                                      │   │
│  │  ┌────────────┐                  │    │                                      │   │
│  │  │   events   │                  │    │                                      │   │
│  │  └────────────┘                  │    │                                      │   │
│  └──────────────────────────────────┘    └──────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. iSafe Move Smart Contracts (`contracts/isafe/`)

**Purpose**: Core on-chain logic implementing a multi-signature account management system using IOTA's Dynamic Authentication framework.

**Technology**: Move language on IOTA blockchain

**Modules**:

| Module | Purpose |
|--------|---------|
| `account.move` | Base Account object management, authenticator authorization, dynamic field operations |
| `members.move` | Member collection management with weighted voting power |
| `transactions.move` | Transaction proposal tracking and approval collection |
| `dynamic_auth.move` | Core orchestrator - authentication, multi-sig approval flow, event emission |

**Key Data Structures**:
```move
Account { id: UID, allowed_authenticators: Table<String, bool> }
Member  { addr: address, weight: u64 }
Transaction { digest: vector<u8>, approves: vector<address> }
```

**Events Emitted**:
- `AccountCreatedEvent` / `AccountRotatedEvent`
- `MemberAddedEvent` / `MemberRemovedEvent` / `MemberWeightUpdatedEvent`
- `ThresholdChangedEvent` / `GuardianChangedEvent`
- `TransactionProposedEvent` / `TransactionApprovedEvent` / `TransactionExecutedEvent`
- `TransactionApprovalThresholdReachedEvent` / `TransactionRemovedEvent`

**Key Entry Functions**:
- `create_account(members, weights, threshold, ...)` - Create new multi-sig account
- `propose_transaction(account, digest)` - Propose a transaction for approval
- `approve_transaction(account, digest)` - Add approval vote
- `add_member()` / `remove_member()` / `update_member_weight()` / `set_threshold()`

---

### 2. Custom Indexer (`indexer/`)

**Purpose**: Processes blockchain checkpoints to index iSafe events and provide queryable REST API for account state.

**Technology Stack**:
- Rust with Tokio async runtime
- Axum web framework
- SQLite with Diesel ORM
- iota-data-ingestion-core for checkpoint processing

**API Endpoints** (Port 3030):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/accounts/{member_address}` | GET | Get all iSafe accounts for a member |
| `/transactions/{account_address}` | GET | Get transaction summaries with approval status |
| `/events/{account_address}` | GET | Get all events for an account |

**Database Schema**:
```
accounts(account_address PK, threshold, authenticator, created_at)
members(id PK, account_address FK, member_address, weight, added_at)
transactions(transaction_digest PK, account_address PK, proposer_address, status, created_at)
approvals(transaction_digest PK, approver_address PK, account_address, approver_weight, approved_at)
events(id PK, account_address, firing_tx_digest, event_type, content, timestamp)
```

**Data Flow**:
1. Reads checkpoints from IOTA node sequentially
2. Filters events by iSafe package address
3. Deserializes BCS-encoded event data
4. Updates database tables accordingly
5. Exposes current state via REST API

---

### 3. Transaction Service (`tx-service/`)

**Purpose**: Transaction storage and retrieval microservice for managing the transaction lifecycle in multi-signature workflows.

**Technology Stack**:
- Rust with Tokio async runtime
- Axum web framework
- SQLite with Diesel ORM
- IOTA SDK for transaction processing

**API Endpoints** (Port 3031):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/transaction/{tx_digest}` | GET | Retrieve transaction by digest |
| `/add_transaction` | POST | Store new transaction (body: `{tx_bytes, description}`) |
| `/derive_auth_signature/{address}` | GET | Derive Move authenticator for shared objects |

**Database Schema**:
```
transactions(digest PK, sender, added_at, tx_data, description)
```

**Data Flow**:
1. dApp sends Base64-encoded transaction bytes
2. Service deserializes and computes digest
3. Stores in SQLite with metadata
4. Returns digest for reference in proposal flow
5. Transactions retrievable by digest for approval/execution

---

### 4. Frontend dApp (`dapp/`)

**Purpose**: User interface for creating accounts, managing members, proposing/approving/executing transactions.

**Technology Stack**:
- Next.js 16 with React 19
- TypeScript
- Tailwind CSS
- @iota/dapp-kit for wallet integration
- @tanstack/react-query for state management

**Pages**:

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/create` | Create new iSafe account |
| `/[account]` | Account dashboard (balance, members, activity) |
| `/[account]/transactions` | Transaction management (Proposed/Approved/Executed tabs) |
| `/[account]/settings` | Member and threshold configuration |

**Key Hooks**:
- `useGetMembers(accountId)` - Fetch account members
- `useGetThreshold(accountId)` - Fetch approval threshold
- `useGetAccountTransactions(accountId)` - Fetch from indexer
- `useGetAccountEvents(accountId)` - Fetch event history
- `useGetAccountsForAddress(walletAddress)` - Get owned accounts

**External Integrations**:
- IOTA Wallet (signing transactions)
- iSafe Indexer API (account/transaction/event queries)
- TX Service API (transaction storage)
- IOTA RPC (direct blockchain reads via Move view functions)

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           MULTI-SIGNATURE TRANSACTION FLOW                          │
└─────────────────────────────────────────────────────────────────────────────────────┘

1. ACCOUNT CREATION
   ┌──────────┐                    ┌──────────────────┐                 ┌────────────┐
   │   User   │ ──── create() ───▶│  Smart Contract  │ ──── emit ────▶ │  Indexer   │
   │  (dApp)  │                    │  dynamic_auth    │                 │  (events)  │
   └──────────┘                    └──────────────────┘                 └────────────┘
                                           │
                                           ▼
                                   AccountCreatedEvent
                                   {account, members, threshold}

2. TRANSACTION PROPOSAL
   ┌──────────┐        ┌─────────────┐        ┌──────────────────┐        ┌──────────┐
   │  Member  │ ─tx──▶ │ TX Service  │        │  Smart Contract  │ ─────▶ │ Indexer  │
   │  (dApp)  │        │  /add_tx    │        │  propose_tx()    │        │          │
   └──────────┘        └─────────────┘        └──────────────────┘        └──────────┘
       │                     │                        │
       │                     ▼                        ▼
       │              Store tx_bytes          TransactionProposedEvent
       │                                      {digest, proposer}
       │
       └──────────────── sign & execute ─────────────▶

3. TRANSACTION APPROVAL
   ┌──────────┐                    ┌──────────────────┐                 ┌────────────┐
   │  Member  │ ── approve_tx() ──▶│  Smart Contract  │ ──── emit ────▶ │  Indexer   │
   │  (dApp)  │                    │  dynamic_auth    │                 │  (update)  │
   └──────────┘                    └──────────────────┘                 └────────────┘
                                           │
                                           ▼
                                   TransactionApprovedEvent
                                   {digest, approver, weight}
                                           │
                                           ▼ (if weight >= threshold)
                                   TransactionApprovalThresholdReachedEvent

4. TRANSACTION EXECUTION
   ┌──────────┐        ┌─────────────┐        ┌──────────────────┐        ┌──────────┐
   │  Member  │ ─get──▶│ TX Service  │        │  Smart Contract  │ ─────▶ │ Indexer  │
   │  (dApp)  │        │  /tx/{id}   │        │  authenticate()  │        │          │
   └──────────┘        └─────────────┘        └──────────────────┘        └──────────┘
       │                     │                        │
       │                     ▼                        ▼
       │              Return tx_bytes          TransactionExecutedEvent
       │                                       {digest, approvers, threshold}
       │
       └──────────────── sign & execute ─────────────▶

5. SETTINGS MANAGEMENT
   ┌──────────┐                    ┌──────────────────┐                 ┌────────────┐
   │  Account │ ── add_member() ──▶│  Smart Contract  │ ──── emit ────▶ │  Indexer   │
   │  (dApp)  │    set_threshold() │  dynamic_auth    │                 │  (update)  │
   └──────────┘                    └──────────────────┘                 └────────────┘
                                           │
                                           ▼
                                   MemberAddedEvent / ThresholdChangedEvent
```

---

## Interface Specifications

### Smart Contract ↔ Blockchain

| Interface | Type | Description |
|-----------|------|-------------|
| Entry Functions | Move | Public functions callable via transactions |
| View Functions | Move | Read-only functions for querying state |
| Events | BCS | Serialized events emitted on state changes |
| Dynamic Fields | Move | Key-value storage on Account objects |

### Indexer ↔ Blockchain

| Interface | Type | Description |
|-----------|------|-------------|
| Checkpoint API | HTTP/REST | Sequential checkpoint fetching |
| Event Parsing | BCS | Deserialize events from checkpoints |

### Frontend ↔ Services

| Service | Endpoint | Method | Purpose |
|---------|----------|--------|---------|
| Indexer | `/accounts/{addr}` | GET | List member's accounts |
| Indexer | `/transactions/{id}` | GET | Get transaction summaries |
| Indexer | `/events/{id}` | GET | Get account events |
| TX Service | `/add_transaction` | POST | Store transaction bytes |
| TX Service | `/transaction/{digest}` | GET | Retrieve transaction |

### Frontend ↔ Blockchain

| Interface | Method | Purpose |
|-----------|--------|---------|
| `@iota/dapp-kit` | useSignAndExecuteTransaction | Sign and submit transactions |
| `@iota/iota-sdk` | client.view() | Call Move view functions |
| `@iota/iota-sdk` | client.getObject() | Fetch on-chain objects |
| `@iota/iota-sdk` | client.simulateTransaction() | Dry-run validation |

---

## Security Considerations

1. **On-Chain Security**:
   - Only account itself (via authenticator) can modify members/threshold
   - At least one authenticator must always be attached
   - Member removal validates threshold can still be met
   - Duplicate approvals prevented
   - Transaction digests must be exactly 32 bytes (SHA-256)

2. **Service Security**:
   - CORS enabled for cross-origin requests
   - Services run on localhost by default
   - No authentication on service endpoints (assumed trusted network)

3. **Frontend Security**:
   - Wallet-based authentication
   - Transaction simulation before execution
   - Input validation (addresses, thresholds)

---

## Deployment Configuration

| Component | Default Port | Database | Configuration |
|-----------|--------------|----------|---------------|
| Indexer | 3030 | `./data/isafe.db` | `ISAFE_PACKAGE_ADDRESS` env var |
| TX Service | 3031 | `./data/tx.db` | CLI arguments |
| Frontend | 3000 | N/A | `config/` directory |
| IOTA Node | 9000 | N/A | External dependency |
