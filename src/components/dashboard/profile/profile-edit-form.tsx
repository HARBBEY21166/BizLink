
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { User } from '@/types';
// import { useToast } from '@/hooks/use-toast'; // Toast is handled by parent page
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ProfileEditFormProps {
  user: User;
  onSave: (updatedUser: Partial<User>) => Promise<void>;
}

// Schemas need to align with what the backend PUT /api/users/profile expects
const commonSchema = {
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).optional(),
  bio: z.string().max(500, { message: 'Bio cannot exceed 500 characters.' }).optional().or(z.literal('')),
  avatarUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
};

const entrepreneurSchema = z.object({
  ...commonSchema,
  role: z.literal('entrepreneur').optional(), // Role shouldn't be editable here
  startupDescription: z.string().max(500, { message: 'Startup description cannot exceed 500 characters.' }).optional().or(z.literal('')),
  fundingNeed: z.string().max(100, { message: 'Funding need cannot exceed 100 characters.' }).optional().or(z.literal('')),
  pitchDeckUrl: z.string().url({message: "Please enter a valid URL for your pitch deck."}).optional().or(z.literal('')),
});

const investorSchema = z.object({
  ...commonSchema,
  role: z.literal('investor').optional(), // Role shouldn't be editable here
  investmentInterests: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()).filter(Boolean) : undefined),
  portfolioCompanies: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()).filter(Boolean) : undefined),
});


export default function ProfileEditForm({ user, onSave }: ProfileEditFormProps) {
  // const { toast } = useToast(); // Parent handles toast
  const [isSaving, setIsSaving] = useState(false);
  
  const currentSchema = user.role === 'entrepreneur' ? entrepreneurSchema : investorSchema;

  const form = useForm<z.infer<typeof currentSchema>>({
    resolver: zodResolver(currentSchema),
    // Default values should be set once, typically not in useEffect for controlled forms unless user prop changes identity
  });

  // Effect to reset form when user prop changes (e.g., after successful save and re-fetch)
  useEffect(() => {
    form.reset({
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
    });
  }, [user, form]);


  async function onSubmit(values: z.infer<typeof currentSchema>) {
    setIsSaving(true);
    // Remove 'role' if it exists in values, as it's not meant to be updated here
    const { role, ...updateData } = values;

    try {
      await onSave(updateData as Partial<User>);
      // Toast is handled by parent page
    } catch (error) {
      // Error handling/toast also by parent
      console.error("Profile save from form failed:", error);
    } finally {
      setIsSaving(false);
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
              <FormDescription>Link to your profile picture (e.g., from a service like Imgur or a public URL).</FormDescription>
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
                  <FormDescription>Link to your pitch deck (e.g., Google Drive, Dropbox, DocSend).</FormDescription>
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
        
        <Button type="submit" className="font-semibold" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
