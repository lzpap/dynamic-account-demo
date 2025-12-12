// @generated automatically by Diesel CLI.

diesel::table! {
    accounts (account_address) {
        account_address -> Text,
        threshold -> Integer,
        authenticator -> Text,
        created_at -> Int8,
    }
}

diesel::table! {
    approvals (transaction_digest, approver_address) {
        transaction_digest -> Text,
        account_address -> Text,
        approver_address -> Text,
        approved_at -> Int8,
        approver_weight -> Integer,
    }
}

diesel::table! {
    members (id) {
        id -> Nullable<Integer>,
        account_address -> Text,
        member_address -> Text,
        weight -> Integer,
        added_at -> Int8,
    }
}

diesel::table! {
    transactions (transaction_digest, account_address) {
        transaction_digest -> Text,
        account_address -> Text,
        proposer_address -> Text,
        status -> Text,
        created_at -> Int8,
    }
}

diesel::table! {
    events (id) {
        id -> Nullable<Integer>,
        account_address -> Text,
        event_type -> Text,
        timestamp -> Int8,
        content -> Text,
    }
}

diesel::joinable!(events -> accounts (account_address));
diesel::joinable!(members -> accounts (account_address));
diesel::joinable!(transactions -> accounts (account_address));

diesel::allow_tables_to_appear_in_same_query!(accounts, approvals, events, members, transactions,);
