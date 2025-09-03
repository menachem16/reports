import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchableSelectProps {
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onValueChange,
  placeholder,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFilteredOptions(
      options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const handleOptionSelect = (option: string) => {
    onValueChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full bg-gradient-card backdrop-blur-sm border border-border rounded-lg px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 hover:shadow-glow group"
      >
        <span className={cn(
          "block truncate",
          value ? "text-foreground" : "text-muted-foreground"
        )}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:text-primary",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-gradient-card backdrop-blur-sm border border-border rounded-lg shadow-space animate-slide-up overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="חיפוש..."
                className="w-full bg-input border border-border rounded-md px-4 py-2 pr-10 text-right focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-center text-muted-foreground">
                לא נמצאו תוצאות
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleOptionSelect(option)}
                  className={cn(
                    "w-full px-4 py-3 text-right hover:bg-muted transition-colors duration-200",
                    value === option && "bg-primary text-primary-foreground"
                  )}
                >
                  {option}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};