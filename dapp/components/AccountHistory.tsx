import { useGetAccountEvents, ParsedEvent } from '@/hooks/useGetAccountEvents';
import React from 'react';
import { EventItem } from './EventItem';


interface AccountHistoryProps {
  accountAddress: string;
}

export function AccountHistory({ accountAddress }: AccountHistoryProps) {
    const [selectedFilters, setSelectedFilters] = React.useState<Set<ParsedEvent['eventType']>>(new Set());
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);

    const eventTypes: Array<{ type: ParsedEvent['eventType']; label: string; color: string }> = [
        { type: 'AccountCreatedEvent', label: 'Account Created', color: 'text-blue-500' },
        { type: 'MemberAddedEvent', label: 'Member Added', color: 'text-green-500' },
        { type: 'MemberRemovedEvent', label: 'Member Removed', color: 'text-red-500' },
        { type: 'ThresholdChangedEvent', label: 'Threshold Changed', color: 'text-purple-500' },
        { type: 'MemberWeightUpdatedEvent', label: 'Weight Updated', color: 'text-orange-500' },
        { type: 'TransactionProposedEvent', label: 'TX Proposed', color: 'text-yellow-500' },
        { type: 'TransactionApprovedEvent', label: 'TX Approved', color: 'text-teal-500' },
        { type: 'TransactionExecutedEvent', label: 'TX Executed', color: 'text-green-600' },
    ];

    const toggleFilter = (type: ParsedEvent['eventType']) => {
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

    const { data: events, isPending, isError, error } = useGetAccountEvents(accountAddress);

    const filteredEvents = selectedFilters.size > 0
        ? ( events ?? []).filter(event => selectedFilters.has(event.eventType))
        : events;
    const sortedEvents = [...(filteredEvents ?? [])].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    if (isPending) {
        return (
            <div className="bg-foreground/5 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Account History</h2>
                <div className="text-center py-8 text-foreground/60">
                    <svg className="w-8 h-8 mx-auto mb-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p>Loading events...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-foreground/5 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Account History</h2>
                <div className="text-center py-8 text-red-500">
                    <svg className="w-16 h-16 mx-auto mb-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p>Failed to load events: {error?.message}</p>
                </div>
            </div>
        );
    }

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
                {sortedEvents && sortedEvents.length > 0 ? (
                    sortedEvents.map((event) => (
                        <EventItem key={event.firedInTx+event.eventType} event={event} />
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