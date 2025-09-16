/**
 * WelcomeCard Component Tests
 * 
 * Test suite for the WelcomeCard component demonstrating
 * the testing approach for the FinFlow Tracker project.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';

// Mock the formatCurrency utility
jest.mock('@/lib/utils', () => ({
  formatCurrency: (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    });
    return formatter.format(amount);
  },
}));

describe('WelcomeCard', () => {
  it('renders with default props', () => {
    render(<WelcomeCard />);
    
    // Check if greeting is displayed
    expect(screen.getByText(/Good (morning|afternoon|evening), User!/)).toBeInTheDocument();
    
    // Check if overview text is displayed
    expect(screen.getByText("Here's your financial overview")).toBeInTheDocument();
    
    // Check if net worth label is displayed
    expect(screen.getByText('Net Worth')).toBeInTheDocument();
  });

  it('renders with custom user name', () => {
    render(<WelcomeCard userName="Alice" />);
    
    expect(screen.getByText(/Alice!/)).toBeInTheDocument();
  });

  it('displays positive net worth in green', () => {
    render(<WelcomeCard netWorth={50000} currency="EUR" />);
    
    const netWorthElement = screen.getByText(/€50,000/);
    expect(netWorthElement).toHaveClass('text-green-600');
  });

  it('displays negative net worth in red', () => {
    render(<WelcomeCard netWorth={-10000} currency="EUR" />);
    
    const netWorthElement = screen.getByText(/€10,000/);
    expect(netWorthElement).toHaveClass('text-red-600');
  });

  it('displays zero net worth in gray', () => {
    render(<WelcomeCard netWorth={0} currency="EUR" />);
    
    const netWorthElement = screen.getByText(/€0/);
    expect(netWorthElement).toHaveClass('text-gray-600');
  });

  it('formats different currencies correctly', () => {
    const { rerender } = render(<WelcomeCard netWorth={1000} currency="USD" />);
    expect(screen.getByText(/\$1,000/)).toBeInTheDocument();
    
    rerender(<WelcomeCard netWorth={1000} currency="GBP" />);
    expect(screen.getByText(/£1,000/)).toBeInTheDocument();
    
    rerender(<WelcomeCard netWorth={1000} currency="SEK" />);
    expect(screen.getByText(/SEK/)).toBeInTheDocument();
  });

  it('displays last updated date', () => {
    const testDate = new Date('2024-01-15');
    render(<WelcomeCard lastUpdated={testDate} />);
    
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
  });

  it('displays summary statistics', () => {
    render(<WelcomeCard />);
    
    // Check for the statistics cards
    expect(screen.getByText('Monthly Change')).toBeInTheDocument();
    expect(screen.getByText('+5.2%')).toBeInTheDocument();
    
    expect(screen.getByText('YTD Performance')).toBeInTheDocument();
    expect(screen.getByText('+12.8%')).toBeInTheDocument();
    
    expect(screen.getByText('Accounts')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  describe('Greeting based on time', () => {
    beforeEach(() => {
      // Reset any date mocks
      jest.clearAllMocks();
    });

    it('shows "Good morning" before noon', () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(9);
      render(<WelcomeCard userName="Test" />);
      
      expect(screen.getByText('Good morning, Test!')).toBeInTheDocument();
    });

    it('shows "Good afternoon" between noon and 6pm', () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(15);
      render(<WelcomeCard userName="Test" />);
      
      expect(screen.getByText('Good afternoon, Test!')).toBeInTheDocument();
    });

    it('shows "Good evening" after 6pm', () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(20);
      render(<WelcomeCard userName="Test" />);
      
      expect(screen.getByText('Good evening, Test!')).toBeInTheDocument();
    });
  });
});
