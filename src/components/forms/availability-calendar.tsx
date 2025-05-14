"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Clock, Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type TimeSlot = {
  startTime: string;
  endTime: string;
};

type AvailabilityCalendarProps = {
  value: Record<string, TimeSlot[]>;
  onChange: (value: Record<string, TimeSlot[]>) => void;
};

const timeSlots = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
  "20:00", "21:00", "22:00", "23:00", "00:00"
] as const;

export function AvailabilityCalendar({ value = {}, onChange }: AvailabilityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Ensure value is always an object
  useEffect(() => {
    if (!value || typeof value !== 'object') {
      onChange({});
    }
  }, [value, onChange]);

  const addTimeSlot = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const existingSlots = value[dateStr] || [];

    onChange({
      ...value,
      [dateStr]: [...existingSlots, { startTime: "09:00", endTime: "17:00" }]
    });
  };

  const removeTimeSlot = (date: string, slotIndex: number) => {
    const existingSlots = value[date] || [];
    const updatedSlots = existingSlots.filter((_, index) => index !== slotIndex);

    if (updatedSlots.length === 0) {
      const { [date]: _, ...rest } = value;
      onChange(rest);
    } else {
      onChange({
        ...value,
        [date]: updatedSlots
      });
    }
  };

  const updateTimeSlot = (date: string, slotIndex: number, field: "startTime" | "endTime", newValue: string) => {
    const existingSlots = value[date] || [];
    const updatedSlots = existingSlots.map((slot, index) => 
      index === slotIndex ? { ...slot, [field]: newValue } : slot
    );

    onChange({
      ...value,
      [date]: updatedSlots
    });
  };

  const selectedDayAvailability = selectedDate 
    ? value[format(selectedDate, "yyyy-MM-dd")] || []
    : [];

  const sortedDates = Object.keys(value).sort((a, b) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="lg:sticky lg:top-4">
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Select Date</CardTitle>
            <CardDescription>Choose a date to set your availability</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="rounded-lg border bg-card p-3 shadow-sm">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="w-full"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                  day_range_end: "day-range-end",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
                modifiers={{
                  available: (date) => Object.keys(value).includes(format(date, "yyyy-MM-dd"))
                }}
                modifiersStyles={{
                  available: {
                    backgroundColor: "hsl(var(--primary))",
                    color: "hsl(var(--primary-foreground))",
                  }
                }}
              />
            </div>
            {selectedDate && (
              <Button
                onClick={() => addTimeSlot(selectedDate)}
                className="w-full mt-4"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Time Slot
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-lg">
              {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
            </CardTitle>
            <CardDescription>
              {selectedDayAvailability.length > 0 
                ? `${selectedDayAvailability.length} time slot${selectedDayAvailability.length > 1 ? 's' : ''} set`
                : "No time slots added for this date"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              {selectedDayAvailability.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p>No time slots added for this date</p>
                  <p className="text-sm">Click "Add Time Slot" to set your availability</p>
                </div>
              ) : (
                selectedDayAvailability.map((slot, index) => (
                  <div 
                    key={index} 
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Select
                          value={slot.startTime}
                          onValueChange={(value) => updateTimeSlot(format(selectedDate!, "yyyy-MM-dd"), index, "startTime", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select start time" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeSlots.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Select
                          value={slot.endTime}
                          onValueChange={(value) => updateTimeSlot(format(selectedDate!, "yyyy-MM-dd"), index, "endTime", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select end time" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeSlots.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTimeSlot(format(selectedDate!, "yyyy-MM-dd"), index)}
                      className="shrink-0 hover:bg-destructive/10 hover:text-destructive self-end sm:self-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Availability Summary
          </CardTitle>
          <CardDescription>
            {sortedDates.length} date{sortedDates.length > 1 ? 's' : ''} with availability set
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-6">
              {sortedDates.map((date) => (
                <div key={date} className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="font-medium text-base sm:text-lg">
                      {format(parseISO(date), "EEEE, MMMM d, yyyy")}
                    </h3>
                    <Badge variant="secondary">
                      {value[date].length} slot{value[date].length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {value[date].map((slot, index) => (
                      <Badge 
                        key={index}
                        variant="secondary"
                        className="px-3 py-1 text-sm"
                      >
                        {slot.startTime} - {slot.endTime}
                      </Badge>
                    ))}
                  </div>
                  <Separator className="my-4" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
} 