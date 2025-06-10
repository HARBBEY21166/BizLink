import type { PitchAnalysis } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';

interface AnalysisDisplayProps {
  analysis: PitchAnalysis | null;
}

export default function AnalysisDisplay({ analysis }: AnalysisDisplayProps) {
  if (!analysis) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="w-full mt-8 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-center">Pitch Deck Analysis Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Overall Score</h3>
            <span className={`text-2xl font-bold text-primary`}>{analysis.score}/100</span>
          </div>
          <Progress value={analysis.score} className="w-full h-3 [&>div]:bg-primary" />
           <p className="text-sm text-muted-foreground mt-1 text-center">
            {analysis.score >= 75 ? "Excellent!" : analysis.score >= 50 ? "Good, with room for improvement." : "Needs significant improvement."}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-green-500/10 border-green-500">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <CardTitle className="text-lg text-green-700">Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-green-800 whitespace-pre-wrap">{analysis.strengths}</p>
                </CardContent>
            </Card>

            <Card className="bg-red-500/10 border-red-500">
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                    <CardTitle className="text-lg text-red-700">Weaknesses</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-red-800 whitespace-pre-wrap">{analysis.weaknesses}</p>
                </CardContent>
            </Card>
            
            <Card className="bg-blue-500/10 border-blue-500 md:col-span-3">
                 <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <Lightbulb className="h-6 w-6 text-blue-600" />
                    <CardTitle className="text-lg text-blue-700">Advice for Improvement</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">{analysis.advice}</p>
                </CardContent>
            </Card>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground w-full text-center">
          This analysis is AI-generated and should be used as a guide. Consider seeking human expert advice as well.
        </p>
      </CardFooter>
    </Card>
  );
}
