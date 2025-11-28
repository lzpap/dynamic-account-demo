"use client";

import { useGetMembers } from "@/hooks/useGetMembers";

interface Member {
  address: string;
  weight: number;
}

interface MembersProps {
  accountAddress: string;
  compact?: boolean;
}

export function Members({ accountAddress, compact = false }: MembersProps) {

  const { data, error, isLoading } = useGetMembers(accountAddress);

  if (isLoading) {
    return <div>Loading members...</div>;
  }

  if (error || !data) {
    return <div>Error loading members: {error?.message}</div>;
  }

  const totalWeight = data?.reduce((sum, m) => sum + m.weight, 0);

  if (compact) {
    return (
      <div className="relative group">
        <div className="space-y-3 cursor-help">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold">{data?.length}</span>
            <span className="text-xs text-foreground/60 uppercase">Total Members</span>
          </div>
          <div className="text-sm text-foreground/70">
            <span className="font-medium">Total Weight:</span> {totalWeight}
          </div>
        </div>

        {/* Hover Tooltip */}
        <div className="absolute left-0 top-full mt-2 w-80 border border-foreground/20 rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
          <div className="p-4 bg-background rounded-lg">
            <h4 className="text-sm font-semibold text-foreground/80 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Member Details
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data?.map((member, index) => (
                <div
                  key={member.address}
                  className="flex items-center justify-between bg-foreground/5 px-3 py-2 rounded-md text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-foreground/50 font-medium flex-shrink-0">
                      #{index + 1}
                    </span>
                    <span className="font-mono truncate text-foreground/80">
                      {member.address.substring(0, 8)}...{member.address.substring(member.address.length - 6)}
                    </span>
                  </div>
                  <span className="bg-foreground/10 px-2 py-1 rounded-full font-semibold text-xs flex-shrink-0 ml-2">
                    {member.weight}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-foreground/5 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Members</h2>

      {/* Members List */}
      <div className="mb-6">
        {data.length > 0 ? (
          <div className="space-y-2">
            {data?.map((member, index) => (
              <div
                key={member.address}
                className="flex items-center justify-between bg-background px-4 py-3 rounded-md border border-foreground/20"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-foreground/60 font-medium text-sm flex-shrink-0">
                    #{index + 1}
                  </span>
                  <span className="font-mono text-sm truncate">
                    {member.address}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-foreground/60">Weight:</span>
                  <span className="bg-foreground/10 px-3 py-1 rounded-full font-semibold text-sm">
                    {member.weight}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-foreground/60 py-4">No members found</p>
        )}
      </div>

    </div>
  );
}