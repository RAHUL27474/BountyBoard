import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { Link, useLocation } from "react-router-dom";
import { Zap, LayoutDashboard, PlusCircle, Search } from "lucide-react";

export function Navbar() {
  const { publicKey } = useWallet();
  const location = useLocation();

  const navLinks = [
    { to: "/", label: "Home", icon: Zap },
    { to: "/bounties", label: "Browse", icon: Search },
    ...(publicKey
      ? [
          { to: "/create", label: "Post Bounty", icon: PlusCircle },
          { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        ]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">
            Bounty<span className="text-purple-400">Board</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-purple-500/20 text-purple-400"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>

        <WalletMultiButton
          style={{
            backgroundColor: "#7c3aed",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            height: "2.5rem",
          }}
        />
      </div>
    </nav>
  );
}
