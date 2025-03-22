import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Campaigns from "@/pages/campaigns";
import ContentLibrary from "@/pages/content-library";
import Scheduling from "@/pages/scheduling";
import Analytics from "@/pages/analytics";
import AffiliatePrograms from "@/pages/affiliate-programs";
import AffiliateLinks from "@/pages/affiliate-links";
import Commissions from "@/pages/commissions";
import Audience from "@/pages/audience";
import Help from "@/pages/help";
import Settings from "@/pages/settings";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      
      {/* Main Section */}
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/content-library" component={ContentLibrary} />
      <Route path="/scheduling" component={Scheduling} />
      
      {/* Affiliate Management Section */}
      <Route path="/affiliate-programs" component={AffiliatePrograms} />
      <Route path="/commissions" component={Commissions} />
      <Route path="/affiliate-links" component={AffiliateLinks} />
      
      {/* Analytics Section */}
      <Route path="/analytics" component={Analytics} />
      <Route path="/audience" component={Audience} />
      
      {/* Other Pages */}
      <Route path="/settings" component={Settings} />
      <Route path="/help" component={Help} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden flex flex-col">
        <Header />
        <main className="p-4 md:p-6 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex-grow">{children}</main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout>
        <Router />
      </AppLayout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
