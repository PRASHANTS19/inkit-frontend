import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, IndianRupee, BarChart3 } from "lucide-react";

export default function RevenueChart({ invoices }) {
  // Process invoice data to create monthly revenue
  const getMonthlyRevenue = () => {
    const monthlyData = {};
    const currentDate = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      monthlyData[monthKey] = {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: 0
      };
    }

    // Sum up paid invoices by month
    invoices.forEach(invoice => {
      if (invoice.status === 'paid' && invoice.payment_date) {
        const monthKey = invoice.payment_date.slice(0, 7);
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].revenue += invoice.total_amount || 0;
        }
      }
    });

    return Object.values(monthlyData);
  };

  const monthlyData = getMonthlyRevenue();
  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));
  const totalRevenue = monthlyData.reduce((sum, d) => sum + d.revenue, 0);
  const avgMonthly = totalRevenue / monthlyData.length;

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-green-600" />
          Revenue Trend (Last 6 Months)
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-green-600">
          <TrendingUp className="w-4 h-4" />
          <span>Monthly revenue tracking</span>
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
                    width: maxRevenue > 0 ? `${(data.revenue / maxRevenue) * 100}%` : '0%',
                    animationDelay: `${index * 100}ms`
                  }}
                />
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                <IndianRupee className="w-3 h-3" />
                <span>{data.revenue > 999 ? `${(data.revenue / 1000).toFixed(0)}K` : data.revenue}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-green-700">Total Revenue (6 months)</p>
              <p className="text-2xl font-bold text-green-800">₹{(totalRevenue / 100000).toFixed(1)}L</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-700">Avg Monthly</p>
              <p className="text-lg font-semibold text-green-800">₹{(avgMonthly / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}