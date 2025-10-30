#[test_only]
module isafe::isafe_tests;

use iota::account::{create_auth_info_v1_for_testing, has_auth_info_v1};
use iota::test_scenario;
use iota::test_utils;
use iota::tx_context;
use isafe::account::Account;
use isafe::dynamic_auth;

#[test]
fun test_creation() {
    let mut scenario = test_scenario::begin(@0xA);

    // Create an iSafe account with 3 members and an authenticator.
    dynamic_auth::create_account_builder()
        .add_member_to_builder(@0x1, 1)
        .add_member_to_builder(@0x2, 2)
        .add_member_to_builder(@0x3, 3)
        .set_threshold_in_builder(3)
        .add_authenticator_to_builder(
            create_auth_info_v1_for_testing(
                @0xABBA,
                b"dummy".to_ascii_string(),
                b"dummy_function".to_ascii_string(),
            ),
        )
        .build_and_publish(scenario.ctx());
    // Advance the scenario to the next transaction.
    // account object shall be shared.
    scenario.next_tx(@0x1);

    let account: Account = test_scenario::take_shared<Account>(&scenario);
    // Verify that the account has the correct members and authenticator.
    assert!(dynamic_auth::members(&account).addresses() == vector[@0x1, @0x2, @0x3]);
    assert!(dynamic_auth::threshold(&account) == 3);
    assert!(has_auth_info_v1(account.borrow_id()));

    test_scenario::return_shared(account);

    // TODO approval flow tests. Hint: tx_context::new_from_hint(sender, 0, 0, 0, 0)

    scenario.end();
}

/*
#[test, expected_failure(abort_code = ::isafe::isafe_tests::ENotImplemented)]
fun test_isafe_fail() {
    abort ENotImplemented
}
*/
