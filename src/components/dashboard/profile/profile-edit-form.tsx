'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { User } from '@/types';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ProfileEditFormProps {
  user: User;
  onSave: (updatedUser: Partial<User>) => Promise<void>;
}

const commonSchema = {
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).optional(),
  bio: z.string().max(500, { message: 'Bio cannot exceed 500 characters.' }).optional().or(z.literal('')),
  avatarFile: z.instanceof(File).optional(),
};

const entrepreneurSchema = z.object({
  ...commonSchema,
  role: z.literal('entrepreneur').optional(),
  startupDescription: z.string().max(500, { message: 'Startup description cannot exceed 500 characters.' }).optional().or(z.literal('')),
  fundingNeed: z.string().max(100, { message: 'Funding need cannot exceed 100 characters.' }).optional().or(z.literal('')),
  pitchDeckUrl: z.string().url({message: "Please enter a valid URL for your pitch deck."}).optional().or(z.literal('')),
});

const investorSchema = z.object({
  ...commonSchema,
  role: z.literal('investor').optional(),
  investmentInterests: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()).filter(Boolean) : undefined),
  portfolioCompanies: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()).filter(Boolean) : undefined),
});

const combinedSchema = z.object({
  ...commonSchema,
  role: z.union([z.literal('entrepreneur'), z.literal('investor')]).optional(),
  startupDescription: z.string().max(500, { message: 'Startup description cannot exceed 500 characters.' }).optional().or(z.literal('')),
  fundingNeed: z.string().max(100, { message: 'Funding need cannot exceed 100 characters.' }).optional().or(z.literal('')),
  pitchDeckUrl: z.string().url({message: "Please enter a valid URL for your pitch deck."}).optional().or(z.literal('')),
  investmentInterests: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()).filter(Boolean) : undefined),
  portfolioCompanies: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()).filter(Boolean) : undefined),
});
export default function ProfileEditForm({ user, onSave }: ProfileEditFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const currentSchema = user.role === 'entrepreneur' ? entrepreneurSchema : investorSchema;

  const form = useForm<z.infer<typeof currentSchema>>({
 resolver: zodResolver(combinedSchema),
  } as any); // Use 'as any' to bypass the type error for now

  useEffect(() => {
    form.reset({
      name: user.name || '',
      bio: user.bio || '',
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

  const onSubmit = async (values: z.infer<typeof combinedSchema>) => {
    setIsLoading(true);
    try {
        const formData = new FormData();

        // Append other form data as needed (name, bio, etc.)
        formData.append('name', values.name || '');
        formData.append('bio', values.bio || '');
        
        // Append role-specific fields
        if (user.role === 'entrepreneur') {
          const entrepreneurValues = values as z.infer<typeof entrepreneurSchema>; // Type assertion
          formData.append('startupDescription', entrepreneurValues.startupDescription || '');
          formData.append('fundingNeed', entrepreneurValues.fundingNeed || '');
          formData.append('pitchDeckUrl', entrepreneurValues.pitchDeckUrl || '');
        } else {
          const investorValues = values as z.infer<typeof investorSchema>; // Type assertion
          formData.append( 
            'investmentInterests', 
            typeof investorValues.investmentInterests === 'string' 
              ? investorValues.investmentInterests 
              : investorValues.investmentInterests?.join(', ') || ''
          );
          formData.append(
            'portfolioCompanies', 
            typeof investorValues.portfolioCompanies === 'string' 
              ? investorValues.portfolioCompanies 
              : investorValues.portfolioCompanies?.join(', ') || ''
          );

        if (selectedFile) {
            formData.append('avatar', selectedFile);
        }

        const token = localStorage.getItem('bizlinkToken');

        if (!token) {
            console.error('JWT not found in localStorage.');
            setIsLoading(false);
            return;
        }

        const response = await fetch('/api/users/avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Avatar upload failed.');
        }

        const result = await response.json();
        console.log('Avatar uploaded successfully:', result.avatarUrl);

        // Update local user state if needed
        await onSave({
          ...values,
          avatarUrl: result.avatarUrl
        });

    }
    } catch (error) {
        console.error('Error uploading avatar:', error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* ... rest of your form fields remain unchanged ... */}
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
          // The name 'avatarUrl' is kept for form state consistency,
          // but the input type is file and the handling is different. 
          // We use a separate state for the file itself.
          control={form.control}
          // We are not binding value directly for file inputs
          name="avatarFile" // Use 'avatarFile' as the field name
          render={({ field }) => (
            <FormItem className="flex flex-col"> {/* Use flex-col for stacked label and input */}
              <FormLabel>Avatar</FormLabel>
              <FormControl>
                 {/* We are not binding value directly for file inputs */}
                <Input type="file" accept="image/*" onChange={(e) => { setSelectedFile(e.target.files?.[0] || null); field.onChange(e.target.files?.[0]); }} />
              </FormControl>
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
        {/* ... other form fields ... */}
        <Button type="submit" className="font-semibold" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
