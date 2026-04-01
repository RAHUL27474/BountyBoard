import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Coins } from "lucide-react";
import type { Bounty } from "@/api/client";

const statusColors: Record<string, string> = {
  open: "bg-green-500/20 text-green-400 border-green-500/30",
  claimed: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  submitted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  disputed: "bg-red-500/20 text-red-400 border-red-500/30",
  cancelled: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

const categoryColors: Record<string, string> = {
  development: "bg-cyan-500/20 text-cyan-400",
  design: "bg-pink-500/20 text-pink-400",
  writing: "bg-amber-500/20 text-amber-400",
  translation: "bg-indigo-500/20 text-indigo-400",
  marketing: "bg-orange-500/20 text-orange-400",
  research: "bg-emerald-500/20 text-emerald-400",
  general: "bg-zinc-500/20 text-zinc-400",
};

function shortWallet(wallet: string) {
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function BountyCard({ bounty }: { bounty: Bounty }) {
  return (
    <Link to={`/bounties/${bounty.id}`}>
      <Card className="group border-zinc-800 bg-zinc-900/50 transition-all hover:border-purple-500/50 hover:bg-zinc-900 hover:shadow-lg hover:shadow-purple-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
              {bounty.title}
            </h3>
            <Badge
              variant="outline"
              className={`shrink-0 ${statusColors[bounty.status] || statusColors.open}`}
            >
              {bounty.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="line-clamp-2 text-sm text-zinc-400">{bounty.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className={categoryColors[bounty.category] || categoryColors.general}>
              {bounty.category}
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-zinc-800 pt-3">
          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {shortWallet(bounty.poster_wallet)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {timeAgo(bounty.created_at)}
            </span>
          </div>
          <div className="flex items-center gap-1 text-lg font-bold text-purple-400">
            <Coins className="h-4 w-4" />
            {bounty.reward_amount} {bounty.reward_token}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
