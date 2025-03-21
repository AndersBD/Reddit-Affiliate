import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import StatsCard from '../../../client/src/components/dashboard/StatsCard';
import { TrendingUp } from 'lucide-react';

describe('StatsCard Component', () => {
  beforeEach(() => {
    // Reset the component for each test
  });

  test('renders with correct title and value', () => {
    render(
      <StatsCard 
        title="Total Clicks" 
        value="1,234" 
        icon={<TrendingUp />} 
        iconBgColor="bg-green-500/20" 
        iconColor="text-green-500" 
        changeValue="12%" 
        changeDirection="up" 
      />
    );

    expect(screen.getByText('Total Clicks')).toBeDefined();
    expect(screen.getByText('1,234')).toBeDefined();
  });

  test('displays correct color for positive change', () => {
    const { container } = render(
      <StatsCard 
        title="Revenue" 
        value="$5,679" 
        icon={<TrendingUp />} 
        iconBgColor="bg-green-500/20" 
        iconColor="text-green-500" 
        changeValue="8.2%" 
        changeDirection="up" 
      />
    );

    const parentDiv = screen.getByText('8.2%').closest('div');
    expect(parentDiv?.className).toContain('text-success-500');
  });

  test('displays correct color for negative change', () => {
    const { container } = render(
      <StatsCard 
        title="Bounce Rate" 
        value="24.8%" 
        icon={<TrendingUp />} 
        iconBgColor="bg-red-500/20" 
        iconColor="text-red-500" 
        changeValue="3.1%" 
        changeDirection="down" 
      />
    );

    const parentDiv = screen.getByText('3.1%').closest('div');
    expect(parentDiv?.className).toContain('text-danger-500');
  });

  test('applies animation delay when provided', () => {
    render(
      <StatsCard 
        title="Conversions" 
        value="532" 
        icon={<TrendingUp />} 
        iconBgColor="bg-blue-500/20" 
        iconColor="text-blue-500" 
        changeValue="5.4%" 
        changeDirection="up" 
        animationDelay="200ms" 
      />
    );

    const cardElement = screen.getByTestId('stats-card');
    expect(cardElement.style.animationDelay).toBe('200ms');
  });
});