
import { useGetAllowedAuthenticators } from "@/hooks/useGetAllowedAuthenticators";
import { parseAppKey } from "@/lib/utils/parseAppKey";

interface AllowedAuthenticatorsProps {
  address: string;
}

export function AllowedAuthenticators({ address }: AllowedAuthenticatorsProps) {
  const {
    data: allowedAuthenticators,
    isLoading: authLoading,
    error: authError,
  } = useGetAllowedAuthenticators(address);

  const parsed = allowedAuthenticators?.map((appKey) => parseAppKey(appKey)) || [];

  if (authLoading) {
    return (
      <div className="bg-foreground/5 rounded-xl p-6 border border-foreground/10">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground"></div>
          <span className="ml-3 text-sm text-foreground/60">Loading authenticators...</span>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="bg-foreground/5 rounded-xl p-6 border border-foreground/10">
        <p className="text-red-500 text-sm">Error loading authenticators</p>
      </div>
    );
  }

  return (
    <div className="bg-foreground/5 rounded-xl p-6 border border-foreground/10">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-foreground/60"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
        Allowed Authenticators
      </h2>

      <div className="mb-4 text-sm text-foreground/60">
        {parsed.length} module{parsed.length !== 1 ? "s are" : " is"} authorized to attach authenticators to the account with the following key{parsed.length !== 1 ? "s" : ""}:
      </div>

      <div className="space-y-3">
        {parsed.length === 0 ? (
          <p className="text-center text-foreground/60 py-4">
            No allowed authenticators found
          </p>
        ) : (
          parsed.map((auth, index) => (
            <div
              key={index}
              className="bg-background rounded-lg border border-foreground/10 overflow-hidden"
            >
              <div className="p-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-foreground/40 text-xs font-medium">
                    #{index + 1}
                  </span>
                  <span className="bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded text-xs font-semibold">
                    {auth.appKey}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-foreground/50">Package:</span>
                    <p
                      className="font-mono text-foreground/80 truncate"
                      title={`0x${auth.package}`}
                    >
                      {(`0x${auth.package}`)}
                    </p>
                  </div>
                  <div>
                    <span className="text-foreground/50">Module:</span>
                    <p className="font-mono text-foreground/80">{auth.module}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}