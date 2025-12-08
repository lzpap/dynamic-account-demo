-- Your SQL goes here
CREATE TABLE IF NOT EXISTS transactions (
    transaction_digest TEXT NOT NULL PRIMARY KEY,
    account_address TEXT NOT NULL,
    proposer_address TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS approvals (
    transaction_digest TEXT NOT NULL,
    approver_address TEXT NOT NULL,
    approved_at INTEGER NOT NULL,
    approver_weight INTEGER NOT NULL,
    PRIMARY KEY (transaction_digest, approver_address),
    FOREIGN KEY (transaction_digest) REFERENCES transactions(transaction_digest) ON DELETE CASCADE
);