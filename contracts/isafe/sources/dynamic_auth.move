module isafe::dynamic_auth;

use iota::account::AuthenticatorInfoV1;
use iota::auth_context::AuthContext;
use iota::dynamic_field;
use isafe::account::{Account, ensure_tx_sender_is_account, attach_auth_info_v1};
use isafe::members::{Self, Members};
use isafe::transactions::{Self, Transactions, add_approval};

// -------------------------------- Errors --------------------------------

#[error(code = 0)]
const EThresholdTooHigh: vector<u8> = b"Threshold exceeds total member weight";
#[error(code = 1)]
const EThresholdTooLow: vector<u8> = b"Threshold must be greater than zero";
#[error(code = 2)]
const EAuthenticatorNotAttached: vector<u8> = b"Authenticator must be attached";
#[error(code = 3)]
const EThresholdNotEnough: vector<u8> =
    b"Account's total member weight is less than the threshold.";
#[error(code = 4)]
const ETransactionDoesNotHaveSufficientApprovals: vector<u8> =
    b"The transaction does not have sufficient approvals.";

// ---------------------------------- App Key ----------------------------------

public struct AppKey has drop, store {}

// -------------------------------- Dynamic Field Names --------------------------------

/// A dynamic field key for storing the account members.
public struct MembersKey has copy, drop, store {}
/// A dynamic field key for storing the threshold.
public struct ThresholdKey has copy, drop, store {}
/// A dynamic field key for storing the transactions.
public struct TransactionsKey has copy, drop, store {}
/// A dynamic field key for storing the guardian.
public struct GuardianKey has copy, drop, store {}

// --------------------------------------- Account Management ---------------------------------------

// Remove a member from the account
public fun remove_member(self: &mut Account, addr: address, ctx: &mut TxContext) {
    // Removing a member requires the transaction to be initiated by the account itself.
    ensure_tx_sender_is_account(self, ctx);

    let account_threshold = threshold(self);

    let members: &mut Members = self.borrow_dynamic_field_mut(members_key(), AppKey {});

    let weight_to_remove = members.borrow(addr).weight();
    assert!(members.total_weight() - weight_to_remove >= account_threshold, EThresholdNotEnough);
    members.remove_member(addr);
}

// Add a member to the account
public fun add_member(self: &mut Account, addr: address, weight: u64, ctx: &mut TxContext) {
    // Adding a member requires the transaction to be initiated by the account itself.
    ensure_tx_sender_is_account(self, ctx);

    let members: &mut Members = self.borrow_dynamic_field_mut(members_key(), AppKey {});
    members.add_member(addr, weight);
}

public fun set_threshold(self: &mut Account, new_threshold: u64, ctx: &mut TxContext) {
    // Setting a new threshold requires the transaction to be initiated by the account itself.
    ensure_tx_sender_is_account(self, ctx);

    let total_weight = members(self).total_weight();

    assert!(new_threshold > 0, EThresholdTooLow);
    assert!(new_threshold <= total_weight, EThresholdTooHigh);

    *self.borrow_dynamic_field_mut(threshold_key(), AppKey {}) = new_threshold;
}

public fun set_guardian(self: &mut Account, new_guardian: vector<u8>, ctx: &mut TxContext) {
    // Setting a new guardian requires the transaction to be initiated by the account itself.
    ensure_tx_sender_is_account(self, ctx);

    if (!dynamic_field::exists_(self.borrow_id(), guardian_key())) {
        self.add_dynamic_field(guardian_key(), new_guardian, AppKey {});
        return
    };

    *self.borrow_dynamic_field_mut(guardian_key(), AppKey {}) = new_guardian;
}

