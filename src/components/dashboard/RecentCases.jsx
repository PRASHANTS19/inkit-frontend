
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import {
  ExternalLink,
  Calendar,
  User,
  MapPin,
  ArrowRight,
  Briefcase
} from "lucide-react";

const statusColors = {
  active: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  closed: "bg-gray-100 text-gray-800 border-gray-200",
  on_hold: "bg-red-100 text-red-800 border-red-200"
};

const priorityColors = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800", 
  low: "bg-blue-100 text-blue-800"
};

const formatDateSafe = (value, pattern, fallback = "N/A") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return format(date, pattern);
};

export default function RecentCases({ cases }) {
  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-slate-900">Recent Cases</CardTitle>
          <Link to={createPageUrl("Cases")}>
            <Button variant="outline" size="sm" className="gap-2">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {cases.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No cases found. Start by adding your first case.</p>
            <Link to={createPageUrl("Cases")}>
              <Button className="mt-3" size="sm">Add First Case</Button>
            </Link>
          </div>
        ) : (
          cases.map((case_item) => (
            <div 
              key={case_item.id} 
              className="p-4 border border-slate-200 rounded-xl hover:shadow-md transition-all duration-300 hover:border-amber-300 bg-white"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 text-lg">{case_item.case_title}</h4>
                  <p className="text-sm text-slate-600 mt-1">{case_item.case_number}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Badge className={statusColors[case_item.status] || statusColors.pending}>
                    {case_item.status?.replace('_', ' ')}
                  </Badge>
                  <Badge className={priorityColors[case_item.priority] || priorityColors.medium}>
                    {case_item.priority} priority
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User className="w-4 h-4" />
                  <span>{case_item.client_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4" />
                  <span>{case_item.court?.replace('_', ' ')}</span>
                </div>
                {case_item.next_hearing_date && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>Next: {formatDateSafe(case_item.next_hearing_date, 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500">
                  Created {formatDateSafe(case_item.created_date, 'MMM d, yyyy', 'Unknown')}
                </p>
                <Link to={createPageUrl(`Cases?view=${case_item.id}`)}>
                  <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
