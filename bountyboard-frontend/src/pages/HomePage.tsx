import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { BountyCard } from "@/components/BountyCard";
import { api, type Bounty, type Stats } from "@/api/client";
import { Zap, Shield, Coins, Users, ArrowRight, TrendingUp } from "lucide-react";

export function HomePage() {
  const { publicKey } = useWallet();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentBounties, setRecentBounties] = useState<Bounty[]>([]);

  useEffect(() => {
    api.getStats().then(setStats).catch(console.error);
    api.listBounties({ status: "open", limit: "6" }).then(setRecentBounties).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="absolute right-1/4 top-1/3 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-24 text-center sm:py-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm text-purple-300">
            <Zap className="h-4 w-4" />
            Built on Solana — Fast, Cheap, Decentralized
          </div>
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
            Freelance Without
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Middlemen
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-400">
            Post bounties, find talent, and get paid — all on-chain. No platform fees, no escrow middleman, just trustless payments on Solana.
          </p>
          <div className="flex items-center justify-center gap-4">
            {publicKey ? (
              <>
                <Link to="/create">
                  <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                    Post a Bounty <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/bounties">
                  <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                    Browse Bounties
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <WalletMultiButton
                  style={{
                    backgroundColor: "#7c3aed",
                    borderRadius: "0.5rem",
                    fontSize: "1rem",
                    height: "3rem",
                    padding: "0 2rem",
                  }}
                />
                <Link to="/bounties">
                  <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                    Browse Bounties
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats && (
        <section className="border-y border-zinc-800 bg-zinc-900/50">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-12 sm:grid-cols-4">
            {[
              { label: "Total Bounties", value: stats.total_bounties, icon: TrendingUp },
              { label: "Open Bounties", value: stats.open_bounties, icon: Zap },
              { label: "Value Locked", value: `${stats.total_value_locked.toFixed(1)} SOL`, icon: Coins },
              { label: "Builders", value: stats.unique_claimers + stats.unique_posters, icon: Users },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="mx-auto mb-2 h-6 w-6 text-purple-400" />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-zinc-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold text-white">How It Works</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              icon: Coins,
              title: "Post a Bounty",
              desc: "Describe your task, set a reward in SOL, and deposit funds into escrow. Your bounty goes live instantly.",
            },
            {
              icon: Users,
              title: "Talent Claims It",
              desc: "Skilled freelancers browse and claim your bounty. They complete the work and submit their deliverables.",
            },
            {
              icon: Shield,
              title: "Approve & Pay",
              desc: "Review the submission. If satisfied, approve it and the escrowed SOL is released directly to the freelancer.",
            },
          ].map((step, i) => (
            <div key={i} className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center transition-all hover:border-purple-500/30 hover:bg-zinc-900">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 group-hover:from-purple-500/30 group-hover:to-cyan-500/30">
                <step.icon className="h-7 w-7 text-purple-400" />
              </div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-purple-400">
                Step {i + 1}
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">{step.title}</h3>
              <p className="text-sm text-zinc-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Bounties */}
      {recentBounties.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-20">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-white">Open Bounties</h2>
            <Link to="/bounties" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentBounties.map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty} />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-zinc-500">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-purple-400" />
            <span className="font-semibold text-white">BountyBoard</span>
          </div>
          <p>Decentralized Freelance Marketplace on Solana</p>
          <p className="mt-1">Built for Solana Frontier Hackathon 2026</p>
        </div>
      </footer>
    </div>
  );
}
