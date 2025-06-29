'use client';

import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Repeat } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { HelpTooltip } from '@/components/ui/help-tooltip';

export function TaskFormScheduling() {
    const { control, setValue, watch } = useFormContext();

    const recurring = watch('recurring');
    const recurringFrequency = recurring?.frequency;
    const monthlyRecurringType = recurring?.monthly?.type;

    return (
        <div className="space-y-4">
            <FormField
                control={control}
                name="dueDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Einddatum</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                            {field.value ? format(field.value, 'PPP') : <span>Kies een datum</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
            />
            
            <FormField
              control={control}
              name="recurring"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel>Herhaling</FormLabel>
                    <HelpTooltip content="Stel in of deze taak automatisch opnieuw moet worden aangemaakt na voltooiing, en met welke frequentie." />
                  </div>
                  <Select
                    onValueChange={(value) => {
                      if (value === 'none') {
                        field.onChange(undefined);
                      } else if (value === 'monthly') {
                        field.onChange({ 
                          frequency: 'monthly',
                          monthly: { type: 'day_of_month', day: 1 }
                        });
                      } else {
                        field.onChange({ frequency: value as 'daily' | 'weekly' });
                      }
                    }}
                    value={field.value?.frequency || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <Repeat className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Niet herhalend" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Niet herhalend</SelectItem>
                      <SelectItem value="daily">Dagelijks</SelectItem>
                      <SelectItem value="weekly">Wekelijks</SelectItem>
                      <SelectItem value="monthly">Maandelijks</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {recurringFrequency === 'monthly' && (
              <div className="pl-4 border-l-2 ml-2 space-y-4 pt-4 mt-4">
                <FormField
                  control={control}
                  name="recurring.monthly.type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Herhaal maandelijks op:</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value: "day_of_month" | "day_of_week") => {
                            if (value === 'day_of_month') {
                              setValue('recurring.monthly', { type: 'day_of_month', day: 1 });
                            } else {
                              setValue('recurring.monthly', { type: 'day_of_week', week: 'first', weekday: 1 });
                            }
                          }}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="day_of_month" />
                            </FormControl>
                            <FormLabel className="font-normal">Dag van de maand</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="day_of_week" />
                            </FormControl>
                            <FormLabel className="font-normal">Dag van de week</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {monthlyRecurringType === 'day_of_month' && (
                  <FormField
                    control={control}
                    name="recurring.monthly.day"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dag</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="31" {...field} onChange={e => field.onChange(e.target.value ? +e.target.value : 1)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {monthlyRecurringType === 'day_of_week' && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={control}
                      name="recurring.monthly.week"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Week</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="first">Eerste</SelectItem>
                              <SelectItem value="second">Tweede</SelectItem>
                              <SelectItem value="third">Derde</SelectItem>
                              <SelectItem value="fourth">Vierde</SelectItem>
                              <SelectItem value="last">Laatste</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="recurring.monthly.weekday"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weekdag</FormLabel>
                          <Select onValueChange={value => field.onChange(parseInt(value))} value={String(field.value)}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="1">Maandag</SelectItem>
                              <SelectItem value="2">Dinsdag</SelectItem>
                              <SelectItem value="3">Woensdag</SelectItem>
                              <SelectItem value="4">Donderdag</SelectItem>
                              <SelectItem value="5">Vrijdag</SelectItem>
                              <SelectItem value="6">Zaterdag</SelectItem>
                              <SelectItem value="0">Zondag</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            )}
        </div>
    );
}