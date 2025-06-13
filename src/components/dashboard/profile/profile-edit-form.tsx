
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
import { useToast } from '@/hooks/use-toast';

interface ProfileEditFormProps {
  user: User;
  onSave: (updatedUser: Partial<User>) => Promise<void>;
}

// Common schema parts, role is not editable via form
const commonSchemaBase = {
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).optional(),
  bio: z.string().max(500, { message: 'Bio cannot exceed 500 characters.' }).optional().or(z.literal('')),
  avatarFile: z.instanceof(File).optional(), // For handling file input
};

const entrepreneurSchema = z.object({
  ...commonSchemaBase,
  startupDescription: z.string().max(500, { message: 'Startup description cannot exceed 500 characters.' }).optional().or(z.literal('')),
  fundingNeed: z.string().max(100, { message: 'Funding need cannot exceed 100 characters.' }).optional().or(z.literal('')),
  pitchDeckUrl: z.string().url({message: "Please enter a valid URL for your pitch deck."}).optional().or(z.literal('')),
});

const investorSchema = z.object({
  ...commonSchemaBase,
  investmentInterests: z.string().optional().or(z.literal('')).transform(val => val ? val.split(',').map(s => s.trim()).filter(Boolean) : []),
  portfolioCompanies: z.string().optional().or(z.literal('')).transform(val => val ? val.split(',').map(s => s.trim()).filter(Boolean) : []),
});


export default function ProfileEditForm({ user, onSave }: ProfileEditFormProps) {
  const { toast } = useToast();
  const currentSchema = user.role === 'entrepreneur' ? entrepreneurSchema : investorSchema;
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const form = useForm<z.infer<typeof currentSchema>>({
    resolver: zodResolver(currentSchema),
    defaultValues: {}, // Will be set by useEffect
  });

  useEffect(() => {
    // Populate form with user data when user prop changes
    const defaultVals: Partial<User> & { investmentInterests?: string, portfolioCompanies?: string, avatarFile?: File } = {
      name: user.name || '',
      bio: user.bio || '',
      // avatarFile is not part of user data, so it's not set here from `user`
    };
    if (user.role === 'entrepreneur') {
      defaultVals.startupDescription = user.startupDescription || '';
      defaultVals.fundingNeed = user.fundingNeed || '';
      defaultVals.pitchDeckUrl = user.pitchDeckUrl || '';
    } else if (user.role === 'investor') {
      // For string input, join arrays
      defaultVals.investmentInterests = user.investmentInterests?.join(', ') || '';
      defaultVals.portfolioCompanies = user.portfolioCompanies?.join(', ') || '';
    }
    form.reset(defaultVals as any); // Type assertion for defaultValues
  }, [user, form]);

  useEffect(() => {
    const userToken = localStorage.getItem('bizlinkToken');
    if (userToken) {
      setToken(userToken);
    }
  }, []);

  const onSubmit = async (values: z.infer<typeof currentSchema>) => {
    if (!token) {
      toast({ variant: 'destructive', title: 'Error', description: 'Authentication token not available.' });
      return;
    }
    setIsLoading(true);
    let newAvatarUrl: string | undefined = user.avatarUrl; // Keep existing avatar by default

    try {
      // Step 1: Upload avatar if a new one is selected
      if (selectedFile) {
        const avatarFormData = new FormData();
        avatarFormData.append('avatar', selectedFile); // Key 'avatar' as expected by API

        const avatarResponse = await fetch('/api/users/avatar', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: avatarFormData,
        });

        if (!avatarResponse.ok) {
          const errorData = await avatarResponse.json().catch(() => ({ error: 'Failed to upload avatar.' }));
          throw new Error(errorData.error || `Avatar upload failed: ${avatarResponse.statusText}`);
        }
        const avatarResult = await avatarResponse.json();
        newAvatarUrl = avatarResult.avatarUrl;
      }

      // Step 2: Prepare profile data for the onSave prop (handleSaveProfile in parent)
      // `values` already contains form fields like name, bio, and role-specific ones.
      // Zod schema transformations (e.g., for interests, portfolio) have already been applied to `values`.
      const dataToSave: Partial<User> = {
        ...values, // Contains name, bio, role-specific fields (already correctly typed by Zod)
        avatarUrl: newAvatarUrl, // Add the new or existing avatar URL
      };
      
      // The `avatarFile` field from the form schema is not part of the User model.
      // It was only used to capture the file input.
      delete (dataToSave as any).avatarFile;


      await onSave(dataToSave); // This calls handleSaveProfile in ProfilePage

      setSelectedFile(null); // Clear selected file display after successful save
      // Form will be reset by parent component (ProfilePage) when user prop updates

    } catch (error) {
      // Error is caught by ProfilePage's handleSaveProfile, which shows a toast.
      // We re-throw it so the parent's catch block can handle it and update loading state.
      console.error('Error in ProfileEditForm onSubmit:', error);
      throw error; 
    } finally {
      setIsLoading(false);
    }
  };

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
          name="avatarFile" 
          render={({ field }) => ( // field.onChange will update react-hook-form's state for 'avatarFile'
            <FormItem className="flex flex-col">
              <FormLabel>Avatar</FormLabel>
              <FormControl>
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file); // For direct use in upload
                    field.onChange(file); // Update RHF state for validation if needed
                  }} 
                />
              </FormControl>
              {selectedFile && <FormDescription>New: {selectedFile.name}</FormDescription>}
              {!selectedFile && user.avatarUrl && <FormDescription>Current: <a href={user.avatarUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Image</a></FormDescription>}
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
                    {/* Input expects string, Zod schema handles string to array */}
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
                     {/* Input expects string, Zod schema handles string to array */}
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

    