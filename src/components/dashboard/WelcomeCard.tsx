/**
 * WelcomeCard Component
 * 
 * This is a test component created to demonstrate the development workflow.
 * It displays a welcome message to the user with their current net worth summary.
 */

import React from 'react';
import { formatCurrency } from '@/lib/utils';

interface WelcomeCardProps {
  userName?: string;
  netWorth?: number;
  currency?: string;
  lastUpdated?: Date;
}

export const WelcomeCard: React.FC<WelcomeCardProps> = ({
  userName = 'User',
  netWorth = 0,
  currency = 'EUR',
  lastUpdated = new Date(),
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getNetWorthColor = () => {
    if (netWorth > 0) return 'text-green-600';
    if (netWorth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {userName}!
          </h2>
          <p className="text-gray-600 mt-1">
            Here's your financial overview
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Net Worth</p>
          <p className={`text-3xl font-bold ${getNetWorthColor()}`}>
            {formatCurrency(netWorth, currency)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Last updated: {lastUpdated.toLocaleDateString()}
          </p>
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-500">Monthly Change</p>
          <p className="text-lg font-semibold">+5.2%</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-500">YTD Performance</p>
          <p className="text-lg font-semibold">+12.8%</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-500">Accounts</p>
          <p className="text-lg font-semibold">4</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;
