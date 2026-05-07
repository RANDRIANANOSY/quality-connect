import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import Overview from "./pages/Overview";
import Agencies from "./pages/Agencies";
import AgencyDetail from "./pages/AgencyDetail";
import Dossiers from "./pages/Dossiers";
import Validations from "./pages/Validations";
import Quality from "./pages/Quality";
import Anomalies from "./pages/Anomalies";
import Audit from "./pages/Audit";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" richColors />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Overview />} />
              <Route path="/agencies" element={<Agencies />} />
              <Route path="/agencies/:id" element={<AgencyDetail />} />
              <Route path="/dossiers" element={<Dossiers />} />
              <Route path="/validations" element={<Validations />} />
              <Route path="/quality" element={<Quality />} />
              <Route path="/anomalies" element={<Anomalies />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
