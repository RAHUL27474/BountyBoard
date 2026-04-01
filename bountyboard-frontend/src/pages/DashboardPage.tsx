import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { api, type Bounty, type User } from "@/api/client";
import { BountyCard } from "@/components/BountyCard";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, Trophy, Send, Loader2, Wallet } from "lucide-react";

export function DashboardPage() {
  const { publicKey } = useWallet();
  const walletAddr = publicKey?.toBase58() || "";

  const [user, setUser] = useState<User | null>(null);
  const [postedBounties, setPostedBounties] = useState<Bounty[]>([]);
  const [claimedBounties, setClaimedBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddr) return;

    setLoading(true);
    Promise.all([
      api.getUser(walletAddr).catch(() => null),
      api.listBounties({ poster: walletAddr }),
      api.listBounties({ claimer: walletAddr }),
    ])
      .then(([u, posted, claimed]) => {
        setUser(u);
        setPostedBounties(posted);
        setClaimedBounties(claimed);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [walletAddr]);

  if (!publicKey) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Wallet className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
        <h1 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h1>
        <p className="text-zinc-400">Connect your Solana wallet to view your dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
      <p className="text-zinc-400 mb-8 font-mono text-sm">{walletAddr}</p>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Bounties Posted", value: user?.bounties_posted || 0, icon: Send, color: "text-cyan-400" },
          { label: "Bounties Completed", value: user?.bounties_completed || 0, icon: Trophy, color: "text-green-400" },
          { label: "Total Earned", value: `${(user?.total_earned || 0).toFixed(2)} SOL`, icon: Coins, color: "text-purple-400" },
          { label: "Total Spent", value: `${(user?.total_spent || 0).toFixed(2)} SOL`, icon: Wallet, color: "text-amber-400" },
        ].map((stat) => (
          <Card key={stat.label} className="border-zinc-800 bg-zinc-900/50">
            <CardContent className="flex items-center gap-4 p-6">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-zinc-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bounty Tabs */}
      <Tabs defaultValue="posted" className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="posted" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            Posted ({postedBounties.length})
          </TabsTrigger>
          <TabsTrigger value="claimed" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            Claimed ({claimedBounties.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posted">
          {postedBounties.length === 0 ? (
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="py-12 text-center">
                <p className="text-zinc-500">You haven't posted any bounties yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {postedBounties.map((b) => (
                <BountyCard key={b.id} bounty={b} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="claimed">
          {claimedBounties.length === 0 ? (
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardContent className="py-12 text-center">
                <p className="text-zinc-500">You haven't claimed any bounties yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {claimedBounties.map((b) => (
                <BountyCard key={b.id} bounty={b} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
