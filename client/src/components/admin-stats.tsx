import { Calendar, Play, Users, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAdmin } from "@/hooks/use-admin";

export function AdminStats() {
  const { stats } = useAdmin();

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="library-stats-card">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Events",
      value: stats.totalEvents,
      icon: Calendar,
      color: "bg-blue-100 text-primary",
      testId: "stat-total-events"
    },
    {
      title: "Active Sessions", 
      value: stats.activeSessions,
      icon: Play,
      color: "bg-green-100 text-green-600",
      testId: "stat-active-sessions"
    },
    {
      title: "Total Registrations",
      value: stats.totalRegistrations,
      icon: Users,
      color: "bg-purple-100 text-purple-600", 
      testId: "stat-total-registrations"
    },
    {
      title: "Revenue",
      value: `$${stats.revenue.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-yellow-100 text-yellow-600",
      testId: "stat-revenue"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat) => (
        <Card key={stat.title} className="library-stats-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground" data-testid={stat.testId}>
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
