-- Your SQL goes here
CREATE TABLE transactions (
    digest TEXT NOT NULL PRIMARY KEY,
    sender TEXT NOT NULL,
    added_at INTEGER NOT NULL,
    tx_data TEXT NOT NULL
);

CREATE INDEX idx_transactions_sender ON transactions(sender);