import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  format, 
  startOfWeek, 
  eachDayOfInterval, 
  endOfWeek, 
  isSameDay, 
  isToday,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  addDays,
  isSameMonth
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  CheckSquare,
  Calendar as CalendarIcon,
  LayoutGrid
} from "lucide-react";

// 🔧 FIX #5: Calendar View Options (Day/Week/Month)
export default function CalendarView({ 
  currentDate, 
  events, 
  viewMode = 'week', 
  onViewModeChange,
  onWeekChange, 
  onDateClick,
  onEventClick 
}) {

  const getEventsForDay = (day) => {
    return events.filter(event => isSameDay(new Date(event.date), day));
  };

  const getEventColor = (event) => {
    if (event.type === 'hearing') {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (event.type === 'task') {
      if (event.priority === 'urgent') return 'bg-red-100 text-red-800 border-red-200';
      if (event.priority === 'high') return 'bg-orange-100 text-orange-800 border-orange-200';
      return 'bg-green-100 text-green-800 border-green-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Day View
  const renderDayView = () => {
    const dayEvents = getEventsForDay(currentDate).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    return (
      <div className="space-y-4">
        <div className="text-center py-6 border-b">
          <h2 className="text-3xl font-bold text-slate-900">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </h2>
        </div>
        
        {dayEvents.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">No events scheduled for this day</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvents.map((event) => (
              <Card
                key={event.id}
                onClick={() => onEventClick(event)}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {event.type === 'hearing' ? (
                          <MapPin className="w-5 h-5 text-blue-600" />
                        ) : (
                          <CheckSquare className="w-5 h-5 text-green-600" />
                        )}
                        <h3 className="font-semibold text-slate-900">{event.title}</h3>
                      </div>
                      {event.description && (
                        <p className="text-sm text-slate-600 mb-2">{event.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock className="w-4 h-4" />
                        <span>{format(new Date(event.date), 'h:mm a')}</span>
                      </div>
                    </div>
                    <Badge className={getEventColor(event)}>
                      {event.type === 'hearing' ? 'Hearing' : `${event.priority} priority`}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Week View
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <>
        {/* Week Header */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-center font-semibold text-slate-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isDayToday = isToday(day);
            
            return (
              <div
                key={day.toString()}
                onClick={() => onDateClick && onDateClick(day)}
                className={`min-h-32 p-2 border rounded-lg cursor-pointer ${
                  isDayToday 
                    ? 'bg-amber-50 border-amber-300' 
                    : 'bg-slate-50 border-slate-200'
                } hover:shadow-sm transition-shadow`}
              >
                <div className={`text-center mb-2 ${
                  isDayToday ? 'font-bold text-amber-700' : 'text-slate-600'
                }`}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={`p-2 rounded text-xs cursor-pointer hover:shadow-sm transition-shadow border ${getEventColor(event)}`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {event.type === 'hearing' ? (
                          <MapPin className="w-3 h-3" />
                        ) : (
                          <CheckSquare className="w-3 h-3" />
                        )}
                        <span className="font-medium truncate">{event.title}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs opacity-75">
                        <Clock className="w-3 h-3" />
                        <span>{format(new Date(event.date), 'HH:mm')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // Month View
  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    // Get all weeks in the month
    const weeks = eachWeekOfInterval(
      { start: monthStart, end: monthEnd },
      { weekStartsOn: 1 }
    );

    // Generate all days to display (including padding from previous/next month)
    const allDays = weeks.flatMap(weekStart => 
      eachDayOfInterval({ 
        start: weekStart, 
        end: addDays(weekStart, 6) 
      })
    );

    return (
      <>
        {/* Month Header */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-center font-semibold text-slate-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-7 gap-2">
          {allDays.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isDayToday = isToday(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            return (
              <div
                key={day.toString()}
                onClick={() => onDateClick && onDateClick(day)}
                className={`min-h-20 p-2 border rounded-lg cursor-pointer ${
                  !isCurrentMonth 
                    ? 'bg-slate-100 opacity-50' 
                    : isDayToday 
                    ? 'bg-amber-50 border-amber-300' 
                    : 'bg-white border-slate-200'
                } hover:shadow-sm transition-shadow`}
              >
                <div className={`text-center text-sm mb-1 ${
                  isDayToday ? 'font-bold text-amber-700' : 
                  !isCurrentMonth ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                      className={`p-1 rounded text-xs cursor-pointer hover:shadow-sm transition-shadow ${
                        event.type === 'hearing' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}
                    >
                      <span className="truncate block">{event.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const getNavigationLabel = () => {
    if (viewMode === 'day') {
      return format(currentDate, 'MMMM d, yyyy');
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="text-2xl font-bold text-slate-900">
            {getNavigationLabel()}
          </CardTitle>
          
          <div className="flex items-center gap-3">
            {/* View Mode Selector */}
            <Select value={viewMode} onValueChange={onViewModeChange}>
              <SelectTrigger className="w-32">
                <LayoutGrid className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day View</SelectItem>
                <SelectItem value="week">Week View</SelectItem>
                <SelectItem value="month">Month View</SelectItem>
              </SelectContent>
            </Select>

            {/* Navigation Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onWeekChange('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onWeekChange('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'month' && renderMonthView()}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-sm text-slate-600">Hearings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-sm text-slate-600">Tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-sm text-slate-600">Urgent</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}