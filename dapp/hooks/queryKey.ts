// Copyright (c) 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

// Query keys mostly to identify queries
export const queryKey = {
    all: ['isafe'],

    // Account Object
    accountObject: (id: string) => [...queryKey.all, 'account-object', id],
    members: (id: string) => [...queryKey.all, 'members', id],
    threshold: (id: string) => [...queryKey.all, 'threshold', id],
    totalWeight: (id: string) => [...queryKey.all, 'total-weight', id],
    member_accounts: (address: string) => [...queryKey.all, 'member-accounts', address],
    allowed_authenticators: (account_id: string) => [...queryKey.all, 'allowed-authenticators', account_id],
};
