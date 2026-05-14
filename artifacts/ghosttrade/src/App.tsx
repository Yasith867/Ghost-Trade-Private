import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/lib/wallet-context";
import WalletModal from "@/components/WalletModal";
import WalletToastManager from "@/components/WalletToastManager";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Home from "@/pages/home";
import GhostAIPage from "@/pages/ghostai-page";
import SSIPage from "@/pages/ssi-page";
import SectorsPage from "@/pages/sectors-page";
import EcosystemPage from "@/pages/ecosystem-page";
import PortfolioPage from "@/pages/portfolio-page";
import WatchlistsPage from "@/pages/watchlists-page";
import SettingsPage from "@/pages/settings-page";
import JudgesPage from "@/pages/judges-page";
import LiveChartsPage from "@/pages/live-charts-page";

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "")}>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/terminal" component={Dashboard} />
              <Route path="/ghostai" component={GhostAIPage} />
              <Route path="/ssi" component={SSIPage} />
              <Route path="/sectors" component={SectorsPage} />
              <Route path="/ecosystem" component={EcosystemPage} />
              <Route path="/portfolio" component={PortfolioPage} />
              <Route path="/watchlists" component={WatchlistsPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/live-charts" component={LiveChartsPage} />
              <Route path="/judges" component={JudgesPage} />
              <Route component={NotFound} />
            </Switch>
          </WouterRouter>
          {/* Global overlays — live inside WalletProvider so they can access context */}
          <WalletModal />
          <WalletToastManager />
          <Toaster />
        </TooltipProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
