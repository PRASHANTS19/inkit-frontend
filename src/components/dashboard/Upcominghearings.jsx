import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus
} from "lucide-react";

export default function UpcomingHearings({ hearings }) {
  // Load cases once and cache
  const { data: casesMap = {} } = useQuery({
    queryKey: ['hearings-cases'],
    queryFn: async () => {
      const cases = await base44.entities.Case.list();
      const map = {};
      cases.forEach(c => {
        map[c.id] = c;
      });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  const getCaseName = (caseId) => {
    const caseItem = casesMap[caseId];
    return caseItem ? caseItem.case_title : 'Loading...';
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            Upcoming Hearings
          </CardTitle>
          <Link to={createPageUrl("Calendar")}>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {hearings.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No upcoming hearings scheduled</p>
          </div>
        ) : (
          hearings.map((hearing) => (
            <div
              key={hearing.id}
              className="p-4 border-l-4 border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-slate-900">{hearing.hearing_type}</p>
                  <Link
                    to={createPageUrl(`Cases?view=${hearing.case_id}`)}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    {getCaseName(hearing.case_id)}
                  </Link>
                </div>
                <Badge variant="outline" className="bg-white">
                  {hearing.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>{format(new Date(hearing.hearing_date), 'MMM d, yyyy h:mm a')}</span>
                </div>

                {hearing.court_room && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4" />
                    <span>Room {hearing.court_room}</span>
                  </div>
                )}

                {hearing.judge_name && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="w-4 h-4" />
                    <span>{hearing.judge_name}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}