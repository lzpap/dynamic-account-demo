// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

module isafe::members;

// --------------------------------------- Errors ---------------------------------------

#[error(code = 0)]
const EMembersComponentsHaveDifferentLengths: vector<u8> =
    b"The members components have different lengths.";
#[error(code = 1)]
const EMembersMustNotContainDuplicates: vector<u8> =
    b"The list of members must not contain duplicates.";
#[error(code = 2)]
const EMemberIsNotFound: vector<u8> = b"The member with the provided address is not found.";

// ----------------------------------- Data Structures -----------------------------------

/// Holds the information about a member.
public struct Member has copy, drop, store {
    /// The member address.
    addr: address,
    /// The voting power of the member.
    weight: u64,
}

/// Holds the information about the account members.
public struct Members has drop, store {
    /// The members collection.
    list: vector<Member>,
}

// --------------------------------------- Creation ---------------------------------------

/// Creates a `Members` instance from the given vectors of addresses and weights.
/// The vectors must have the same length.
/// The addresses must be unique.
public(package) fun create(addresses: vector<address>, weights: vector<u64>): Members {
    // Check that the provided members components are valid.
    check_members(&addresses, &weights);

    // Create a `Members` instance.
    let list = addresses.zip_map!(weights, |addr, weight| Member { addr, weight });

    Members { list }
}

/// Creates a `Member` instance.
public(package) fun create_member(addr: address, weight: u64): Member {
    Member { addr, weight }
}

// --------------------------------------- Members ---------------------------------------

/// Checks if the account has a member with the provided address.
public fun contains(self: &Members, addr: address): bool {
    find_index(self, addr).is_some()
}

/// Immutably borrows the account member with the provided address.
public fun borrow(self: &Members, addr: address): &Member {
    let index = find_index(self, addr);

    assert!(index.is_some(), EMemberIsNotFound);

    self.list.borrow(*index.borrow())
}

public(package) fun remove_member(self: &mut Members, addr: address): Member {
    let index = find_index(self, addr);
    assert!(index.is_some(), EMemberIsNotFound);
    self.list.remove(*index.borrow())
}

public(package) fun add_member(self: &mut Members, addr: address, weight: u64) {
    assert!(!self.contains(addr), EMembersMustNotContainDuplicates);
    let member = Member { addr, weight };
    self.list.push_back(member);
}

public(package) fun set_member_weight(self: &mut Members, addr: address, weight: u64) {
    let index = find_index(self, addr);
    assert!(index.is_some(), EMemberIsNotFound);
    let member = self.list.borrow_mut(*index.borrow());
    member.weight = weight;
}

/// Returns the addresses of all the members.
public fun addresses(self: &Members): vector<address> {
    let mut addresses = vector::empty<address>();
    self.list.do_ref!(|m| addresses.push_back(m.addr));
    addresses
}

/// Returns the weights of all the members.
public fun weights(self: &Members): vector<u64> {
    let mut weights = vector::empty<u64>();
    self.list.do_ref!(|m| weights.push_back(m.weight));
    weights
}

/// Returns the total weight of all the members.
public fun total_weight(self: &Members): u64 {
    let mut total = 0;
    self.list.do_ref!(|m| total = total + m.weight);
    total
}

/// Mutably borrows the account member with the provided address.
public(package) fun borrow_mut(self: &mut Members, addr: address): &mut Member {
    let index = find_index(self, addr);

    assert!(index.is_some(), EMemberIsNotFound);

    self.list.borrow_mut(*index.borrow())
}

// Returns the members as a vector.
public(package) fun as_vector(self: &Members): &vector<Member> {
    &self.list
}

// --------------------------------------- Member ---------------------------------------

/// Borrows the address of the member.
public fun addr(self: &Member): &address {
    &self.addr
}

/// Returns the weight of the member.
public fun weight(self: &Member): u64 {
    self.weight
}

// --------------------------------------- Utilities ---------------------------------------

/// Check that the provided members components are valid.
fun check_members(addresses: &vector<address>, weights: &vector<u64>) {
    // Check that the lengths of the provided vectors are equal.
    assert!(addresses.length() == weights.length(), EMembersComponentsHaveDifferentLengths);

    // Check that the provided addresses are unique.
    let mut seen = vector::empty<address>();
    addresses.do_ref!(|addr| {
        assert!(!seen.contains(addr), EMembersMustNotContainDuplicates);
        seen.push_back(*addr);
    });
}

/// Finds the index of the member with the provided address.
fun find_index(self: &Members, addr: address): Option<u64> {
    self.list.find_index!(|m| m.addr == addr)
}
