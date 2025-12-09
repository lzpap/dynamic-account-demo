module isafe::account;

use iota::account::{has_auth_info_v1, AuthenticatorInfoV1};
use iota::dynamic_field;
use iota::table::{Table, new as new_table};
use std::ascii::String;
use std::type_name::{get, into_string};
use iota::account;

// ---------------------------------------- Errors ----------------------------------------

#[error(code = 0)]
const EAppKeyNotAuthorized: vector<u8> = b"App key is not authorized to modify the account.";
#[error(code = 1)]
const ETransactionSenderIsNotTheAccount: vector<u8> = b"Transaction sender is not the account.";
#[error(code = 2)]
const EAllowedAuthenticatorsEmpty: vector<u8> =
    b"Allowed authenticators list can not be empty, at least one app key must be authorized.";
#[error(code = 3)]
const ENoAuthenticatorAttached: vector<u8> = b"Account does not have an authenticator attached.";

// ---------------------------------------- Account ----------------------------------------

// Represents an iSafe Account.
// The account address is the 32 byte `id` field.
// All account related data is stored as dynamic fields under this `id`.
public struct Account has key, store {
    id: UID,
    // AppKeys that are allowed to add/remove dynamic fields on the account.
    // Such an authorized app key is represented by its fully qualified type name as a string.
    // Care must be taken to ensure that only trusted app keys are added here.
    // TODO: what happens when the package defining the app key is upgraded?
    allowed_authenticators: Table<String, bool>,
}

// ---------------------------------------- Account Creation ----------------------------------------

// Intermediate hot potato struct for creating a new account.
// This struct cannot be stored on-chain.
public struct AccountTicket {
    account: Account,
    authenticator: AuthenticatorInfoV1<Account>,
}

// Create a new account ticket with a default authenticator app key of type T.
// The AccountTicket hot potato has to be consumed by create_account_from_ticket within the same transaction
// to share the account object.
public fun create_ticket_with_default_authenticator<T: drop>(
    _app_key: T,
    authenticator: AuthenticatorInfoV1<Account>,
    ctx: &mut TxContext,
): AccountTicket {
    let default_authenticator = get<T>().into_string();

    let mut allowed_authenticators: Table<String, bool> = new_table(ctx);
    allowed_authenticators.add(default_authenticator, true);

    // is the authenticator function from the module that the AppKey T belongs to?
    let app_key_type = get<T>();
    // TODO: verify that the authenticator function belongs to the module of app_key_type

    AccountTicket {
        account: Account {
            id: object::new(ctx),
            allowed_authenticators,
        },
        authenticator,
    }
}

// Consume AccountTicket and share the account object publicly.
// Since AccountTicket must come from the same tx, we know the account is not owned by anyone else yet.
public fun create_account_from_ticket(ticket: AccountTicket): address {
    let AccountTicket { account, authenticator } = ticket;
    let account_address = account.borrow_id().to_address();
    account::create_account_v1(account, authenticator);
    account_address
}

// An AccountTicket can only be created by a trusted package that defines the app key T.
public fun borrow_account_from_ticket_mut(ticket: &mut AccountTicket): &mut Account {
    &mut ticket.account
}

// ---------------------------------------- Account Deletion ----------------------------------------

// Currently there is no way to delete an account.

// -------------------------------- Allowed Authenticators Management --------------------------------

public fun add_allowed_authenticator<T: drop>(
    self: &mut Account,
    _app_key: T,
    ctx: &mut TxContext,
) {
    // only the account itself can add allowed authenticators
    ensure_tx_sender_is_account(self, ctx);

    let app_key_type = get<T>().into_string();
    self.allowed_authenticators.add(app_key_type, true);
}

public fun remove_allowed_authenticator<T: drop>(
    self: &mut Account,
    _app_key: T,
    ctx: &mut TxContext,
) {
    // only the account itself can remove allowed authenticators
    ensure_tx_sender_is_account(self, ctx);

    let app_key_type = get<T>().into_string();
    // TODO: check if authenticator of this type is attached to the account? If yes, prevent removal.
    assert!(self.allowed_authenticators.length() == 1, EAllowedAuthenticatorsEmpty); // prevent removing the last authenticator
    self.allowed_authenticators.remove(app_key_type);
}

/// Rotate the account-related authenticator.
/// Aborts if:
/// - the app key is not authorized to modify the account.
/// - no authenticator is attached to the account.
public fun rotate_auth_info_v1<T: drop>(
    self: &mut Account,
    authenticator: AuthenticatorInfoV1<Account>,
    app_key: T,
): AuthenticatorInfoV1<Account> {
    assert!(app_key_allowed(self, app_key), EAppKeyNotAuthorized);
    // TODO check that the authenticator function belongs to the module of app_key_type
    iota::account::rotate_auth_info_v1(self, authenticator)
}

// -------------------------------- Dynamic Field Interface --------------------------------

// To be able to add/remove dynamic fields on the account for authenticator specific behavior,
// the app key of type T must be authorized.
// The package of T must not expose this call to untrusted code!
// As a best practice `T` shall only be able instantiated and disposed of within its own package.

// Authorized packages can add dynamic fields to the account.
public fun add_dynamic_field<T: drop, Name: copy + drop + store, Value: store>(
    account: &mut Account,
    name: Name,
    value: Value,
    app_key: T,
) {
    assert!(app_key_allowed(account, app_key), EAppKeyNotAuthorized);
    dynamic_field::add(&mut account.id, name, value);
}

// Authorized packages can remove dynamic fields from the account.
public fun remove_dynamic_field<T: drop, Name: copy + drop + store, Value: store>(
    account: &mut Account,
    name: Name,
    app_key: T,
): Value {
    assert!(app_key_allowed(account, app_key), EAppKeyNotAuthorized);
    let value: Value = dynamic_field::remove(&mut account.id, name);

    // We can't leave the account without authenticator, otherwise the account is locked forever.
    assert!(has_auth_info_v1(account.borrow_id()), ENoAuthenticatorAttached);

    value
}

// Authorized packages can mutably borrow dynamic fields from the account.
public fun borrow_dynamic_field_mut<T: drop, Name: copy + drop + store, Value: store>(
    account: &mut Account,
    name: Name,
    app_key: T,
): &mut Value {
    assert!(app_key_allowed(account, app_key), EAppKeyNotAuthorized);
    dynamic_field::borrow_mut(&mut account.id, name)
}

// -------------------------------- View Functions --------------------------------

// Read-only borrow can be done without authorization.
// Used to access
public fun borrow_id(account: &Account): &UID {
    &account.id
}

/// Returns the account address.
public fun get_address(self: &Account): address {
    self.id.to_address()
}

// Returns the authenticator info attached to the account
public fun get_authenticator(self: &Account): &AuthenticatorInfoV1<Account> {
    iota::account::borrow_auth_info_v1(&self.id)
}

// ---------------------------------------- Utilities ----------------------------------------

/// Checks that the sender of this transaction is the account.
public fun ensure_tx_sender_is_account(self: &Account, ctx: &TxContext) {
    assert!(self.id.uid_to_address() == ctx.sender(), ETransactionSenderIsNotTheAccount);
}

fun app_key_allowed<T: drop>(account: &Account, _app_key: T): bool {
    let app_key_type = get<T>().into_string();
    account.allowed_authenticators.contains(app_key_type)
}
