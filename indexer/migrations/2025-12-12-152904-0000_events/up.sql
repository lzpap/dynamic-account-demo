CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_address TEXT NOT NULL,
    firing_tx_digest TEXT NOT NULL,
    event_type TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    content Text NOT NULL,
    FOREIGN KEY (account_address) REFERENCES accounts(account_address) ON DELETE CASCADE
);