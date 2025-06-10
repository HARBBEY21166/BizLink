'use client';

import type { User, Role } from '@/types';

// This is a very simplified mock auth. In a real app, use a proper auth solution.

export const mockRegister = async (name: string, email: string, role: Role): Promise<User | null> => {
  if (typeof window !== 'undefined') {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real app, you'd check if user exists, hash password, etc.
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      role,
      // Add other relevant fields if needed for mock
      bio: '',
      startupDescription: role === 'entrepreneur' ? 'My innovative startup' : undefined,
      fundingNeed: role === 'entrepreneur' ? '$100,000' : undefined,
      investmentInterests: role === 'investor' ? ['Tech', 'Healthcare'] : undefined,
      portfolioCompanies: role === 'investor' ? ['Startup A', 'Startup B'] : undefined,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem('bizlinkUser', JSON.stringify(newUser));
    localStorage.setItem('bizlinkToken', `mock-jwt-token-for-${email}`); // Mock token
    return newUser;
  }
  return null;
};

export const mockLogin = async (email: string): Promise<User | null> => {
   if (typeof window !== 'undefined') {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // This is a very basic mock. In a real app, you'd verify credentials against a backend.
    // For this mock, we assume if a user is in localStorage, login is successful.
    // A more robust mock might store a list of users or require specific credentials.
    const storedUser = localStorage.getItem('bizlinkUser');
    if (storedUser) {
      const user: User = JSON.parse(storedUser);
      // Simulate matching email, though password isn't checked here
      if (user.email === email) {
        localStorage.setItem('bizlinkToken', `mock-jwt-token-for-${email}`); // Refresh/set token
        return user;
      }
    }
    // If no user or email doesn't match, simulate login failure
    return null;
  }
  return null;
};

export const mockLogout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bizlinkUser');
    localStorage.removeItem('bizlinkToken');
  }
};

export const getAuthenticatedUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('bizlinkUser');
    const token = localStorage.getItem('bizlinkToken');
    if (userStr && token) {
      return JSON.parse(userStr);
    }
  }
  return null;
};

export const isAuthenticated = (): boolean => {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('bizlinkToken');
  }
  return false;
};
