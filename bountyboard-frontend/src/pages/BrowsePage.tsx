import { useEffect, useState } from "react";
import { api, type Bounty } from "@/api/client";
import { BountyCard } from "@/components/BountyCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";

const categories = ["all", "development", "design", "writing", "translation", "marketing", "research", "general"];
const statuses = ["open", "claimed", "submitted", "completed"];

export function BrowsePage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("open");

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (selectedStatus) params.status = selectedStatus;
    if (selectedCategory !== "all") params.category = selectedCategory;
    if (searchTerm) params.search = searchTerm;

    api
      .listBounties(params)
      .then(setBounties)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCategory, selectedStatus, searchTerm]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Browse Bounties</h1>
        <p className="text-zinc-400">Find tasks that match your skills and start earning</p>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search bounties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-zinc-800 bg-zinc-900 pl-10 text-white placeholder:text-zinc-500 focus:border-purple-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-zinc-500 self-center mr-2">Status:</span>
          {statuses.map((s) => (
            <Badge
              key={s}
              className={`cursor-pointer transition-colors ${
                selectedStatus === s
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
              onClick={() => setSelectedStatus(s)}
            >
              {s}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-zinc-500 self-center mr-2">Category:</span>
          {categories.map((c) => (
            <Badge
              key={c}
              className={`cursor-pointer transition-colors ${
                selectedCategory === c
                  ? "bg-cyan-600 text-white hover:bg-cyan-700"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
              onClick={() => setSelectedCategory(c)}
            >
              {c}
            </Badge>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
        </div>
      ) : bounties.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-xl text-zinc-500">No bounties found</p>
          <p className="mt-2 text-sm text-zinc-600">Try adjusting your filters or search term</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bounties.map((bounty) => (
            <BountyCard key={bounty.id} bounty={bounty} />
          ))}
        </div>
      )}
    </div>
  );
}
