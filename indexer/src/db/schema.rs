// @generated automatically by Diesel CLI.

diesel::table! {
    members (id) {
        id -> Nullable<Integer>,
        account_address -> Text,
        member_address -> Text,
        weight -> Integer,
        added_at -> Int8,
    }
}
