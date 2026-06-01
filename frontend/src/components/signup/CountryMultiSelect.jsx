'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { COUNTRIES, REGION_PRESETS } from '@/lib/countries';

/**
 * Searchable multi-select for geographic targeting.
 *
 * Replaces the old flat 9-badge picker. Supports:
 *  - type-to-search across the full country list
 *  - one-click region presets (GCC, MENA, South Asia, …) that union into
 *    the current selection
 *  - removable chips for what's currently selected
 *
 * Value contract is unchanged: `value` is an array of country label strings,
 * `onChange` receives the new array. `target_countries` downstream is
 * untouched.
 */
export default function CountryMultiSelect({ value = [], onChange }) {
  const [open, setOpen] = useState(false);

  const selected = Array.isArray(value) ? value : [];

  const toggle = (country) => {
    if (selected.includes(country)) {
      onChange(selected.filter((c) => c !== country));
    } else {
      onChange([...selected, country]);
    }
  };

  const applyPreset = (preset) => {
    // Union the preset's countries into the current selection
    const merged = Array.from(new Set([...selected, ...preset.countries]));
    onChange(merged);
  };

  const clearAll = () => onChange([]);

  return (
    <div className="space-y-3">
      {/* Region preset chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">Quick add:</span>
        {REGION_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyPreset(preset)}
            className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
          >
            + {preset.label}
          </button>
        ))}
      </div>

      {/* Searchable popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-12 font-normal"
            />
          }
        >
          <span className="text-gray-600">
            {selected.length === 0
              ? 'Search and select countries…'
              : `${selected.length} ${selected.length === 1 ? 'country' : 'countries'} selected`}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[--anchor-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search countries…" />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {COUNTRIES.map((country) => {
                  const isSelected = selected.includes(country);
                  return (
                    <CommandItem
                      key={country}
                      value={country}
                      onSelect={() => toggle(country)}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          isSelected ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                      {country}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((country) => (
            <Badge
              key={country}
              variant="secondary"
              className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 pl-3 pr-1.5 py-1"
            >
              {country}
              <button
                type="button"
                onClick={() => toggle(country)}
                className="ml-1 rounded-full hover:bg-indigo-200 p-0.5"
                aria-label={`Remove ${country}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-gray-500 hover:text-gray-700 underline px-2"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
