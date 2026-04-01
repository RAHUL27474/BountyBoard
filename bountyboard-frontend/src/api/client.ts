const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface Bounty {
  id: string;
  title: string;
  description: string;
  category: string;
  reward_amount: number;
  reward_token: string;
  poster_wallet: string;
  claimer_wallet: string | null;
  status: string;
  submission_text: string | null;
  submission_link: string | null;
  escrow_tx: string | null;
  payment_tx: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  claimed_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
}

export interface User {
  wallet_address: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  bounties_posted: number;
  bounties_completed: number;
  total_earned: number;
  total_spent: number;
  reputation_score: number;
  created_at: string;
  updated_at: string;
}

export interface Stats {
  total_bounties: number;
  open_bounties: number;
  completed_bounties: number;
  total_value_locked: number;
  total_paid_out: number;
  unique_posters: number;
  unique_claimers: number;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Bounties
  createBounty: (data: {
    title: string;
    description: string;
    category: string;
    reward_amount: number;
    poster_wallet: string;
    escrow_tx?: string;
    deadline?: string;
  }) => apiFetch<Bounty>("/bounties", { method: "POST", body: JSON.stringify(data) }),

  listBounties: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<Bounty[]>(`/bounties${query}`);
  },

  getBounty: (id: string) => apiFetch<Bounty>(`/bounties/${id}`),

  claimBounty: (id: string, claimer_wallet: string) =>
    apiFetch<Bounty>(`/bounties/${id}/claim`, {
      method: "PUT",
      body: JSON.stringify({ claimer_wallet }),
    }),

  submitWork: (id: string, data: { claimer_wallet: string; submission_text?: string; submission_link?: string }) =>
    apiFetch<Bounty>(`/bounties/${id}/submit`, { method: "PUT", body: JSON.stringify(data) }),

  approveWork: (id: string, poster_wallet: string, payment_tx?: string) =>
    apiFetch<Bounty>(`/bounties/${id}/approve`, {
      method: "PUT",
      body: JSON.stringify({ poster_wallet, payment_tx }),
    }),

  disputeBounty: (id: string, wallet: string) =>
    apiFetch<Bounty>(`/bounties/${id}/dispute`, {
      method: "PUT",
      body: JSON.stringify({ wallet }),
    }),

  cancelBounty: (id: string, poster_wallet: string) =>
    apiFetch<Bounty>(`/bounties/${id}/cancel?poster_wallet=${poster_wallet}`, { method: "PUT" }),

  // Users
  getUser: (wallet: string) => apiFetch<User>(`/users/${wallet}`),

  updateUser: (wallet: string, data: { display_name?: string; bio?: string }) =>
    apiFetch<User>(`/users/${wallet}`, { method: "PUT", body: JSON.stringify(data) }),

  // Stats
  getStats: () => apiFetch<Stats>("/stats"),
};
