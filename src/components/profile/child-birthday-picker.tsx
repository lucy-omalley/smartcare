'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  birthdayPartsFromISO,
  childBirthdayDayOptions,
  childBirthdayMonthOptions,
  childBirthdayYearOptions,
  formatChildAgeFromBirthday,
  isoFromBirthdayParts,
} from '@/lib/child-age';

interface ChildBirthdayPickerProps {
  value: string | null;
  onChange: (iso: string | null) => void;
  idPrefix?: string;
}

export function ChildBirthdayPicker({ value, onChange, idPrefix = 'child-birthday' }: ChildBirthdayPickerProps) {
  const initial = birthdayPartsFromISO(value);
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [day, setDay] = useState(initial.day);

  useEffect(() => {
    const parts = birthdayPartsFromISO(value);
    setYear(parts.year);
    setMonth(parts.month);
    setDay(parts.day);
  }, [value]);

  const dayOptions = useMemo(() => childBirthdayDayOptions(year, month), [year, month]);
  const agePreview = useMemo(() => {
    const iso = isoFromBirthdayParts(year, month, day);
    return iso ? formatChildAgeFromBirthday(iso) : null;
  }, [year, month, day]);

  const lastEmitted = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (day && !dayOptions.includes(day)) {
      setDay('');
      return;
    }
    const iso = isoFromBirthdayParts(year, month, day);
    if (lastEmitted.current === iso) return;
    lastEmitted.current = iso;
    onChange(iso);
  }, [year, month, day, dayOptions, onChange]);

  const years = childBirthdayYearOptions();
  const months = childBirthdayMonthOptions();

  return (
    <div className="space-y-2">
      <Label className="text-xs">Date of birth</Label>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label htmlFor={`${idPrefix}-day`} className="sr-only">Day</Label>
          <Select value={day || undefined} onValueChange={setDay}>
            <SelectTrigger id={`${idPrefix}-day`} className="rounded-xl">
              <SelectValue placeholder="Day" />
            </SelectTrigger>
            <SelectContent>
              {dayOptions.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-month`} className="sr-only">Month</Label>
          <Select value={month || undefined} onValueChange={setMonth}>
            <SelectTrigger id={`${idPrefix}-month`} className="rounded-xl">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-year`} className="sr-only">Year</Label>
          <Select value={year || undefined} onValueChange={setYear}>
            <SelectTrigger id={`${idPrefix}-year`} className="rounded-xl">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {agePreview ? (
        <p className="text-xs text-muted-foreground">Currently {agePreview} old</p>
      ) : (
        <p className="text-xs text-muted-foreground">Age updates automatically as they grow.</p>
      )}
    </div>
  );
}
