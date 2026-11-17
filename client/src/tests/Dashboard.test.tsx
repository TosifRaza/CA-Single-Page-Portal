import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { StatCard } from '../components/ui/StatCard';
import { ComplianceDonut } from '../components/ui/ComplianceDonut';
import { UpcomingDeadlinesWidget } from '../components/ui/UpcomingDeadlinesWidget';

describe('Frontend UI Components', () => {
  it('Renders StatCard with exact value and label', () => {
    render(
      <StatCard
        title="Total Clients"
        value={248}
        changePercent={18}
        color="blue"
      />
    );

    expect(screen.getByText('Total Clients')).toBeInTheDocument();
    expect(screen.getByText('248')).toBeInTheDocument();
    expect(screen.getByText('+18%')).toBeInTheDocument();
  });

  it('Renders Compliance Overview with 92% rate', () => {
    render(
      <ComplianceDonut
        completedPercent={92}
        pendingPercent={6}
        overduePercent={2}
        label="On Track"
      />
    );

    expect(screen.getByText('Compliance Overview')).toBeInTheDocument();
    expect(screen.getAllByText('92%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('On Track')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('Renders Upcoming Deadlines table matching reference items', () => {
    const sampleDeadlines = [
      { id: '1', taxWork: 'GSTR-1 (GST)', client: 'ABC Traders', dueDate: '11 Nov 2026', status: 'Upcoming' as const },
      { id: '2', taxWork: 'TDS Return', client: 'XYZ Pvt Ltd', dueDate: '15 Nov 2026', status: 'Upcoming' as const },
    ];

    render(
      <BrowserRouter>
        <UpcomingDeadlinesWidget deadlines={sampleDeadlines} />
      </BrowserRouter>
    );

    expect(screen.getByText('Upcoming Deadlines')).toBeInTheDocument();
    expect(screen.getByText('GSTR-1 (GST)')).toBeInTheDocument();
    expect(screen.getByText('ABC Traders')).toBeInTheDocument();
    expect(screen.getByText('TDS Return')).toBeInTheDocument();
    expect(screen.getByText('XYZ Pvt Ltd')).toBeInTheDocument();
  });
});

