
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2, FileUp } from 'lucide-react';
import type { PitchAnalysis } from '@/types';

interface PitchUploadFormProps {
  onAnalysisComplete: (analysis: PitchAnalysis) => void;
  analyzePitchDeckAction: (input: { pitchDeckDataUri: string }) => Promise<PitchAnalysis>;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['application/pdf']; // Add more if needed, e.g., 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'

const formSchema = z.object({
  pitchDeck: z
    .custom<FileList>((val) => val instanceof FileList, "Required")
    .refine((files) => files.length > 0, `Required`)
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ALLOWED_FILE_TYPES.includes(files?.[0]?.type),
      ".pdf files are supported."
    ),
});

export default function PitchUploadForm({ onAnalysisComplete, analyzePitchDeckAction }: PitchUploadFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const fileRef = form.register("pitchDeck");

  const convertFileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setFileName(null);
    try {
      const file = values.pitchDeck[0];
      const pitchDeckDataUri = await convertFileToDataUri(file);
      
      const analysisResult = await analyzePitchDeckAction({ pitchDeckDataUri });
      onAnalysisComplete(analysisResult);
      toast({
        title: 'Analysis Complete',
        description: 'Your pitch deck has been analyzed.',
      });
      form.reset(); // Reset form after successful submission
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Could not analyze pitch deck. Ensure it is a valid PDF. ' + (error instanceof Error ? error.message : String(error)),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card p-6 rounded-lg shadow-md">
        <FormField
          control={form.control}
          name="pitchDeck"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">Upload Pitch Deck (PDF)</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type="file" 
                    accept=".pdf" 
                    {...fileRef}
                    className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    onChange={(e) => {
                      field.onChange(e.target.files);
                      if (e.target.files && e.target.files.length > 0) {
                        setFileName(e.target.files[0].name);
                      } else {
                        setFileName(null);
                      }
                    }}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Max file size: 5MB. Supported format: PDF.
                {fileName && <span className="block mt-1 text-sm text-muted-foreground">Selected: {fileName}</span>}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileUp className="mr-2 h-4 w-4" />
          )}
          Analyze Pitch Deck
        </Button>
      </form>
    </Form>
  );
}