// --------------------------------------- Authenticator ---------------------------------------
/// A transaction authenticator.
///
/// Checks that the sender of this transaction is the account.
/// The total weight of the members who approved the transaction must be greater than or equal to the threshold.
/// If the members list is changed after the transaction proposal, only the members who are still in the list
/// are considered for the approval. Their weights are taken from the current members list.
public fun authenticate(self: &Account, _: &AuthContext, ctx: &TxContext) {
    // Check that the sender of this transaction is the account.
    ensure_tx_sender_is_account(self, ctx);

    // TODO: check if the transaction was approved by the guardian, if set.

    // Check that the transaction is approved.
    assert!(
        total_approves(self,*ctx.digest()) >= threshold(self),
        ETransactionDoesNotHaveSufficientApprovals,
    );
}

// --------------------------------------- Transactions Management ---------------------------------------

/// Proposes a new transaction to be approved by the account members.
/// The member who proposes the transaction is added as the first approver.
public fun propose_transaction(
    self: &mut Account,
    transaction_digest: vector<u8>,
    ctx: &mut TxContext,
) {
    transactions::validate_digest(&transaction_digest);
    // Get the member who proposed the transaction.
    let member_address = *members(self).borrow(ctx.sender()).addr();

    // Store the transaction.
    transactions_mut(self).add(transaction_digest, member_address);
}

/// Approves a proposed transaction.
public fun approve_transaction(
    self: &mut Account,
    transaction_digest: vector<u8>,
    ctx: &mut TxContext,
) {
    // Get the member who approved the transaction.
    let member_address = *members(self).borrow(ctx.sender()).addr();

    // Get the transaction.
    let transaction = transactions_mut(self).borrow_mut(transaction_digest);

    // Approve the transaction.
    transaction.add_approval(member_address);
}

/// Removes a transaction.
/// It can be removed ether it was executed or not.
/// Can be removed only by the account itself, that means that this call must be approved by the account members.
/// TODO: if transaction was parsed in move, we could check it's epoch field and let anyone delete it if the current epoch is greater than that.
///     We could also set an "expiration" field on the tx during proposal such that the authenticator can check it + anyone could delete expired transactions.
public fun remove_transaction(
    self: &mut Account,
    transaction_digest: vector<u8>,
    ctx: &mut TxContext,
) {
    // Check that the sender of this transaction is the account.
    ensure_tx_sender_is_account(self, ctx);

    // Remove the transaction.
    transactions_mut(self).remove(transaction_digest);
}

// -------------------------------- Account Builder --------------------------------

// Hot potato pattern for building a new account.
public struct AccountBuilder {
    authenticator: Option<AuthenticatorInfoV1>,
    // The members' addresses.
    members: vector<address>,
    // The members' weights.
    weights: vector<u64>,
    // Optional guardian, represented as hash of an address to conceal the identity.
    guardian: Option<vector<u8>>,
    // The approval threshold.
    threshold: u64,
}

// Creates a new AccountBuilder. build() has to be called to get the final Account.
public fun create_account_builder(): AccountBuilder {
    AccountBuilder {
        authenticator: option::none(),
        members: vector::empty(),
        weights: vector::empty(),
        guardian: option::none(),
        threshold: 0,
    }
}

// Adds a member with the given weight to the AccountBuilder.
public fun add_member_to_builder(
    mut builder: AccountBuilder,
    member: address,
    weight: u64,
): AccountBuilder {
    vector::push_back(&mut builder.members, member);
    vector::push_back(&mut builder.weights, weight);
    builder
}

// Sets the guardian for the AccountBuilder.
public fun set_guardian_in_builder(
    mut builder: AccountBuilder,
    guardian: vector<u8>,
): AccountBuilder {
    builder.guardian = option::some(guardian);
    builder
}

// Sets the threshold for the AccountBuilder.
public fun set_threshold_in_builder(mut builder: AccountBuilder, threshold: u64): AccountBuilder {
    assert!(threshold > 0, EThresholdTooLow);
    assert!(total_weight(&builder.weights) > threshold, EThresholdTooHigh);

    builder.threshold = threshold;
    builder
}

// Adds an authenticator to the AccountBuilder.
public fun add_authenticator_to_builder(
    mut builder: AccountBuilder,
    authenticator: AuthenticatorInfoV1,
): AccountBuilder {
    builder.authenticator = option::some(authenticator);
    builder
}

