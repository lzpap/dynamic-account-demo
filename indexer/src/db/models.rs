use std::fmt::Debug;

// @generated automatically by Diesel CLI.
use diesel::{Associations, Identifiable, Insertable, Queryable, Selectable, prelude::AsChangeset};
use diesel::ExpressionMethods;
use serde::Serialize;
use crate::db::schema::{members, transactions, approvals, accounts};

#[derive(Queryable, Identifiable, Debug, Clone)]
#[diesel(primary_key(account_address))]
#[diesel(table_name = accounts)]
pub struct Account {
    pub account_address: String,
    pub threshold: i32,
    pub authenticator: String,
    pub created_at: i64,
}

#[derive(Queryable, Identifiable, Debug, Clone)]
#[diesel(table_name = members)]
pub struct StoredMember {
    pub id: i32,
    pub account_address: String,
    pub member_address: String,
    pub weight: i32,
    pub added_at: i64,
}

#[derive(Queryable, Identifiable, Debug, Clone, Insertable, Selectable, AsChangeset)]
#[diesel(table_name = transactions)]
#[diesel(primary_key(transaction_digest, account_address))]
#[derive(Serialize)]
pub struct StoredTransaction {
    pub transaction_digest: String,
    pub account_address: String,
    pub proposer_address: String,
    #[diesel(serialize_as = String)]    // Custom serialization type
    #[diesel(deserialize_as = String)] 
    pub status: Status,
    pub created_at: i64,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub enum Status {
    Proposed,
    Approved,
    Executed,
    Rejected,
}

impl From<String> for Status {
    fn from(s: String) -> Self {
        match s.as_str() {
            "Proposed" => Status::Proposed,
            "Approved" => Status::Approved,
            "Executed" => Status::Executed,
            "Rejected" => Status::Rejected,
            _ => panic!("Unknown status string"),
        }
    }
}

impl From<Status> for String {
    fn from(status: Status) -> Self {
        match status {
            Status::Proposed => "Proposed".to_string(),
            Status::Approved => "Approved".to_string(),
            Status::Executed => "Executed".to_string(),
            Status::Rejected => "Rejected".to_string(),
        }
    }
}

#[derive(Queryable, Associations, Identifiable, Debug, Clone, Insertable, Selectable, AsChangeset)]
#[diesel(table_name = approvals)]
#[diesel(primary_key(transaction_digest, approver_address))]
#[diesel(belongs_to(StoredTransaction, foreign_key = transaction_digest))]
pub struct StoredApproval {
    pub transaction_digest: String,
    pub account_address: String,
    pub approver_address: String,
    pub approved_at: i64,
}

