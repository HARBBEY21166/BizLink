
import type { User } from '@/types';

export interface ProfileCompleteness {
  percentage: number;
  missingFields: { fieldName: string; label: string; importance?: 'high' | 'medium' }[];
  completedFields: number;
  totalFields: number;
}

export function calculateProfileCompleteness(user: User | null): ProfileCompleteness {
  if (!user) {
    return { percentage: 0, missingFields: [], completedFields: 0, totalFields: 0 };
  }

  let completed = 0;
  const missing: { fieldName: string; label: string; importance?: 'high' | 'medium' }[] = [];
  let totalCriteria = 0;

  const hasAvatar = !!user.avatarUrl && user.avatarUrl.trim() !== '';
  const hasBio = !!user.bio && user.bio.trim() !== '';

  // Common criteria
  totalCriteria += 2; // Avatar and Bio
  if (hasAvatar) completed++; else missing.push({ fieldName: 'avatarUrl', label: 'Upload an Avatar', importance: 'high' });
  if (hasBio) completed++; else missing.push({ fieldName: 'bio', label: 'Write a Bio', importance: 'high' });

  if (user.role === 'entrepreneur') {
    const hasStartupDescription = !!user.startupDescription && user.startupDescription.trim() !== '';
    const hasFundingNeed = !!user.fundingNeed && user.fundingNeed.trim() !== '';
    const hasPitchDeckUrl = !!user.pitchDeckUrl && user.pitchDeckUrl.trim() !== '';

    totalCriteria += 3; // Startup Description, Funding Need, Pitch Deck URL
    if (hasStartupDescription) completed++; else missing.push({ fieldName: 'startupDescription', label: 'Describe Your Startup', importance: 'high' });
    if (hasFundingNeed) completed++; else missing.push({ fieldName: 'fundingNeed', label: 'Specify Funding Need', importance: 'high' });
    if (hasPitchDeckUrl) completed++; else missing.push({ fieldName: 'pitchDeckUrl', label: 'Add Pitch Deck Link', importance: 'medium' });

  } else if (user.role === 'investor') {
    const hasInvestmentInterests = !!user.investmentInterests && user.investmentInterests.length > 0;
    const hasPortfolioCompanies = !!user.portfolioCompanies && user.portfolioCompanies.length > 0;

    totalCriteria += 2; // Investment Interests, Portfolio Companies
    if (hasInvestmentInterests) completed++; else missing.push({ fieldName: 'investmentInterests', label: 'List Investment Interests', importance: 'high' });
    if (hasPortfolioCompanies) completed++; else missing.push({ fieldName: 'portfolioCompanies', label: 'Add Portfolio Companies', importance: 'medium' });
  }

  const percentage = totalCriteria > 0 ? Math.round((completed / totalCriteria) * 100) : 100;

  return {
    percentage,
    missingFields: missing,
    completedFields: completed,
    totalFields: totalCriteria,
  };
}
