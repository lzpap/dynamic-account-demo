// @generated automatically by Diesel CLI.

use diesel::{Associations, Identifiable, Queryable, Selectable};

#[derive(Queryable, Selectable, Identifiable, PartialEq, Debug)]
#[diesel(table_name = transactions)]
#[diesel(primary_key(digest))]
pub struct StoredTransaction {
    pub digest: String,
    pub sender: String,
    pub added_at: i64,
    pub tx_data: String,
}

diesel::table! {
    transactions (digest) {
        digest -> Text,
        sender -> Text,
        added_at -> Int8,
        tx_data -> Text,
    }
}
