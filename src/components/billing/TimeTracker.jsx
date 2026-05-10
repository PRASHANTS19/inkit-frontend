import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Play,
  Pause,
  Square,
  Plus,
  Timer,
  IndianRupee
} from "lucide-react";

export default function TimeTracker({ cases }) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [timeEntries, setTimeEntries] = useState([]);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [timerInterval, setTimerInterval] = useState(null);
  
  const [newEntry, setNewEntry] = useState({
    case_id: '',
    description: '',
    hours: 0,
    rate: 5000,
    date: new Date().toISOString().split('T')[0]
  });

  const startTimer = () => {
    setIsTracking(true);
    const interval = setInterval(() => {
      setCurrentTime(prev => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const pauseTimer = () => {
    setIsTracking(false);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  const stopTimer = () => {
    setIsTracking(false);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    
    if (currentTime > 0) {
      setShowAddEntry(true);
      setNewEntry(prev => ({
        ...prev,
        hours: parseFloat((currentTime / 3600).toFixed(2))
      }));
    }
    
    setCurrentTime(0);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddEntry = () => {
    const entry = {
      ...newEntry,
      id: Date.now(),
      amount: newEntry.hours * newEntry.rate
    };
    
    setTimeEntries(prev => [entry, ...prev]);
    setNewEntry({
      case_id: '',
      description: '',
      hours: 0,
      rate: 5000,
      date: new Date().toISOString().split('T')[0]
    });
    setShowAddEntry(false);
  };

  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const totalAmount = timeEntries.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="space-y-6">
      {/* Timer Card */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Timer className="w-6 h-6" />
            Time Tracker
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-6xl font-mono font-bold text-slate-900 mb-4">
              {formatTime(currentTime)}
            </div>
            
            <div className="flex justify-center gap-3">
              {!isTracking ? (
                <Button onClick={startTimer} className="bg-green-600 hover:bg-green-700">
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </Button>
              ) : (
                <Button onClick={pauseTimer} variant="outline">
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              )}
              
              <Button onClick={stopTimer} variant="outline">
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Time Entry Form */}
      {showAddEntry && (
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Add Time Entry</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Case</Label>
                <Select value={newEntry.case_id} onValueChange={(value) => setNewEntry(prev => ({ ...prev, case_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select case..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cases.map((case_item) => (
                      <SelectItem key={case_item.id} value={case_item.id}>
                        {case_item.case_number} - {case_item.client_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newEntry.description}
                onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What did you work on?"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hours</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newEntry.hours}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, hours: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Rate (₹/hour)</Label>
                <Input
                  type="number"
                  value={newEntry.rate}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddEntry(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddEntry}>
                Add Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Entry Button */}
      {!showAddEntry && (
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <Button onClick={() => setShowAddEntry(true)} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Manual Time Entry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Time Entries Summary */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Time Entries
            </CardTitle>
            <div className="text-right">
              <p className="text-sm text-slate-600">Total: {totalHours.toFixed(2)} hours</p>
              <p className="text-lg font-bold text-slate-900 flex items-center gap-1">
                <IndianRupee className="w-4 h-4" />
                {totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {timeEntries.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No time entries yet. Start tracking your time!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {timeEntries.map((entry) => (
                <div key={entry.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-slate-900">{entry.description}</h4>
                      <p className="text-sm text-slate-600">Case: {entry.case_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 flex items-center gap-1">
                        <IndianRupee className="w-4 h-4" />
                        {entry.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-600">{entry.hours}h × ₹{entry.rate}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>{entry.date}</span>
                    <Badge variant="outline">{entry.hours} hours</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}