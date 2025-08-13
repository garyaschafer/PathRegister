import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AdminLogin } from "@/components/admin-login";
import { AdminStats } from "@/components/admin-stats";
import { AdminEventsTable } from "@/components/admin-events-table";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";

export default function Admin() {
  const { isAdmin, isLoading, logout, isLoggingOut } = useAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <section className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Admin Header */}
          <div className="bg-background rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground" data-testid="text-admin-title">
                  Register Path Admin
                </h2>
                <p className="text-muted-foreground">Event Management Dashboard</p>
              </div>
              <Button 
                variant="outline"
                onClick={() => logout()}
                disabled={isLoggingOut}
                data-testid="button-admin-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <AdminStats />

          {/* Events Table */}
          <AdminEventsTable />
        </div>
      </section>

      <Footer />
    </div>
  );
}
