import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Briefcase,
  Calendar,
  MapPin,
  User,
  Eye,
  Edit,
  UserCheck
} from "lucide-react";

const formatDateSafe = (value, pattern, fallback = "N/A") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return format(date, pattern);
};

export default function CaseList({ cases, isLoading, onView, onEdit, onAssign, userRole }) {
  const statusColors = {
    ACTIVE: "bg-green-100 text-green-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    CLOSED: "bg-gray-100 text-gray-800",
    ON_HOLD: "bg-red-100 text-red-800",
    APPEAL: "bg-blue-100 text-blue-800"
  };

  const priorityColors = {
    HIGH: "bg-red-100 text-red-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    LOW: "bg-blue-100 text-blue-800"
  };

  const courtMapping = {
    Supreme_Court: "Supreme Court",
    High_Court: "High Court",
    District_Court: "District Court",
    Session_Court: "Sessions Court",
    Megistrate_Court: "Magistrate Court",
    Tribunal: "Tribunal",
  };

  if (isLoading) {
    return (
      <div className="grid gap-6">
        {Array(3).fill(0).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="p-12 text-center">
          <Briefcase className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {userRole === 'associate' ? 'No cases assigned yet' : 'No cases found'}
          </h3>
          <p className="text-slate-500">
            {userRole === 'associate'
              ? 'Cases assigned to you by your firm will appear here.'
              : 'Add your first case to get started with case management.'
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {cases.map((case_item) => (
        <Card key={case_item.id} className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-2">
                  <Briefcase className="w-6 h-6 text-amber-600 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{case_item.case_title}</h3>
                    <p className="text-slate-600">Case #{case_item.case_number}</p>
                    {case_item.cnr_number && (
                      <p className="text-xs text-slate-400 font-mono mt-0.5">CNR: {case_item.cnr_number}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge className={statusColors[case_item.status]}>
                    {case_item.status?.replace('_', ' ')}
                  </Badge>
                  <Badge className={priorityColors[case_item.priority]}>
                    {case_item.priority} priority
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50">
                    {courtMapping[case_item.court]}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50">
                    {case_item.case_type}
                  </Badge>
                  {case_item.ecourt_case_status && (
                    <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                      eCourt: {case_item.ecourt_case_status}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <Button
                  onClick={() => onView(case_item)}
                  variant="outline"
                  size="sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
                {userRole !== 'associate' && (
                  <Button
                    onClick={() => onEdit(case_item)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
                {onAssign && (
                  <Button
                    onClick={() => onAssign(case_item)}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Assign
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <User className="w-4 h-4" />
                <span><strong>Client:</strong> {case_item.client_name}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4" />
                <span><strong>Court:</strong> {courtMapping[case_item.court]}</span>
              </div>
              {case_item.next_hearing_date && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    <strong>Next Hearing:</strong>{' '}
                    {formatDateSafe(case_item.next_hearing_date, 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>

            {case_item.case_description && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-slate-600 text-sm line-clamp-2">{case_item.case_description}</p>
              </div>
            )}

            {case_item.tags && case_item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {case_item.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t flex justify-between items-center text-xs text-slate-500">
              <span>Created: {formatDateSafe(case_item.created_date, 'MMM d, yyyy', 'Unknown')}</span>
              {case_item.filing_date && (
                <span>Filed: {formatDateSafe(case_item.filing_date, 'MMM d, yyyy')}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
