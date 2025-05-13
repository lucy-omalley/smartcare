"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

type AgeGroup = {
  minAge: number;
  maxAge: number;
  capacity: number;
};

type CrecheCapacityProps = {
  value: AgeGroup[];
  onChange: (value: AgeGroup[]) => void;
};

export function CrecheCapacity({ value, onChange }: CrecheCapacityProps) {
  const addAgeGroup = () => {
    onChange([
      ...value,
      { minAge: 0, maxAge: 1, capacity: 0 }
    ]);
  };

  const removeAgeGroup = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateAgeGroup = (index: number, field: keyof AgeGroup, newValue: number) => {
    onChange(value.map((group, i) => 
      i === index ? { ...group, [field]: newValue } : group
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Age Groups & Capacity</h3>
        <Button
          onClick={addAgeGroup}
          variant="outline"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Age Group
        </Button>
      </div>

      <div className="space-y-4">
        {value.map((group, index) => (
          <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="flex-1 grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Min Age (months)</Label>
                <Input
                  type="number"
                  min="0"
                  value={group.minAge}
                  onChange={(e) => updateAgeGroup(index, "minAge", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Age (months)</Label>
                <Input
                  type="number"
                  min="0"
                  value={group.maxAge}
                  onChange={(e) => updateAgeGroup(index, "maxAge", parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  min="0"
                  value={group.capacity}
                  onChange={(e) => updateAgeGroup(index, "capacity", parseInt(e.target.value))}
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeAgeGroup(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
} 