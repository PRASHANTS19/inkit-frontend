import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, isAfter } from "date-fns";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Plus
} from "lucide-react";

const priorityColors = {
  urgent: "bg-red-500 text-white",
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-blue-100 text-blue-800"
};

export default function PendingTasks({ tasks }) {
  const sortedTasks = tasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Pending Tasks
          </CardTitle>
          <Link to={createPageUrl("Calendar")}>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No pending tasks</p>
          </div>
        ) : (
          sortedTasks.map((task) => {
            const isOverdue = isAfter(new Date(), new Date(task.due_date));
            
            return (
              <div 
                key={task.id} 
                className={`p-3 border rounded-lg transition-all duration-300 hover:shadow-sm ${
                  isOverdue 
                    ? 'border-red-200 bg-red-50' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{task.title}</p>
                    <p className="text-sm text-slate-600 mt-1">{task.task_type?.replace('_', ' ')}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Badge className={priorityColors[task.priority] || priorityColors.medium} size="sm">
                      {task.priority}
                    </Badge>
                    {isOverdue && (
                      <Badge className="bg-red-500 text-white" size="sm">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Overdue
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>Due {format(new Date(task.due_date), 'MMM d')}</span>
                  </div>
                  {task.estimated_hours && (
                    <span>{task.estimated_hours}h estimated</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}