// Builds and publishes the Account from the AccountBuilder.
public fun build_and_publish(builder: AccountBuilder, ctx: &mut TxContext) {
    // threshold can't be zero, which means it had to be set.
    // it is possible to set a threshold and then keep adding members, but that's on the caller.
    assert!(builder.threshold > 0, EThresholdTooLow);

    // an authenticator must be present.
    assert!(option::is_some(&builder.authenticator), EAuthenticatorNotAttached);

    let AccountBuilder {
        authenticator: authenticator_opt,
        members,
        weights,
        guardian,
        threshold,
    } = builder;

    let mut ticket = isafe::account::create_ticket_with_default_authenticator(AppKey {}, ctx);

    let members = members::create(members, weights);

    let account = isafe::account::borrow_account_from_ticket_mut(&mut ticket);

    // First, let's attach the authenticator.
    attach_auth_info_v1(account, authenticator_opt.destroy_some(), AppKey {});

    // Then add all the data as dynamic fields.
    account.add_dynamic_field(members_key(), members, AppKey {});
    account.add_dynamic_field(threshold_key(), threshold, AppKey {});
    account.add_dynamic_field(transactions_key(), transactions::create(ctx), AppKey {});

    if (option::is_some(&guardian)) {
        account.add_dynamic_field(guardian_key(), guardian.destroy_some(), AppKey {});
    };

    // Create the account from the ticket
    isafe::account::create_account_from_ticket(ticket);
}

// --------------------------------------- View Functions ---------------------------------------

/// Borrows the account threshold.
public fun threshold(self: &Account): u64 {
    *dynamic_field::borrow(self.borrow_id(), threshold_key())
}

/// Immutably borrows the account members.
public fun members(self: &Account): &Members {
    dynamic_field::borrow(self.borrow_id(), members_key())
}

/// Immutably borrows the account transactions.
public fun transactions(self: &Account): &Transactions {
    dynamic_field::borrow(self.borrow_id(), transactions_key())
}

/// Immutably borrows the account guardian.
public fun guardian(self: &Account): Option<vector<u8>> {
    if (!dynamic_field::exists_(self.borrow_id(), guardian_key())) {
        return option::none()
    };
    let guardian: vector<u8> = *dynamic_field::borrow(self.borrow_id(), guardian_key());
    option::some(guardian)
}

/// Returns the total weight of the members who approved the transaction with the provided digest.
public fun total_approves(self: &Account, transaction_digest: vector<u8>): u64 {
    // If the transaction does not exist, the total approves is zero.
    if (!transactions(self).contains(transaction_digest)) {
        return 0
    };

    let members = members(self);
    let transaction = transactions(self).borrow(transaction_digest);

    // Calculate the total weight of the members who approved the transaction.
    let mut total_approves = 0;
    transaction.approves().do_ref!(|addr| {
        if (members.contains(*addr)) {
            total_approves = total_approves + members.borrow(*addr).weight();
        }
    });
    total_approves
}

// --------------------------------------- Utilities ---------------------------------------

/// Returns the dynamic field name used to store the members information.
fun members_key(): MembersKey {
    MembersKey {}
}

/// Returns the dynamic field name used to store the threshold.
fun threshold_key(): ThresholdKey {
    ThresholdKey {}
}

/// Returns the dynamic field name used to store the transactions.
fun transactions_key(): TransactionsKey {
    TransactionsKey {}
}

/// Returns the dynamic field name used to store the guardian.
fun guardian_key(): GuardianKey {
    GuardianKey {}
}

/// Mutably borrows the account transactions.
fun transactions_mut(self: &mut Account): &mut Transactions {
    self.borrow_dynamic_field_mut(transactions_key(), AppKey {})
}

fun total_weight(weights: &vector<u64>): u64 {
    let mut total = 0;
    weights.do_ref!(|w| total = total + *w);
    total
}
