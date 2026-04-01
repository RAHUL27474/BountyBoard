import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { api, type Bounty } from "@/api/client";
import { createPaymentTransaction } from "@/api/solana";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Clock, User, Coins, ExternalLink, CheckCircle,
  AlertTriangle, XCircle, Loader2, Send
} from "lucide-react";

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle }> = {
  open: { color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle },
  claimed: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
  submitted: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Send },
  completed: { color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: CheckCircle },
  disputed: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertTriangle },
  cancelled: { color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30", icon: XCircle },
};

function shortWallet(wallet: string) {
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export function BountyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const walletAddr = publicKey?.toBase58() || "";

  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [submissionText, setSubmissionText] = useState("");
  const [submissionLink, setSubmissionLink] = useState("");

  useEffect(() => {
    if (!id) return;
    api.getBounty(id).then(setBounty).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleAction = async (action: () => Promise<Bounty>) => {
    setActionLoading(true);
    setError("");
    try {
      const updated = await action();
      setBounty(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-xl text-zinc-500">Bounty not found</p>
        <Link to="/bounties" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
          Back to bounties
        </Link>
      </div>
    );
  }

  const isPoster = walletAddr === bounty.poster_wallet;
  const isClaimer = walletAddr === bounty.claimer_wallet;
  const config = statusConfig[bounty.status] || statusConfig.open;
  const StatusIcon = config.icon;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/bounties" className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to bounties
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-3xl font-bold text-white">{bounty.title}</h1>
          <Badge variant="outline" className={`shrink-0 text-base px-3 py-1 ${config.color}`}>
            <StatusIcon className="mr-1 h-4 w-4" />
            {bounty.status}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            Posted by {shortWallet(bounty.poster_wallet)}
            {isPoster && <span className="text-purple-400">(you)</span>}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {new Date(bounty.created_at).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1 text-lg font-bold text-purple-400">
            <Coins className="h-5 w-5" />
            {bounty.reward_amount} {bounty.reward_token}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Description</h2>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-zinc-300">{bounty.description}</p>
            </CardContent>
          </Card>

          {/* Submission Section */}
          {bounty.submission_text || bounty.submission_link ? (
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <h2 className="text-lg font-semibold text-white">Submission</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                {bounty.submission_text && (
                  <p className="whitespace-pre-wrap text-zinc-300">{bounty.submission_text}</p>
                )}
                {bounty.submission_link && (
                  <a
                    href={bounty.submission_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300"
                  >
                    <ExternalLink className="h-4 w-4" /> View Deliverable
                  </a>
                )}
              </CardContent>
            </Card>
          ) : null}

          {/* Submit Work Form */}
          {isClaimer && bounty.status === "claimed" && (
            <Card className="border-purple-500/30 bg-zinc-900/50">
              <CardHeader>
                <h2 className="text-lg font-semibold text-white">Submit Your Work</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Describe what you've completed..."
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  className="border-zinc-700 bg-zinc-800 text-white min-h-32"
                />
                <Input
                  placeholder="Link to deliverable (GitHub, Figma, etc.)"
                  value={submissionLink}
                  onChange={(e) => setSubmissionLink(e.target.value)}
                  className="border-zinc-700 bg-zinc-800 text-white"
                />
                <Button
                  onClick={() =>
                    handleAction(() =>
                      api.submitWork(bounty.id, {
                        claimer_wallet: walletAddr,
                        submission_text: submissionText || undefined,
                        submission_link: submissionLink || undefined,
                      })
                    )
                  }
                  disabled={actionLoading || (!submissionText && !submissionLink)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Submit Work
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Actions Card */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Actions</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {!walletAddr && (
                <p className="text-sm text-zinc-500">Connect your wallet to take action</p>
              )}

              {/* Claim */}
              {walletAddr && bounty.status === "open" && !isPoster && (
                <Button
                  onClick={() => handleAction(() => api.claimBounty(bounty.id, walletAddr))}
                  disabled={actionLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Claim This Bounty
                </Button>
              )}

              {/* Approve */}
              {isPoster && bounty.status === "submitted" && (
                <Button
                  onClick={async () => {
                    if (!publicKey || !sendTransaction || !bounty.claimer_wallet) return;
                    setActionLoading(true);
                    setError("");
                    try {
                      const tx = await createPaymentTransaction(
                        publicKey,
                        bounty.claimer_wallet,
                        bounty.reward_amount
                      );
                      const signature = await sendTransaction(tx, connection);
                      await connection.confirmTransaction(signature, "confirmed");
                      const updated = await api.approveWork(bounty.id, walletAddr, signature);
                      setBounty(updated);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Payment failed");
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  disabled={actionLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Approve & Pay
                </Button>
              )}

              {/* Dispute */}
              {walletAddr &&
                (isPoster || isClaimer) &&
                ["submitted", "claimed"].includes(bounty.status) && (
                  <Button
                    onClick={() => handleAction(() => api.disputeBounty(bounty.id, walletAddr))}
                    disabled={actionLoading}
                    variant="outline"
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" /> Dispute
                  </Button>
                )}

              {/* Cancel */}
              {isPoster && bounty.status === "open" && (
                <Button
                  onClick={() => handleAction(() => api.cancelBounty(bounty.id, walletAddr))}
                  disabled={actionLoading}
                  variant="outline"
                  className="w-full border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                >
                  <XCircle className="h-4 w-4 mr-2" /> Cancel Bounty
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Details</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Category</span>
                <Badge className="bg-cyan-500/20 text-cyan-400">{bounty.category}</Badge>
              </div>
              <Separator className="bg-zinc-800" />
              <div className="flex justify-between">
                <span className="text-zinc-500">Reward</span>
                <span className="font-semibold text-white">{bounty.reward_amount} {bounty.reward_token}</span>
              </div>
              <Separator className="bg-zinc-800" />
              {bounty.claimer_wallet && (
                <>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Claimed by</span>
                    <span className="text-white">{shortWallet(bounty.claimer_wallet)}</span>
                  </div>
                  <Separator className="bg-zinc-800" />
                </>
              )}
              {bounty.escrow_tx && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Escrow TX</span>
                    <a
                      href={`https://explorer.solana.com/tx/${bounty.escrow_tx}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <Separator className="bg-zinc-800" />
                </>
              )}
              {bounty.payment_tx && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Payment TX</span>
                  <a
                    href={`https://explorer.solana.com/tx/${bounty.payment_tx}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
