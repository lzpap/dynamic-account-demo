CREATE TABLE members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_address TEXT NOT NULL,
    member_address TEXT NOT NULL,
    weight INTEGER NOT NULL,
    added_at INTEGER NOT NULL,
    UNIQUE (account_address, member_address)
);

CREATE INDEX idx_members_account ON members(account_address);