import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Task, Case } from "@/entities/all";
import { format, isAfter, differenceInDays, isPast } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  User,
  CheckCircle2,
  Circle,
  Briefcase,
  Edit,
  Trash2
} from "lucide-react";

const priorityColors = {
  urgent: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-blue-100 text-blue-800 border-blue-200"
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800"
};

export default function TaskList({ tasks, onTaskUpdate, onTaskEdit, onTaskDelete }) {
  const [casesMap, setCasesMap] = useState({});
  const [isLoadingCases, setIsLoadingCases] = useState(true);

  useEffect(() => {
    loadCases();
  }, [tasks]);

  const loadCases = async () => {
    setIsLoadingCases(true);
    try {
      const cases = await Case.list();
      const map = {};
      cases.forEach(c => {
        map[c.id] = c;
      });
      setCasesMap(map);
    } catch (error) {
      console.error('Error loading cases for tasks:', error);
    }
    setIsLoadingCases(false);
  };

  const getCaseName = (caseId) => {
    const caseItem = casesMap[caseId];
    return caseItem ? caseItem.case_title : 'Unknown Case';
  };

  const handleStatusUpdate = async (task, newStatus) => {
    try {
      await Task.update(task.id, {
        status: newStatus,
        actual_hours: newStatus === 'completed' ? task.estimated_hours : task.actual_hours
      });
      onTaskUpdate();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const getDaysUntilDue = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    return differenceInDays(due, now);
  };

  const getUrgencyBadge = (dueDate) => {
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return { label: 'Overdue', className: 'bg-red-500 text-white' };
    if (days === 0) return { label: 'Due Today', className: 'bg-orange-500 text-white' };
    if (days === 1) return { label: 'Due Tomorrow', className: 'bg-yellow-500 text-white' };
    if (days <= 3) return { label: `${days} days left`, className: 'bg-amber-100 text-amber-800' };
    return null;
  };

  // Separate tasks into categories
  const overdueTasks = tasks.filter(t =>
    t.status !== 'completed' && t.status !== 'cancelled' && isPast(new Date(t.due_date))
  );

  const upcomingTasks = tasks.filter(t =>
    t.status !== 'completed' && t.status !== 'cancelled' && !isPast(new Date(t.due_date))
  );

  const completedTasks = tasks.filter(t => t.status === 'completed');

  const renderTask = (task) => {
    const urgency = getUrgencyBadge(task.due_date);
    const isOverdue = isPast(new Date(task.due_date)) && task.status !== 'completed' && task.status !== 'cancelled';

    return (
      <Card
        key={task.id}
        className={`border ${isOverdue
            ? 'border-red-200 bg-red-50'
            : 'border-slate-200 hover:border-slate-300'
          } transition-colors`}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleStatusUpdate(
                      task,
                      task.status === 'completed' ? 'pending' : 'completed'
                    )
                  }
                  className="p-0 h-auto"
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                  )}
                </Button>
                <div className="flex-1">
                  <h4 className={`font-semibold ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'
                    }`}>
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 ml-4 flex-shrink-0">
              {urgency && (
                <Badge className={urgency.className}>
                  {urgency.label}
                </Badge>
              )}
              <Badge className={priorityColors[task.priority] || priorityColors.medium}>
                {task.priority}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600 ml-8">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>Due: {format(new Date(task.due_date), 'MMM d, yyyy h:mm a')}</span>
            </div>

            <div className="flex items-center gap-2">
              <User className="w-4 h-4 flex-shrink-0" />
              <span>Assigned to: {task.assigned_to || 'Unassigned'}</span>
            </div>

            {task.case_id && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 flex-shrink-0" />
                <Link
                  to={createPageUrl(`Cases?view=${task.case_id}`)}
                  className="text-blue-600 hover:text-blue-800 hover:underline truncate"
                >
                  {isLoadingCases ? 'Loading...' : getCaseName(task.case_id)}
                </Link>
              </div>
            )}

            {task.estimated_hours && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>Est: {task.estimated_hours}h</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 ml-8">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={statusColors[task.status]}>
                {task.status.replace('_', ' ')}
              </Badge>
              {task.task_type && (
                <Badge variant="outline" className="text-xs">
                  {task.task_type.replace('_', ' ')}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs text-slate-500 mr-2">
                Created {format(new Date(task.created_date), 'MMM d')}
              </div>
              {onTaskEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTaskEdit(task)}
                  className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Edit className="w-3 h-3" />
                </Button>
              )}
              {onTaskDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTaskDelete(task)}
                  className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-green-600" />
          All Tasks ({tasks.length})
        </CardTitle>
        <p className="text-slate-600 text-sm">
          Tasks across all your cases
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">No tasks found</p>
          </div>
        ) : (
          <>
            {/* Overdue Tasks */}
            {overdueTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-slate-900">Overdue ({overdueTasks.length})</h3>
                </div>
                <div className="space-y-4">
                  {overdueTasks.map(renderTask)}
                </div>
              </div>
            )}

            {/* Upcoming Tasks */}
            {upcomingTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-slate-900">Upcoming ({upcomingTasks.length})</h3>
                </div>
                <div className="space-y-4">
                  {upcomingTasks.map(renderTask)}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-slate-900">Completed ({completedTasks.length})</h3>
                </div>
                <div className="space-y-4">
                  {completedTasks.slice(0, 5).map(renderTask)}
                </div>
                {completedTasks.length > 5 && (
                  <p className="text-sm text-slate-500 text-center mt-4">
                    + {completedTasks.length - 5} more completed tasks
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}