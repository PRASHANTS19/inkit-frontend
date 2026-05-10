import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Users
} from "lucide-react";

export default function QuickStats({ stats, showAssociateStats = false }) {
  const baseStatCards = [
    {
      title: "Total Cases",
      value: stats.totalCases,
      subValue: `${stats.activeCases} active`,
      icon: Briefcase,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100",
      iconBg: "bg-blue-500"
    },
    {
      title: "Upcoming Hearings",
      value: stats.upcomingHearings,
      subValue: "This week",
      icon: Calendar,
      gradient: "from-purple-500 to-purple-600", 
      bgGradient: "from-purple-50 to-purple-100",
      iconBg: "bg-purple-500"
    },
    {
      title: "Pending Tasks",
      value: stats.pendingTasks,
      subValue: "Requires attention",
      icon: CheckCircle2,
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-50 to-orange-100",
      iconBg: "bg-orange-500"
    },
    {
      title: "Outstanding Invoices",
      value: stats.outstandingInvoices,
      subValue: "Pending payment",
      icon: AlertTriangle,
      gradient: "from-red-500 to-red-600",
      bgGradient: "from-red-50 to-red-100", 
      iconBg: "bg-red-500"
    }
  ];

  // Add associate stats for law firm admins
  const associateStats = {
    title: "Team Associates",
    value: stats.totalAssociates,
    subValue: `${stats.activeAssociates} active`,
    icon: Users,
    gradient: "from-green-500 to-green-600",
    bgGradient: "from-green-50 to-green-100",
    iconBg: "bg-green-500"
  };

  const statCards = showAssociateStats 
    ? [...baseStatCards.slice(0, 3), associateStats, baseStatCards[3]]
    : baseStatCards;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-60`} />
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 bg-white/20 rounded-full" />
          
          <CardContent className="relative p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</h3>
              </div>
              <div className={`p-3 ${stat.iconBg} rounded-xl shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{stat.subValue}</p>
              <Badge variant="secondary" className="bg-white/80 text-slate-700">
                <TrendingUp className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}