import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IndianRupee,
  TrendingUp,
  Clock,
  AlertTriangle
} from "lucide-react";

export default function BillingStats({ stats }) {
  const statCards = [
    {
      title: "Total Revenue",
      value: `₹${(stats.totalRevenue / 100000).toFixed(1)}L`,
      subValue: "All time earnings",
      icon: IndianRupee,
      bgGradient: "from-green-50 to-emerald-100",
      iconBg: "bg-green-500"
    },
    {
      title: "Outstanding Amount",
      value: `₹${(stats.outstandingAmount / 1000).toFixed(0)}K`,
      subValue: "Pending collection",
      icon: Clock,
      bgGradient: "from-yellow-50 to-orange-100",
      iconBg: "bg-yellow-500"
    },
    {
      title: "Paid This Month",
      value: `₹${(stats.paidThisMonth / 1000).toFixed(0)}K`,
      subValue: "Current month",
      icon: TrendingUp,
      bgGradient: "from-blue-50 to-blue-100",
      iconBg: "bg-blue-500"
    },
    {
      title: "Overdue Invoices",
      value: stats.overdueInvoices,
      subValue: "Requires attention",
      icon: AlertTriangle,
      bgGradient: "from-red-50 to-red-100",
      iconBg: "bg-red-500"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}