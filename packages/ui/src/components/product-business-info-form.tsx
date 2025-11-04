'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { SearchableSelect } from '@workspace/ui/components/searchable-select';
import { countries } from '@workspace/ui/lib/countries';
import { languages } from '@workspace/ui/lib/languages';
import { UseFormReturn } from 'react-hook-form';

interface ProductBusinessInfoFormProps {
  form: UseFormReturn<any>;
}

export function ProductBusinessInfoForm({
  form,
}: ProductBusinessInfoFormProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Business name</FormLabel>
            <FormControl>
              <Input placeholder="SiteGPT" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex w-full gap-2">
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Language</FormLabel>
              <FormControl>
                <SearchableSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select language"
                  searchPlaceholder="Search languages..."
                  items={Object.entries(languages).map(([code, name]) => ({
                    value: code,
                    label: name,
                  }))}
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Country</FormLabel>
              <FormControl>
                <SearchableSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select country"
                  searchPlaceholder="Search countries..."
                  items={countries.map((country) => ({
                    value: country.code,
                    label: country.name,
                  }))}
                  className="w-full"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <textarea
                className="placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex min-h-[120px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe what your business does..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
