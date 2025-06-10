'use client';

import PitchUploadForm from '@/components/dashboard/pitch-analyzer/pitch-upload-form';
import AnalysisDisplay from '@/components/dashboard/pitch-analyzer/analysis-display';
import { useState } from 'react';
import type { PitchAnalysis } from '@/types';
import { analyzePitchDeck } from '@/ai/flows/analyze-pitch-deck'; // Import the server action
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

export default function PitchAnalyzerPage() {
  const [analysisResult, setAnalysisResult] = useState<PitchAnalysis | null>(null);

  const handleAnalysisComplete = (analysis: PitchAnalysis) => {
    setAnalysisResult(analysis);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center">
        <h1 className="font-headline text-3xl font-bold text-foreground">AI Pitch Deck Analyzer</h1>
        <p className="mt-2 text-muted-foreground">
          Upload your pitch deck (PDF format) to get instant AI-powered feedback and suggestions for improvement.
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-xl">
                <Lightbulb className="h-6 w-6 text-primary" />
                Get Started
            </CardTitle>
            <CardDescription>
                Our AI will review your pitch deck on key criteria such as problem statement, solution, market size, business model, team, and financial projections.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <PitchUploadForm 
                onAnalysisComplete={handleAnalysisComplete} 
                analyzePitchDeckAction={analyzePitchDeck} // Pass the server action
            />
        </CardContent>
      </Card>
      
      {analysisResult && <AnalysisDisplay analysis={analysisResult} />}
    </div>
  );
}
