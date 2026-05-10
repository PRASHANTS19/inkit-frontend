import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, isAfter, differenceInDays } from "date-fns";
import { Case } from "@/entities/Case";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  MapPin,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Trash2
} from "lucide-react";

const hearingTypeColors = {
  preliminary: "bg-blue-100 text-blue-800",
  arguments: "bg-purple-100 text-purple-800",
  evidence: "bg-green-100 text-green-800",
  judgment: "bg-red-100 text-red-800",
  bail: "bg-orange-100 text-orange-800",
  interim: "bg-yellow-100 text-yellow-800",
  final: "bg-slate-100 text-slate-800"
};

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  postponed: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800"
};

export default function HearingList({ hearings, onHearingUpdate, onHearingEdit, onHearingDelete }) {
  const [casesMap, setCasesMap] = useState({});
  const [isLoadingCases, setIsLoadingCases] = useState(true);

  useEffect(() => {
    loadCases();
  }, [hearings]);

  const loadCases = async () => {
    setIsLoadingCases(true);
    try {
      const caseIds = [...new Set(hearings.map(h => h.case_id))];
      const cases = await Case.list();
      const map = {};
      cases.forEach(c => {
        map[c.id] = c;
      });
      setCasesMap(map);
    } catch (error) {
      console.error('Error loading cases for hearings:', error);
    }
    setIsLoadingCases(false);
  };

  const getCaseName = (caseId) => {
    const caseItem = casesMap[caseId];
    return caseItem ? caseItem.case_title : 'Unknown Case';
  };

  const getDaysUntilHearing = (hearingDate) => {
    const now = new Date();
    const hearing = new Date(hearingDate);
    return differenceInDays(hearing, now);
  };

  const getUrgencyBadge = (hearingDate) => {
    const days = getDaysUntilHearing(hearingDate);
    if (days < 0) return { label: 'Past Due', className: 'bg-red-500 text-white' };
    if (days === 0) return { label: 'Today', className: 'bg-red-500 text-white' };
    if (days === 1) return { label: 'Tomorrow', className: 'bg-orange-500 text-white' };
    if (days <= 3) return { label: `${days} days`, className: 'bg-amber-500 text-white' };
    if (days <= 7) return { label: `${days} days`, className: 'bg-yellow-100 text-yellow-800' };
    return null;
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-6 h-6 text-blue-600" />
          Upcoming Hearings ({hearings.length})
        </CardTitle>
        <p className="text-slate-600">
          Court hearings and appearances scheduled
        </p>
      </CardHeader>

      <CardContent>
        {hearings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">No upcoming hearings scheduled</p>
          </div>
        ) : (
          <div className="space-y-4">
            {hearings.map((hearing) => {
              const urgency = getUrgencyBadge(hearing.hearing_date);

              return (
                <Card
                  key={hearing.id}
                  className="border border-slate-200 hover:border-blue-300 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-slate-900 text-lg">
                            {hearing.hearing_type.replace('_', ' ').toUpperCase()} Hearing
                          </h4>
                          {urgency && (
                            <Badge className={urgency.className}>
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {urgency.label}
                            </Badge>
                          )}
                        </div>
                        <Link
                          to={createPageUrl(`Cases?view=${hearing.case_id}`)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          Case: {isLoadingCases ? 'Loading...' : getCaseName(hearing.case_id)}
                        </Link>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Badge className={hearingTypeColors[hearing.hearing_type] || hearingTypeColors.preliminary}>
                          {hearing.hearing_type}
                        </Badge>
                        <Badge className={statusColors[hearing.status] || statusColors.scheduled}>
                          {hearing.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">
                          {format(new Date(hearing.hearing_date), 'MMMM d, yyyy')}
                        </span>
                        <span className="text-slate-500">
                          at {format(new Date(hearing.hearing_date), 'h:mm a')}
                        </span>
                      </div>

                      {hearing.court_room && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin className="w-4 h-4" />
                          <span>Court Room {hearing.court_room}</span>
                        </div>
                      )}

                      {hearing.judge_name && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <User className="w-4 h-4" />
                          <span>Hon'ble {hearing.judge_name}</span>
                        </div>
                      )}
                    </div>

                    {hearing.notes && (
                      <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                        <h5 className="font-medium text-slate-900 mb-1">Notes:</h5>
                        <p className="text-sm text-slate-700">{hearing.notes}</p>
                      </div>
                    )}

                    {hearing.preparation_checklist && hearing.preparation_checklist.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Preparation Checklist:
                        </h5>
                        <div className="space-y-1">
                          {hearing.preparation_checklist.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              {item.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                <div className="w-4 h-4 border border-slate-300 rounded"></div>
                              )}
                              <span className={item.completed ? 'line-through text-slate-500' : 'text-slate-700'}>
                                {item.item}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {hearing.outcome && (
                      <div className="pt-3 border-t border-slate-200">
                        <h5 className="font-medium text-slate-900 mb-1">Outcome:</h5>
                        <p className="text-sm text-slate-700">{hearing.outcome}</p>
                        {hearing.next_hearing_date && (
                          <p className="text-sm text-blue-600 mt-1">
                            Next hearing: {format(new Date(hearing.next_hearing_date), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-200">
                      {onHearingEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onHearingEdit(hearing)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )}
                      {onHearingDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onHearingDelete(hearing)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}