'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TodayBottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function TodayBottomSheet({ open, title, onClose, children }: TodayBottomSheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative bg-background rounded-t-3xl shadow-xl max-h-[88vh] flex flex-col',
          'animate-in slide-in-from-bottom duration-300'
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <h2 className="font-semibold text-base pr-2">{title}</h2>
          <Button variant="ghost" size="icon" className="shrink-0 rounded-full" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="overflow-y-auto px-4 py-4 pb-8 flex-1">{children}</div>
      </div>
    </div>
  );
}
