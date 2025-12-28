'use client';

import React, { useEffect, useRef, useState } from 'react';

type Props = {
  value: string; // expected "HH:MM"
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
};

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function buildTimes(stepMinutes = 15) {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      times.push(`${pad(h)}:${pad(m)}`);
    }
  }
  return times;
}

export default function TimePicker({ value, onChange, placeholder, className }: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(value || '');
  const ref = useRef<HTMLDivElement | null>(null);
  const times = buildTimes(15);

  useEffect(() => setSelected(value || ''), [value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const visible = filter.trim()
    ? times.filter((t) => t.includes(filter.replace(/[^0-9:]/g, '')))
    : times;

  function apply(v: string) {
    setSelected(v);
    onChange(v);
    setOpen(false);
  }

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      <input
        className="input-field"
        value={selected}
        placeholder={placeholder || 'hh:mm'}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          const raw = e.target.value;
          setSelected(raw);
          setFilter(raw);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const first = visible[0];
            if (first) apply(first);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
        aria-haspopup="listbox"
      />

      {open && (
        <div className="timepicker-dropdown card absolute z-50 mt-2 w-full max-h-56 overflow-auto p-2">
          {visible.length === 0 && (
            <div className="text-xs text-neutral-500 p-2">No matches</div>
          )}
          {visible.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => apply(t)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-neutral-100 ${t === selected ? 'bg-primary-50 text-primary-700' : 'text-neutral-800'}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
