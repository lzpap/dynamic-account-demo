// @generated automatically by Diesel CLI.

diesel::table! {
    approvals (transaction_digest, approver_address) {
        transaction_digest -> Text,
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
    transactions (transaction_digest) {
        transaction_digest -> Text,
        account_address -> Text,
        proposer_address -> Text,
        status -> Text,
        created_at -> Int8,
    }
}

diesel::joinable!(approvals -> transactions (transaction_digest));

diesel::allow_tables_to_appear_in_same_query!(approvals, members, transactions,);
