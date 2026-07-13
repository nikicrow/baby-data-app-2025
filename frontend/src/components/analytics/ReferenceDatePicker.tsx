import { useState } from 'react';
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CalendarDays, Baby, RotateCcw } from "lucide-react";
import { format, parseISO, differenceInCalendarDays, addDays, startOfDay, isToday } from "date-fns";

interface ReferenceDatePickerProps {
  /** The date the insights are anchored to ("as of" date). */
  referenceDate: Date;
  onChange: (date: Date) => void;
  /** Baby's date of birth (ISO date string) — used to convert age <-> date. */
  dateOfBirth: string;
  babyName?: string;
}

/**
 * Lets the user view insights as of a past date, either by picking a calendar
 * date or by entering the baby's age. All the analytics windows ("today",
 * "last 7 days", etc.) are computed relative to the chosen reference date.
 */
export function ReferenceDatePicker({
  referenceDate,
  onChange,
  dateOfBirth,
  babyName,
}: ReferenceDatePickerProps) {
  const [mode, setMode] = useState<'date' | 'age'>('date');

  const dob = startOfDay(parseISO(dateOfBirth));
  const today = startOfDay(new Date());

  // Keep any chosen day within [date of birth, today] — there's no future data.
  const clamp = (d: Date) => {
    const day = startOfDay(d);
    if (day.getTime() < dob.getTime()) return dob;
    if (day.getTime() > today.getTime()) return today;
    return day;
  };

  const ageDays = Math.max(0, differenceInCalendarDays(referenceDate, dob));
  const ageWeeks = Math.floor(ageDays / 7);
  const ageRemDays = ageDays % 7;
  const ageLabel = ageWeeks > 0 ? `${ageWeeks}w ${ageRemDays}d` : `${ageDays}d`;

  const viewingToday = isToday(referenceDate);

  const handleDateInput = (value: string) => {
    if (!value) return;
    const parsed = parseISO(value);
    if (isNaN(parsed.getTime())) return;
    onChange(clamp(parsed));
  };

  const handleAgeInput = (weeks: number, days: number) => {
    const totalDays = Math.max(0, weeks * 7 + days);
    onChange(clamp(addDays(dob, totalDays)));
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Viewing insights</span>
          </div>
          <div className="flex items-center gap-1 rounded-md bg-muted p-1">
            <Button
              type="button"
              size="sm"
              variant={mode === 'date' ? 'default' : 'ghost'}
              onClick={() => setMode('date')}
              className="h-8"
            >
              By date
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === 'age' ? 'default' : 'ghost'}
              onClick={() => setMode('age')}
              className="h-8"
            >
              By age
            </Button>
          </div>
        </div>

        {mode === 'date' ? (
          <Input
            type="date"
            aria-label="Reference date"
            value={format(referenceDate, 'yyyy-MM-dd')}
            min={format(dob, 'yyyy-MM-dd')}
            max={format(today, 'yyyy-MM-dd')}
            onChange={(e) => handleDateInput(e.target.value)}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Weeks</label>
              <Input
                type="number"
                min={0}
                aria-label="Age in weeks"
                value={ageWeeks}
                onChange={(e) => handleAgeInput(Number(e.target.value), ageRemDays)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Days</label>
              <Input
                type="number"
                min={0}
                max={6}
                aria-label="Age in extra days"
                value={ageRemDays}
                onChange={(e) => handleAgeInput(ageWeeks, Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Baby className="w-3 h-3" />
            <span>
              {viewingToday ? 'Today' : format(referenceDate, 'EEE, d MMM yyyy')}
              {' · '}
              {babyName ? `${babyName} at ` : 'Age '}
              {ageLabel}
            </span>
          </div>
          {!viewingToday && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onChange(new Date())}
              className="h-8"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Today
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
