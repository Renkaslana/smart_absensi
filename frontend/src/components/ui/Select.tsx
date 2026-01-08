import { Fragment, useRef, useState, useEffect } from 'react';
import { Listbox, Transition, Portal } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

type Option = {
  value: string;
  label: string;
};

interface SelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const Select = ({ options, value, onChange, placeholder, className }: SelectProps) => {
  const selected = options.find((o) => o.value === value) || null;
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; left: number; width: number } | null>(null);

  const updateRect = () => {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDropdownStyle({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
  };

  useEffect(() => {
    if (!dropdownStyle) return;
    const handle = () => updateRect();
    window.addEventListener('resize', handle);
    window.addEventListener('scroll', handle, true);
    return () => {
      window.removeEventListener('resize', handle);
      window.removeEventListener('scroll', handle, true);
    };
  }, [dropdownStyle]);

  return (
    <Listbox value={value} onChange={onChange} as="div" className={cn('relative', className)}>
      <div ref={buttonRef} onPointerDown={updateRect} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') updateRect(); }}>
        <Listbox.Button className="w-full flex items-center justify-between gap-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-primary-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500">
          <span
            className={cn(
              'truncate',
              !selected
                ? 'text-neutral-500 dark:text-neutral-300'
                : 'text-accent-600 dark:text-accent-400 font-semibold'
            )}
          >
            {selected ? selected.label : (placeholder ?? 'Pilih')}
          </span>
          <ChevronDown size={16} className="text-neutral-400 dark:text-neutral-300" />
        </Listbox.Button>
      </div>

      <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0" afterLeave={() => setDropdownStyle(null)}>
        <Portal>
          <Listbox.Options
            className="absolute mt-2 max-h-60 overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-700 py-1 text-sm shadow-2xl z-[9999]"
            style={{
              position: 'absolute',
              top: dropdownStyle ? dropdownStyle.top : undefined,
              left: dropdownStyle ? dropdownStyle.left : undefined,
              width: dropdownStyle ? dropdownStyle.width : undefined,
              backgroundColor: '#ffffff', // Force white background
              color: '#171717', // Force dark text
            }}
          >
          {options.map((opt, idx) => (
            <Listbox.Option
              key={`${opt.value ?? 'opt'}-${idx}`}
              value={opt.value}
              className={({ active, selected: isSelected }) =>
                cn(
                  'cursor-pointer px-4 py-2 flex items-center justify-between',
                  active ? 'bg-neutral-100 dark:bg-neutral-700' : '',
                  isSelected ? 'bg-accent-50 dark:bg-accent-900/20' : ''
                )
              }
              style={{ color: '#171717' }} // Force text color on option
            >
              {({ selected: isSelected }) => (
                <div className="flex items-center justify-between w-full" style={{ color: '#171717' }}>
                  <span 
                    style={{ 
                      color: isSelected ? '#0d9488' : '#171717', // Explicit colors
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    {opt.label}
                  </span>
                  {isSelected && <span style={{ color: '#0d9488' }}>✓</span>}
                </div>
              )}
            </Listbox.Option>
          ))}
        </Listbox.Options>
        </Portal>
      </Transition>
    </Listbox>
  );
};

export default Select;
