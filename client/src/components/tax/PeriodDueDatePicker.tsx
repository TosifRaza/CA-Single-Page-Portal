import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

interface PeriodDueDatePickerProps {
  value: string;
  periodTo: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
  className?: string;
  ariaLabel: string;
}

const parseDate = (value: string): Date | undefined => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const toIsoDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const formatDate = (value: string): string => {
  const date = parseDate(value);
  return date
    ? `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`
    : '';
};

const getInitialMonth = (periodTo: string, value: string): Date => {
  const periodEnd = parseDate(periodTo);
  if (periodEnd) return new Date(periodEnd.getFullYear(), periodEnd.getMonth() + 1, 1);
  const selectedDate = parseDate(value);
  const initial = selectedDate || new Date();
  return new Date(initial.getFullYear(), initial.getMonth(), 1);
};

const getMinimumDate = (periodTo: string, min?: string): string | undefined => {
  if (min) return min;
  const periodEnd = parseDate(periodTo);
  if (!periodEnd) return undefined;
  return toIsoDate(new Date(periodEnd.getFullYear(), periodEnd.getMonth(), periodEnd.getDate() + 1));
};

export const PeriodDueDatePicker: React.FC<PeriodDueDatePickerProps> = ({
  value,
  periodTo,
  min,
  max,
  onChange,
  className = '',
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => getInitialMonth(periodTo, value));
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => {
    const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
    const gridStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1 - mondayOffset);
    return Array.from({ length: 42 }, (_, index) =>
      new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index)
    );
  }, [viewMonth]);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const popupWidth = 280;
      const popupHeight = 330;
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - popupWidth - 8));
      const top = rect.bottom + popupHeight + 8 <= window.innerHeight
        ? rect.bottom + 6
        : Math.max(8, rect.top - popupHeight - 6);
      setPosition({ top, left });
    };

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !calendarRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    updatePosition();
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  const openCalendar = () => {
    setViewMonth(getInitialMonth(periodTo, value));
    setIsOpen(true);
  };

  const changeMonth = (offset: number) => {
    setViewMonth((month) => new Date(month.getFullYear(), month.getMonth() + offset, 1));
  };

  const monthLabel = viewMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const selectedDate = parseDate(value);
  const minimum = getMinimumDate(periodTo, min);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? setIsOpen(false) : openCalendar())}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border border-light-border bg-white px-2 py-1.5 text-left text-xs text-light-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-dark-border dark:bg-dark-card dark:text-dark-textPrimary ${className}`}
      >
        <span className={value ? '' : 'text-light-textMuted dark:text-dark-textMuted'}>
          {formatDate(value) || 'dd-mm-yyyy'}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-light-textMuted dark:text-dark-textMuted" />
      </button>

      {isOpen && createPortal(
        <div
          ref={calendarRef}
          role="dialog"
          aria-label={`${ariaLabel} calendar`}
          className="fixed z-[100] w-[280px] rounded-xl border border-light-border bg-white p-3 shadow-xl dark:border-dark-border dark:bg-dark-card"
          style={position}
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => changeMonth(-1)}
              className="rounded-md p-1.5 text-light-textSecondary hover:bg-light-bg dark:text-dark-textSecondary dark:hover:bg-dark-cardSecondary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-semibold text-light-textPrimary dark:text-dark-textPrimary">
              {monthLabel}
            </div>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => changeMonth(1)}
              className="rounded-md p-1.5 text-light-textSecondary hover:bg-light-bg dark:text-dark-textSecondary dark:hover:bg-dark-cardSecondary"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-light-textMuted dark:text-dark-textMuted">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => <div key={day} className="py-1">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {days.map((day) => {
              const isoDate = toIsoDate(day);
              const isDisabled = Boolean((minimum && isoDate < minimum) || (max && isoDate > max));
              const isSelected = isoDate === value;
              const isInCurrentMonth = day.getMonth() === viewMonth.getMonth();
              return (
                <button
                  key={isoDate}
                  type="button"
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                  onClick={() => {
                    onChange(isoDate);
                    setIsOpen(false);
                  }}
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                    isSelected
                      ? 'bg-brand-600 font-semibold text-white'
                      : isInCurrentMonth
                        ? 'text-light-textPrimary hover:bg-brand-50 dark:text-dark-textPrimary dark:hover:bg-brand-500/15'
                        : 'text-light-textMuted hover:bg-light-bg dark:text-dark-textMuted dark:hover:bg-dark-cardSecondary'
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          {selectedDate && (
            <div className="mt-2 border-t border-light-border pt-2 text-right text-[11px] text-light-textMuted dark:border-dark-border dark:text-dark-textMuted">
              Selected: {formatDate(value)}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};
