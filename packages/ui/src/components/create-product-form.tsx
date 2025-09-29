'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@workspace/ui/components/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';

import { CreateProductSchema } from '@workspace/lib/dtos';

import { createProduct } from '@workspace/lib/server-actions/create-product';

export function CreateProductForm() {
  const form = useForm<z.infer<typeof CreateProductSchema>>({
    // resolver: zodResolver(CreateProductSchema),
    resolver: async (data, context, options) => {
      // you can debug your validation schema here
      // console.log('formData', data);
      const validation = await zodResolver(CreateProductSchema)(
        data,
        context,
        options
      );
      console.log('validation result', validation);
      return validation;
    },
    defaultValues: {
      name: '',
      url: '',
      description: 'Hello world',
    },
  });

  async function onSubmit(data: z.infer<typeof CreateProductSchema>) {
    console.log('data', data);
    await createProduct(data);

    toast('You submitted the following values', {
      description: (
        <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="Shopify" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Url</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com"
                  type="url"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This is the url of your product.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Create</Button>
      </form>
    </Form>
  );
}

export default CreateProductForm;
