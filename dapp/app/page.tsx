import { WalletInfo } from "@/components/WalletInfo";

export default function Home() {
  
  return (
        <main className="flex flex-col min-h-screen ml-64">
            <h1 className="text-4xl font-bold text-center mt-10">Welcome to the DApp</h1>
            <div>
            <WalletInfo />
            </div>
        </main>
  );
}
