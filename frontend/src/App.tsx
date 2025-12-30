import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AdminIndex from "./pages/AdminIndex";
import Fixtures from "./pages/Fixtures";
import NotFound from "./pages/NotFound";
import TeamRankings from "./pages/TeamRanking";
import TeamRosters from "./pages/TeamRosters";
import Transactions from "./pages/Transactions";
import TeamManagement from "./pages/TeamManagement";
import TeamDetails from "./pages/TeamDetails";
import { CooldownsPage } from "./pages/CooldownsPage";
import HomePage from "./pages/Home";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={<AdminIndex />} />
          {/* <Route path="/rankings" element={<TeamRankings />} /> */}
          <Route index path="/rosters" element={<TeamRosters />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/team/:id/manage" element={<TeamManagement />} />
          <Route path="/team/:id/view" element={<TeamDetails />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/fixtures" element={<Fixtures />} />
          <Route path="/cooldowns" element={<CooldownsPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;