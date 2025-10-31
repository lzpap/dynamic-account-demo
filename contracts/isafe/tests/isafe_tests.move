#[test_only]
module isafe::isafe_tests;

use iota::account::{create_auth_info_v1_for_testing, has_auth_info_v1, AuthenticatorInfoV1};
use iota::auth_context;
use iota::test_scenario::{Self, Scenario};
use isafe::account::Account;
use isafe::dynamic_auth;

#[error(code = 0)]
const EInvalidMembersAndWeightsLength: vector<u8> =
    b"The members and weights vectors must have the same length.";

#[test]
fun test_creation() {
    let mut scenario = test_scenario::begin(@0xA);

    // Create an iSafe account with 3 members and an authenticator.
    setup_account(
        &mut scenario,
        vector[@0x1, @0x2, @0x3],
        vector[1, 2, 3],
        3,
        option::some(vector[0, 1, 2]),
        dummy_authenticator()
    );
    // Advance the scenario to the next transaction.
    // account object shall be shared.
    scenario.next_tx(@0x1);

    let account: Account = test_scenario::take_shared<Account>(&scenario);
    // Verify that the account has the correct members and authenticator.
    assert!(dynamic_auth::members(&account).addresses() == vector[@0x1, @0x2, @0x3]);
    assert!(dynamic_auth::threshold(&account) == 3);
    assert!(has_auth_info_v1(account.borrow_id()));
    assert!(dynamic_auth::guardian(&account).borrow() == vector[0,1,2]);

    test_scenario::return_shared(account);
    scenario.end();
}

#[
    test,
    expected_failure(
        abort_code = ::isafe::dynamic_auth::ETransactionDoesNotHaveSufficientApprovals,
    ),
]
fun test_approval_flow_not_enough_approvals() {
    let mut scenario = test_scenario::begin(@0xA);

    // Create an iSafe account with 3 members and an authenticator.
    setup_account(
        &mut scenario,
        vector[@0x1, @0x2, @0x3],
        vector[1, 2, 3],
        3,
        option::some(vector[0, 1, 2]),
        dummy_authenticator()
    );

    // 0x1 submits a tx proposal
    scenario.next_tx(@0x1);
    let mut account: Account = test_scenario::take_shared<Account>(&scenario);
    let account_address = account.borrow_id().to_address();

    let proposed_tx_context = tx_context::new_from_hint(account_address, 42, 0, 0, 0);
    let proposed_tx_digest = proposed_tx_context.digest();

    dynamic_auth::propose_transaction(&mut account, *proposed_tx_digest, scenario.ctx());
    test_scenario::return_shared(account);

    scenario.next_tx(@0x2);

    // Is the transaction registered?
    let account: Account = test_scenario::take_shared<Account>(&scenario);
    assert!(dynamic_auth::transactions(&account).contains(*proposed_tx_digest));

    // check that weight of 1 does not unlock the account yet
    let dummy_auth_context = auth_context::new_with_tx_inputs(
        vector[],
        vector[],
        vector[],
    );
    dynamic_auth::authenticate(&account, &dummy_auth_context, &proposed_tx_context);
    test_scenario::return_shared(account);
    scenario.end();
}

#[test]
fun test_approval_flow() {
    let mut scenario = test_scenario::begin(@0xA);

    // Create an iSafe account with 3 members and an authenticator.
    setup_account(
        &mut scenario,
        vector[@0x1, @0x2, @0x3],
        vector[1, 2, 3],
        3,
        option::some(vector[0, 1, 2]),
        dummy_authenticator()
    );

    // 0x1 submits a tx proposal
    scenario.next_tx(@0x1);
    let mut account: Account = test_scenario::take_shared<Account>(&scenario);
    let account_address = account.borrow_id().to_address();

    let proposed_tx_context = tx_context::new_from_hint(account_address, 42, 0, 0, 0);
    let proposed_tx_digest = proposed_tx_context.digest();

    dynamic_auth::propose_transaction(&mut account, *proposed_tx_digest, scenario.ctx());
    test_scenario::return_shared(account);

    scenario.next_tx(@0x2);

    // 0x2 approves the tx
    let mut account: Account = test_scenario::take_shared<Account>(&scenario);
    assert!(dynamic_auth::transactions(&account).contains(*proposed_tx_digest));

    dynamic_auth::approve_transaction(&mut account, *proposed_tx_digest, scenario.ctx());
    test_scenario::return_shared(account);

    // 0x3 approves the tx
    scenario.next_tx(@0x3);
    let mut account: Account = test_scenario::take_shared<Account>(&scenario);
    assert!(dynamic_auth::transactions(&account).contains(*proposed_tx_digest));

    dynamic_auth::approve_transaction(&mut account, *proposed_tx_digest, scenario.ctx());
    test_scenario::return_shared(account);

    scenario.next_tx(account_address);

    // Run the auth function with the proposed tx context
    let dummy_auth_context = auth_context::new_with_tx_inputs(
        vector[],
        vector[],
        vector[],
    );
    let account: Account = test_scenario::take_shared<Account>(&scenario);
    // if this doesn't abort, authentication shall have succeeded
    dynamic_auth::authenticate(&account, &dummy_auth_context, &proposed_tx_context);
    test_scenario::return_shared(account);
    scenario.end();
}

fun setup_account(
    scenario: &mut Scenario,
    members: vector<address>,
    weights: vector<u64>,
    threshold: u64,
    guardian: Option<vector<u8>>,
    authenticator: AuthenticatorInfoV1,
) {
    // Create an iSafe account with 3 members and an authenticator.
    let mut builder = dynamic_auth::create_account_builder()
        .add_authenticator_to_builder(authenticator);
    
    assert!(vector::length(&members) == vector::length(&weights), EInvalidMembersAndWeightsLength);
    vector::zip_do!(members, weights, |addr, weight| {
        builder = builder.add_member_to_builder(addr, weight);
    });

    builder = builder.set_threshold_in_builder(threshold);

    if (option::is_some(&guardian)) {
        builder = builder.set_guardian_in_builder(guardian.destroy_some());
    };

    builder.build_and_publish(scenario.ctx());
}

fun dummy_authenticator(): AuthenticatorInfoV1 {
    create_auth_info_v1_for_testing(
        @0xABBA,
        b"dummy".to_ascii_string(),
        b"dummy_function".to_ascii_string(),
    )
}

/*
#[test, expected_failure(abort_code = ::isafe::isafe_tests::ENotImplemented)]
fun test_isafe_fail() {
    abort ENotImplemented
}
*/
