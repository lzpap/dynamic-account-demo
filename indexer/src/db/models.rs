// @generated automatically by Diesel CLI.
use diesel::{Associations, Identifiable, Queryable, Selectable, Insertable};
use crate::db::schema::members;

#[derive(Queryable, Identifiable, Debug, Clone)]
#[diesel(table_name = members)]
pub struct Member {
    pub id: i32,
    pub account_address: String,
    pub member_address: String,
    pub weight: i32,
    pub added_at: i64,
}