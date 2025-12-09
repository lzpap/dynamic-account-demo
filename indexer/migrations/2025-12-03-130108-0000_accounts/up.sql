CREATE TABLE accounts (
    account_address TEXT PRIMARY KEY,
    threshold INTEGER NOT NULL,
    authenticator TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE TABLE members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_address TEXT NOT NULL,
    member_address TEXT NOT NULL,
    weight INTEGER NOT NULL,
    added_at INTEGER NOT NULL,
    FOREIGN KEY (account_address) REFERENCES accounts(account_address) ON DELETE CASCADE,
    UNIQUE (account_address, member_address)
);

CREATE INDEX idx_members_account ON members(account_address);