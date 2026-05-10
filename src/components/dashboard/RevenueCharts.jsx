import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, IndianRupee, BarChart3 } from "lucide-react";

export default function RevenueChart() {
  // Mock data for demonstration
  const monthlyData = [
    { month: 'Jan', revenue: 250000 },
    { month: 'Feb', revenue: 320000 },
    { month: 'Mar', revenue: 410000 },
    { month: 'Apr', revenue: 380000 },
    { month: 'May', revenue: 450000 },
    { month: 'Jun', revenue: 520000 }
  ];

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-green-600" />
          Revenue Trend
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-green-600">
          <TrendingUp className="w-4 h-4" />
          <span>+15% from last month</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {monthlyData.map((data, index) => (
            <div key={data.month} className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-600 w-8">{data.month}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${(data.revenue / maxRevenue) * 100}%`,
                    animationDelay: `${index * 100}ms`
                  }}
                />
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                <IndianRupee className="w-3 h-3" />
                <span>{(data.revenue / 1000).toFixed(0)}K</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-green-700">Total Revenue (YTD)</p>
              <p className="text-2xl font-bold text-green-800">₹23.3L</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-700">Avg Monthly</p>
              <p className="text-lg font-semibold text-green-800">₹3.9L</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}