'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { User, Role } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface ProfileEditFormProps {
  user: User;
  onSave: (updatedUser: Partial<User>) => Promise<void>;
}

const commonSchema = {
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  bio: z.string().max(500, { message: 'Bio cannot exceed 500 characters.' }).optional(),
  avatarUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
};

const entrepreneurSchema = z.object({
  ...commonSchema,
  role: z.literal('entrepreneur'),
  startupDescription: z.string().max(500, { message: 'Startup description cannot exceed 500 characters.' }).optional(),
  fundingNeed: z.string().max(100, { message: 'Funding need cannot exceed 100 characters.' }).optional(),
  pitchDeckUrl: z.string().url({message: "Please enter a valid URL for your pitch deck."}).optional().or(z.literal('')),
});

const investorSchema = z.object({
  ...commonSchema,
  role: z.literal('investor'),
  investmentInterests: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()).filter(Boolean) : []),
  portfolioCompanies: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()).filter(Boolean) : []),
});

const formSchema = z.union([entrepreneurSchema, investorSchema]);

export default function ProfileEditForm({ user, onSave }: ProfileEditFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const currentSchema = user.role === 'entrepreneur' ? entrepreneurSchema : investorSchema;

  const form = useForm<z.infer<typeof currentSchema>>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      role: user.role,
      name: user.name || '',
      bio: user.bio || '',
      avatarUrl: user.avatarUrl || '',
      ...(user.role === 'entrepreneur' ? {
        startupDescription: user.startupDescription || '',
        fundingNeed: user.fundingNeed || '',
        pitchDeckUrl: user.pitchDeckUrl || '',
      } : {}),
      ...(user.role === 'investor' ? {
        investmentInterests: user.investmentInterests?.join(', ') || '',
        portfolioCompanies: user.portfolioCompanies?.join(', ') || '',
      } : {}),
    },
  });

  async function onSubmit(values: z.infer<typeof currentSchema>) {
    setIsLoading(true);
    try {
      await onSave(values as Partial<User>); // Cast is okay due to discriminated union setup
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been saved successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not save profile changes. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="avatarUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avatar URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/avatar.png" {...field} />
              </FormControl>
              <FormDescription>Link to your profile picture.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea placeholder="Tell us about yourself..." className="min-h-[100px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {user.role === 'entrepreneur' && (
          <>
            <FormField
              control={form.control}
              name="startupDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Startup Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe your startup..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fundingNeed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funding Need</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., $500,000 Seed Round" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="pitchDeckUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pitch Deck URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/pitchdeck.pdf" {...field} />
                  </FormControl>
                  <FormDescription>Link to your pitch deck (e.g., Google Drive, Dropbox).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {user.role === 'investor' && (
          <>
            <FormField
              control={form.control}
              name="investmentInterests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Investment Interests</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., SaaS, Fintech, AI (comma-separated)" {...field} />
                  </FormControl>
                  <FormDescription>Separate interests with commas.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="portfolioCompanies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portfolio Companies</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Startup A, Company B (comma-separated)" {...field} />
                  </FormControl>
                  <FormDescription>List companies you've invested in, separated by commas.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        
        <Button type="submit" className="font-semibold" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
