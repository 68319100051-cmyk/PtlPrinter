import React, { useState, useEffect, useRef } from 'react';

export const RAM_SHORTCUTS = [4, 8, 16, 32, 64] as const;

export interface RamPickerProps {
  value: number | null;
  onChange: (gb: number | null) => void;
  hasError?: boolean;
  accent?: 'amber' | 'indigo' | 'slate';
}

const isPresetRam = (val: number | null): val is number =>
  val !== null && (RAM_SHORTCUTS as readonly number[]).includes(val);

export const RamPicker: React.FC<RamPickerProps> = ({
  value,
  onChange,
  hasError = false,
  accent = 'amber',
}) => {
  const [isCustomMode, setIsCustomMode] = useState<boolean>(
    () => value !== null && !isPresetRam(value)
  );
  const [customInput, setCustomInput] = useState<string>(() =>
    value !== null && !isPresetRam(value) ? String(value) : ''
  );
  const [customInvalid, setCustomInvalid] = useState<boolean>(false);
  const prevValueRef = useRef<number | null>(value);

  useEffect(() => {
    if (value !== null) {
      if (isPresetRam(value)) {
        setIsCustomMode(false);
        setCustomInput('');
        setCustomInvalid(false);
      } else {
        setIsCustomMode(true);
        setCustomInput(String(value));
        setCustomInvalid(false);
      }
    } else if (prevValueRef.current !== null) {
      setIsCustomMode(false);
      setCustomInput('');
      setCustomInvalid(false);
    }
    prevValueRef.current = value;
  }, [value]);

  const accentClasses =
    accent === 'indigo'
      ? {
          active: 'bg-indigo-600 text-white shadow-xs border border-indigo-600',
          inactive:
            'bg-white border border-indigo-200 text-slate-700 hover:bg-indigo-100/60',
          input: 'border-indigo-300 focus:ring-indigo-500',
        }
      : accent === 'slate'
      ? {
          active: 'bg-slate-900 text-amber-400 ring-2 ring-amber-400 shadow-xs border border-slate-900',
          inactive:
            'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100',
          input: 'border-slate-300 focus:ring-amber-500',
        }
      : {
          active: 'bg-amber-500 text-white shadow-xs border border-amber-500',
          inactive:
            'bg-white border border-amber-200 text-slate-700 hover:bg-amber-100/60',
          input: 'border-amber-300 focus:ring-amber-500',
        };

  const handleShortcutClick = (preset: number) => {
    if (!isCustomMode && value === preset) {
      setIsCustomMode(false);
      setCustomInput('');
      setCustomInvalid(false);
      onChange(null);
      return;
    }
    setIsCustomMode(false);
    setCustomInput('');
    setCustomInvalid(false);
    onChange(preset);
  };

  const handleCustomToggle = () => {
    if (isCustomMode) {
      setIsCustomMode(false);
      setCustomInput('');
      setCustomInvalid(false);
      onChange(null);
      return;
    }
    setIsCustomMode(true);
    setCustomInvalid(false);
    if (value !== null && !isPresetRam(value)) {
      setCustomInput(String(value));
    } else {
      setCustomInput('');
      if (value !== null) {
        onChange(null);
      }
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setCustomInput(raw);

    const trimmed = raw.trim();
    if (trimmed === '') {
      setCustomInvalid(false);
      onChange(null);
      return;
    }

    const num = Number(trimmed);
    if (!/^\d+$/.test(trimmed) || !Number.isInteger(num) || num < 1 || num > 1024) {
      setCustomInvalid(true);
      return;
    }

    setCustomInvalid(false);
    onChange(num);
  };

  return (
    <div className="space-y-1.5">
      <div
        className={`flex flex-wrap gap-1.5 p-0.5 rounded-lg ${
          hasError ? 'border border-rose-500 bg-rose-50/50' : ''
        }`}
      >
        {RAM_SHORTCUTS.map((r) => {
          const isSelected = !isCustomMode && value === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => handleShortcutClick(r)}
              className={`min-w-[44px] flex-1 py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ${
                isSelected ? accentClasses.active : accentClasses.inactive
              }`}
            >
              {r}G
            </button>
          );
        })}
        <button
          type="button"
          onClick={handleCustomToggle}
          className={`min-w-[58px] flex-1 py-1.5 px-2.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ${
            isCustomMode ? accentClasses.active : accentClasses.inactive
          }`}
        >
          อื่น ๆ
        </button>
      </div>

      {isCustomMode && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={1024}
              step={1}
              autoComplete="off"
              value={customInput}
              onChange={handleCustomInputChange}
              placeholder="ระบุ GB เช่น 24"
              className={`w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 ${
                customInvalid
                  ? 'border-rose-500 ring-1 ring-rose-500 focus:ring-rose-500'
                  : accentClasses.input
              }`}
            />
            <span className="text-xs font-mono font-bold text-slate-700 shrink-0 px-1.5">
              GB
            </span>
          </div>
          {customInvalid && (
            <p className="text-[10px] text-rose-600 font-medium">
              กรุณาระบุจำนวนเต็มตั้งแต่ 1 ถึง 1024 GB
            </p>
          )}
        </div>
      )}
    </div>
  );
};
