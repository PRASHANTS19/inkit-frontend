import React, { useState, useEffect } from "react";
import { Task, Hearing, Case } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from "date-fns";
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  CheckSquare,
  AlertTriangle
} from "lucide-react";

import CalendarView from "../components/calendar/CalendarView";
import EventForm from "../components/calendar/EventForm";
import TaskList from "../components/calendar/TaskList";
import HearingList from "../components/calendar/HearingList";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // Add view mode state
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [hearings, setHearings] = useState([]);
  const [cases, setCases] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCalendarData();
    loadCases();
  }, []);

  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      const [taskData, hearingData] = await Promise.all([
        Task.list('due_date'),
        Hearing.list('hearing_date')
      ]);

      setTasks(taskData);
      setHearings(hearingData);

      // Combine tasks and hearings into events
      const combinedEvents = [
        ...taskData.map(task => ({
          ...task,
          type: 'task',
          date: task.due_date,
          title: task.title
        })),
        ...hearingData.map(hearing => ({
          ...hearing,
          type: 'hearing',
          date: hearing.hearing_date,
          title: `${hearing.hearing_type} - ${hearing.case_id}`
        }))
      ];

      setEvents(combinedEvents);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    }
    setIsLoading(false);
  };

  const loadCases = async () => {
    try {
      const caseData = await Case.list();
      setCases(caseData);
    } catch (error) {
      console.error('Error loading cases:', error);
    }
  };

  const handleWeekChange = (direction) => {
    if (direction === 'prev') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleDateClick = (date) => {
    setCurrentDate(date);
    setViewMode('day');
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setShowEventForm(true);
  };

  const handleEventSave = async (eventData) => {
    try {
      if (eventData.type === 'task') {
        if (selectedEvent) await Task.update(selectedEvent.id, eventData);
        else await Task.create(eventData);
      } else { // type is 'hearing'
        if (selectedEvent) await Hearing.update(selectedEvent.id, eventData);
        else await Hearing.create(eventData);
      }
      setShowEventForm(false);
      setSelectedEvent(null);
      loadCalendarData();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleEventDelete = async (event) => {
    try {
      if (event.type === 'task') {
        await Task.delete(event.id);
      } else { // type is 'hearing'
        await Hearing.delete(event.id);
      }
      setShowEventForm(false);
      setSelectedEvent(null);
      loadCalendarData();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const getWeekEvents = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= weekStart && eventDate <= weekEnd;
    });
  };

  const getUpcomingTasks = () => {
    const now = new Date();
    return tasks
      .filter(task => task.status === 'pending' && new Date(task.due_date) >= now)
      .slice(0, 10);
  };

  const getUpcomingHearings = () => {
    const now = new Date();
    return hearings
      .filter(hearing => hearing.status === 'scheduled' && new Date(hearing.hearing_date) >= now)
      .slice(0, 10);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-7 gap-4">
              {Array(7).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <CalendarIcon className="w-8 h-8 text-amber-600" />
              Legal Calendar
            </h1>
            <p className="text-slate-600 mt-1">
              Manage hearings, deadlines, and important dates
            </p>
          </div>
          <Button
            onClick={handleCreateEvent}
            className="bg-slate-800 hover:bg-slate-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>

        {showEventForm && (
          <EventForm
            event={selectedEvent}
            cases={cases}
            onSave={handleEventSave}
            onCancel={() => {
              setShowEventForm(false);
              setSelectedEvent(null);
            }}
            onDelete={handleEventDelete}
          />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Tasks ({getUpcomingTasks().length})
            </TabsTrigger>
            <TabsTrigger value="hearings" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Hearings ({getUpcomingHearings().length})
            </TabsTrigger>
            <TabsTrigger value="deadlines" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Deadlines
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <CalendarView
              currentDate={currentDate}
              events={events}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onWeekChange={handleWeekChange}
              onDateClick={handleDateClick}
              onEventClick={(event) => {
                setSelectedEvent(event);
                setShowEventForm(true);
              }}
            />
          </TabsContent>

          <TabsContent value="tasks">
            <TaskList
              tasks={getUpcomingTasks()}
              onTaskUpdate={loadCalendarData}
            />
          </TabsContent>

          <TabsContent value="hearings">
            <HearingList
              hearings={getUpcomingHearings()}
              onHearingUpdate={loadCalendarData}
            />
          </TabsContent>

          <TabsContent value="deadlines">
            <Card className="shadow-lg border-0">
              <CardContent className="p-12 text-center">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Deadline Tracking</h3>
                <p className="text-slate-500">Advanced deadline management coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}