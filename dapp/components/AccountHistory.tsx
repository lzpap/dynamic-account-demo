import React from 'react';

interface AccountEvent {
    id: string;
    type: 'account_created' | 'member_added' | 'member_removed' | 'threshold_changed' | 
                'member_weight_updated' | 'transaction_proposed' | 'transaction_approved' | 'transaction_executed';
    timestamp: Date;
    data: {
        member?: string;
        oldValue?: number;
        newValue?: number;
        transactionId?: string;
        approver?: string;
    };
}

// Test data
const mockEvents: AccountEvent[] = [
    {
        id: '1',
        type: 'account_created',
        timestamp: new Date('2024-01-01T10:00:00'),
        data: {}
    },
    {
        id: '2',
        type: 'member_added',
        timestamp: new Date('2024-01-01T10:05:00'),
        data: { member: '0x1234...5678' }
    },
    {
        id: '3',
        type: 'threshold_changed',
        timestamp: new Date('2024-01-01T11:00:00'),
        data: { oldValue: 1, newValue: 2 }
    },
    {
        id: '4',
        type: 'member_weight_updated',
        timestamp: new Date('2024-01-02T09:00:00'),
        data: { member: '0x1234...5678', oldValue: 1, newValue: 2 }
    },
    {
        id: '5',
        type: 'transaction_proposed',
        timestamp: new Date('2024-01-02T14:00:00'),
        data: { transactionId: 'tx-001' }
    },
    {
        id: '6',
        type: 'transaction_approved',
        timestamp: new Date('2024-01-02T14:30:00'),
        data: { transactionId: 'tx-001', approver: '0x1234...5678' }
    },
    {
        id: '7',
        type: 'member_removed',
        timestamp: new Date('2024-01-03T10:00:00'),
        data: { member: '0xabcd...ef01' }
    },
    {
        id: '8',
        type: 'transaction_executed',
        timestamp: new Date('2024-01-03T15:00:00'),
        data: { transactionId: 'tx-001' }
    }
];

const EventItem: React.FC<{ event: AccountEvent }> = ({ event }) => {
    const getEventDescription = () => {
        switch (event.type) {
            case 'account_created':
                return 'Account created';
            case 'member_added':
                return `Member ${event.data.member} added`;
            case 'member_removed':
                return `Member ${event.data.member} removed`;
            case 'threshold_changed':
                return `Threshold changed from ${event.data.oldValue} to ${event.data.newValue}`;
            case 'member_weight_updated':
                return `Member ${event.data.member} weight updated from ${event.data.oldValue} to ${event.data.newValue}`;
            case 'transaction_proposed':
                return `Transaction ${event.data.transactionId} proposed`;
            case 'transaction_approved':
                return `Transaction ${event.data.transactionId} approved by ${event.data.approver}`;
            case 'transaction_executed':
                return `Transaction ${event.data.transactionId} executed`;
            default:
                return 'Unknown event';
        }
    };

    const getEventIcon = () => {
        switch (event.type) {
            case 'account_created':
                return (
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                    </svg>
                );
            case 'member_added':
                return (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                    </svg>
                );
            case 'member_removed':
                return (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 6a3 3 0 11-6 0 3 3 0 016 0zM14 17a6 6 0 00-12 0h12zM13 8a1 1 0 100 2h4a1 1 0 100-2h-4z" />
                    </svg>
                );
            case 'threshold_changed':
                return (
                    <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                );
            case 'member_weight_updated':
                return (
                    <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                    </svg>
                );
            case 'transaction_proposed':
                return (
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                );
            case 'transaction_approved':
                return (
                    <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                );
            case 'transaction_executed':
                return (
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                );
        }
    };

    return (
        <div className="bg-background px-4 py-3 rounded-md border border-foreground/20 hover:border-foreground/40 transition">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                    {getEventIcon()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground/80">{getEventDescription()}</div>
                    <div className="text-xs text-foreground/60 mt-1">
                        {event.timestamp.toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export function AccountHistory (){
    const [selectedFilters, setSelectedFilters] = React.useState<Set<AccountEvent['type']>>(new Set());
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);

    const eventTypes: Array<{ type: AccountEvent['type']; label: string; color: string }> = [
        { type: 'account_created', label: 'Account Created', color: 'text-blue-500' },
        { type: 'member_added', label: 'Member Added', color: 'text-green-500' },
        { type: 'member_removed', label: 'Member Removed', color: 'text-red-500' },
        { type: 'threshold_changed', label: 'Threshold Changed', color: 'text-purple-500' },
        { type: 'member_weight_updated', label: 'Weight Updated', color: 'text-orange-500' },
        { type: 'transaction_proposed', label: 'TX Proposed', color: 'text-yellow-500' },
        { type: 'transaction_approved', label: 'TX Approved', color: 'text-teal-500' },
        { type: 'transaction_executed', label: 'TX Executed', color: 'text-green-600' },
    ];

    const toggleFilter = (type: AccountEvent['type']) => {
        const newFilters = new Set(selectedFilters);
        if (newFilters.has(type)) {
            newFilters.delete(type);
        } else {
            newFilters.add(type);
        }
        setSelectedFilters(newFilters);
    };

    const clearFilters = () => {
        setSelectedFilters(new Set());
    };

    // TODO: fetch all events by account address from backend
    // hint: events are fired from the smart contract and can be indexed off-chain (except the tx executed event, which need to be queried from the chain)

    const filteredEvents = selectedFilters.size > 0
        ? mockEvents.filter(event => selectedFilters.has(event.type))
        : mockEvents;

    const sortedEvents = [...filteredEvents].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    return (
        <div className="bg-foreground/5 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Account History</h2>
                
                {/* Filter Button */}
                <div className="relative">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="flex items-center gap-2 px-3 py-2 bg-foreground/10 hover:bg-foreground/20 rounded-md text-sm font-medium transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filter
                        {selectedFilters.size > 0 && (
                            <span className="bg-foreground text-background rounded-full px-2 py-0.5 text-xs font-bold">
                                {selectedFilters.size}
                            </span>
                        )}
                    </button>

                    {/* Filter Dropdown */}
                    {isFilterOpen && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-background border border-foreground/20 rounded-lg shadow-xl z-50">
                            <div className="p-3">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-semibold">Event Types</span>
                                    {selectedFilters.size > 0 && (
                                        <button
                                            onClick={clearFilters}
                                            className="text-xs text-foreground/60 hover:text-foreground transition"
                                        >
                                            Clear all
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {eventTypes.map(({ type, label, color }) => (
                                        <label
                                            key={type}
                                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-foreground/5 rounded cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedFilters.has(type)}
                                                onChange={() => toggleFilter(type)}
                                                className="rounded border-foreground/20"
                                            />
                                            <span className={`w-3 h-3 rounded-full ${color} bg-current opacity-60`}></span>
                                            <span className="text-sm flex-1">{label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {sortedEvents.length > 0 ? (
                    sortedEvents.map((event) => (
                        <EventItem key={event.id} event={event} />
                    ))
                ) : (
                    <div className="text-center py-8 text-foreground/60">
                        <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>{selectedFilters.size > 0 ? 'No events match the selected filters' : 'No history events found'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};