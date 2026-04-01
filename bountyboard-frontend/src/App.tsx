import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletProvider";
import { Navbar } from "@/components/Navbar";
import { HomePage } from "@/pages/HomePage";
import { BrowsePage } from "@/pages/BrowsePage";
import { BountyDetailPage } from "@/pages/BountyDetailPage";
import { CreateBountyPage } from "@/pages/CreateBountyPage";
import { DashboardPage } from "@/pages/DashboardPage";

function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-zinc-950 text-white">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/bounties" element={<BrowsePage />} />
            <Route path="/bounties/:id" element={<BountyDetailPage />} />
            <Route path="/create" element={<CreateBountyPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </WalletProvider>
  );
}

export default App;
