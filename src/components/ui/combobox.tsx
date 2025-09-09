
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
    options: { value: string; label: string, group?: string }[];
    value?: string;
    onSelect: (value: string, label?: string) => void;
    inputValue?: string;
    onInputChange?: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    notFoundMessage?: string;
    createMessage?: string;
    className?: string;
}

export function Combobox({ 
    options, 
    value, 
    onSelect,
    inputValue,
    onInputChange = () => {},
    placeholder = "Select an option...",
    searchPlaceholder = "Search...",
    notFoundMessage = "No option found.",
    createMessage,
    className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedLabel = options.find((option) => option.value === value)?.label || inputValue || '';

  const handleSelect = (selectedValue: string, label?: string) => {
    onSelect(selectedValue, label);
    setOpen(false);
  };
  
  const showCreateOption = createMessage && inputValue && !options.some(option => option.label.toLowerCase() === inputValue.toLowerCase());

  const groupedOptions = React.useMemo(() => {
    return options.reduce((acc, option) => {
        const group = option.group || 'Other';
        if (!acc[group]) {
            acc[group] = [];
        }
        acc[group].push(option);
        return acc;
    }, {} as Record<string, { value: string; label: string }[]>);
  }, [options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="truncate">{selectedLabel || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder}
            value={inputValue}
            onValueChange={onInputChange}
          />
          <CommandList>
            <CommandEmpty>
              {notFoundMessage}
            </CommandEmpty>
            {showCreateOption && (
                <CommandItem
                  onSelect={() => handleSelect(inputValue!, inputValue)}
                  value={inputValue}
                  className="cursor-pointer"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {createMessage} &quot;{inputValue}&quot;
                </CommandItem>
            )}
            {Object.entries(groupedOptions).map(([group, groupOptions]) => (
                <CommandGroup key={group} heading={group !== 'Other' ? group : undefined}>
                {groupOptions.map((option) => (
                    <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                        handleSelect(option.value, option.label);
                    }}
                    >
                    <Check
                        className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                        )}
                    />
                    {option.label}
                    </CommandItem>
                ))}
                </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
