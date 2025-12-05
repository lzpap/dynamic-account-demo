-- This file should undo anything in `up.sql`
DROP TABLE IF EXISTS transactions;
DROP INDEX IF EXISTS idx_transactions_sender;