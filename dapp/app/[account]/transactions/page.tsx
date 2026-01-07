"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import ProposedTransactions from "@/components/ProposedTransactions";
import ApprovedTransactions from "@/components/ApprovedTransactions";
import ExecutedTransactions from "@/components/ExecutedTransactions";
import { generateAvatar } from "@/lib/utils/generateAvatar";
import { useGetAccountTransactions } from "@/hooks/useGetAccountTransactions";

type TabType = "proposed" | "approved" | "executed";

export default function TransactionsPage() {
  const params = useParams();
  const accountAddress = params.account as string;
  const [activeTab, setActiveTab] = useState<TabType>("proposed");

  // Fetch transactions data here
  const { data: transactionsData } = useGetAccountTransactions(accountAddress);


  const tabs: { id: TabType; label: string; icon: React.ReactNode; count: number }[] = [
    {
      id: "proposed",
      label: "Proposed",
      count: transactionsData?.proposed?.length || 0,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: "approved",
      label: "Approved",
      count: transactionsData?.approved?.length || 0,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: "executed",
      label: "Executed",
      count: transactionsData?.executed?.length || 0,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto pt-20 space-y-6 pb-12 px-6">
      {/* Tab Navigation */}
      <div className="bg-foreground/5 rounded-xl p-1 border border-foreground/10">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition relative ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === "proposed" && <ProposedTransactions transactions={transactionsData?.proposed || []} />}
        {activeTab === "approved" && <ApprovedTransactions transactions={transactionsData?.approved || []} />}
        {activeTab === "executed" && <ExecutedTransactions transactions={transactionsData?.executed || []} />}
      </div>
    </div>
  );
}