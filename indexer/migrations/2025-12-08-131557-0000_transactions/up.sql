-- Your SQL goes here
CREATE TABLE IF NOT EXISTS transactions (
    transaction_digest TEXT NOT NULL,
    account_address TEXT NOT NULL,
    proposer_address TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (transaction_digest, account_address),
    FOREIGN KEY (account_address) REFERENCES accounts(account_address) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS approvals (
    transaction_digest TEXT NOT NULL,
    account_address TEXT NOT NULL,
    approver_address TEXT NOT NULL,
    approved_at INTEGER NOT NULL,
    approver_weight INTEGER NOT NULL,
    PRIMARY KEY (transaction_digest, approver_address),
    FOREIGN KEY (transaction_digest, account_address) REFERENCES transactions(transaction_digest, account_address) ON DELETE CASCADE
);