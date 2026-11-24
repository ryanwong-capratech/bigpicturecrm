import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import LoginPage from "./pages/LoginPage";
import StudentsPage from "./pages/StudentsPage";
import StudentDetailPage from "./pages/StudentDetailPage";
import SettingsPage from "./pages/SettingsPage";
import { PortalAuthProvider, usePortalAuth } from "./contexts/PortalAuthContext";
import DashboardLayout from "./components/DashboardLayout";
import FontSizeToggle from "./components/FontSizeToggle";

function ProtectedRoutes() {
  const { authenticated, loading } = usePortalAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">載入中...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage />;
  }

  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={StudentsPage} />
        <Route path="/students" component={StudentsPage} />
        <Route path="/students/:id" component={StudentDetailPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <PortalAuthProvider>
          <TooltipProvider>
            <Toaster />
            <ProtectedRoutes />
            <FontSizeToggle />
          </TooltipProvider>
        </PortalAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
