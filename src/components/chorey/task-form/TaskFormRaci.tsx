'use client';

import type { User } from '@/lib/types';
import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Mail, MessageSquare, User as UserIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { Checkbox } from '@/components/ui/checkbox';

type TaskFormRaciProps = {
  users: User[];
};

export function TaskFormRaci({ users }: TaskFormRaciProps) {
  const form = useFormContext();
  const status = form.watch('status');

  return (
    <div className="space-y-4">
      {status === 'In Review' && (
           <FormField
              control={form.control}
              name="reviewerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reviewer</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)} value={field.value || 'none'}>
                    <FormControl>
                      <SelectTrigger>
                        <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Selecteer een reviewer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Geen reviewer</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="consultedUserIds"
          render={({ field }) => (
              <FormItem className="flex flex-col">
              <div className="flex items-center">
                <FormLabel>Raadplegen (Consulted)</FormLabel>
                <HelpTooltip content="Personen die input moeten leveren. Communicatie is tweerichtingsverkeer." />
              </div>
              <Popover>
                  <PopoverTrigger asChild>
                  <FormControl>
                      <Button variant="outline" role="combobox" className={cn("w-full justify-start", !field.value?.length && "text-muted-foreground")}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {field.value?.length > 0 ? `${field.value.length} gebruiker(s)` : 'Selecteer gebruikers'}
                      </Button>
                  </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                      <CommandInput placeholder="Zoek gebruiker..." />
                      <CommandList>
                      <CommandEmpty>Geen gebruiker gevonden.</CommandEmpty>
                      <CommandGroup>
                          {(users || []).map((user) => {
                          const isSelected = field.value?.includes(user.id);
                          return (
                              <CommandItem
                              key={user.id}
                              onSelect={() => {
                                  if (isSelected) {
                                  field.onChange(field.value?.filter((id) => id !== user.id));
                                  } else {
                                  field.onChange([...(field.value || []), user.id]);
                                  }
                              }}
                              >
                              <Checkbox checked={isSelected} className="mr-2" />
                              {user.name}
                              </CommandItem>
                          );
                          })}
                      </CommandGroup>
                      </CommandList>
                  </Command>
                  </PopoverContent>
              </Popover>
              <FormMessage />
              </FormItem>
          )}
          />
          <FormField
          control={form.control}
          name="informedUserIds"
          render={({ field }) => (
              <FormItem className="flex flex-col">
              <div className="flex items-center">
                <FormLabel>Informeren (Informed)</FormLabel>
                <HelpTooltip content="Personen die op de hoogte worden gehouden van de voortgang. Communicatie is eenrichtingsverkeer." />
              </div>
              <Popover>
                  <PopoverTrigger asChild>
                  <FormControl>
                      <Button variant="outline" role="combobox" className={cn("w-full justify-start", !field.value?.length && "text-muted-foreground")}>
                      <Mail className="mr-2 h-4 w-4" />
                      {field.value?.length > 0 ? `${field.value.length} gebruiker(s)` : 'Selecteer gebruikers'}
                      </Button>
                  </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                      <CommandInput placeholder="Zoek gebruiker..." />
                      <CommandList>
                      <CommandEmpty>Geen gebruiker gevonden.</CommandEmpty>
                      <CommandGroup>
                          {(users || []).map((user) => {
                          const isSelected = field.value?.includes(user.id);
                          return (
                              <CommandItem
                              key={user.id}
                              onSelect={() => {
                                  if (isSelected) {
                                  field.onChange(field.value?.filter((id) => id !== user.id));
                                  } else {
                                  field.onChange([...(field.value || []), user.id]);
                                  }
                              }}
                              >
                              <Checkbox checked={isSelected} className="mr-2" />
                              {user.name}
                              </CommandItem>
                          );
                          })}
                      </CommandGroup>
                      </CommandList>
                  </Command>
                  </PopoverContent>
              </Popover>
              <FormMessage />
              </FormItem>
          )}
        />
      </div>
    </div>
  );
}
