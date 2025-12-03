use anyhow::Result;
use diesel::{
    AggregateExpressionMethods, ExpressionMethods, OptionalExtension, QueryDsl, RunQueryDsl,
    SelectableHelper, SqliteConnection, TextExpressionMethods, dsl, insert_into, update,
};
use iota_types::base_types::IotaAddress;

use crate::db::schema::members;

pub fn insert_member_entry(
    conn: &mut SqliteConnection,
    account: IotaAddress,
    member: IotaAddress,
    weight: u64,
    at: u64,
) -> Result<()> {
    insert_into(members::table)
        .values((
            members::account_address.eq(account.to_string()),
            members::member_address.eq(member.to_string()),
            members::weight.eq(weight as i32),
            members::added_at.eq(at as i64),
        ))
        .execute(conn)?;
    Ok(())
}
