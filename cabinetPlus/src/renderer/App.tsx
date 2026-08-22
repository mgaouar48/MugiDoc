import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HashRouter, Routes, Route } from "react-router-dom";
import { LicenseGuard } from "@/components/activation/LicenseGuard";
import { FocusProvider } from "@/contexts/FocusProvider";
import Index from "./pages/Index";
import WaitingRoomDisplayPage from "./pages/WaitingRoomDisplayPage";
import NotFound from "./pages/NotFound";

const App = () => {
  // Détection permanente de la fenêtre d'affichage TV Salle d'attente
  const isDisplayWindow = window.location.search.includes('display') ||
                          window.location.hash.includes('display') ||
                          window.location.href.includes('display');

  if (isDisplayWindow) {
    return (
      <TooltipProvider>
        <WaitingRoomDisplayPage />
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <FocusProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<LicenseGuard><Index /></LicenseGuard>} />
            <Route path="/display" element={<WaitingRoomDisplayPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </FocusProvider>
    </TooltipProvider>
  );
};

export default App;
