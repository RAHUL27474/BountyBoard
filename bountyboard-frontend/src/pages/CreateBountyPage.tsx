import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { api } from "@/api/client";
import { createEscrowTransaction } from "@/api/solana";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Coins, Loader2, ArrowRight } from "lucide-react";

const categories = [
  { value: "development", label: "Development" },
  { value: "design", label: "Design" },
  { value: "writing", label: "Writing" },
  { value: "translation", label: "Translation" },
  { value: "marketing", label: "Marketing" },
  { value: "research", label: "Research" },
  { value: "general", label: "General" },
];

export function CreateBountyPage() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("development");
  const [rewardAmount, setRewardAmount] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !sendTransaction) return;

    setLoading(true);
    setError("");

    try {
      const amount = parseFloat(rewardAmount);

      // Build and send escrow transaction
      const tx = await createEscrowTransaction(publicKey, amount);
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");

      // Create bounty in backend with the escrow tx signature
      const bounty = await api.createBounty({
        title,
        description,
        category,
        reward_amount: amount,
        poster_wallet: publicKey.toBase58(),
        escrow_tx: signature,
      });
      navigate(`/bounties/${bounty.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create bounty");
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h1>
        <p className="text-zinc-400">You need to connect your Solana wallet to post a bounty.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-2">Post a Bounty</h1>
      <p className="text-zinc-400 mb-8">Describe your task and set a reward to attract talent</p>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Coins className="h-5 w-5 text-purple-400" />
            Bounty Details
          </h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Title</label>
              <Input
                required
                minLength={3}
                maxLength={200}
                placeholder="e.g., Build a responsive landing page"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-zinc-700 bg-zinc-800 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Description</label>
              <Textarea
                required
                minLength={10}
                maxLength={5000}
                placeholder="Describe the task in detail. Include requirements, deliverables, and any relevant links..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border-zinc-700 bg-zinc-800 text-white min-h-40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Category</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                      category === cat.value
                        ? "border-purple-500 bg-purple-500/20 text-purple-300"
                        : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Reward Amount (SOL)</label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(e.target.value)}
                  className="border-zinc-700 bg-zinc-800 pl-10 text-white text-lg"
                />
              </div>
              <p className="text-xs text-zinc-500">
                This amount will be held in escrow until you approve the work
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || !title || !description || !rewardAmount}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white text-lg py-6"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <ArrowRight className="h-5 w-5 mr-2" />
              )}
              Post Bounty
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
