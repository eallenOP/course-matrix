import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Legend from '../components/Legend';

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  CheckCircle2: () => <span data-testid="check-icon">✓</span>,
  Circle: () => <span data-testid="circle-icon">○</span>,
  Minus: () => <span data-testid="minus-icon">-</span>
}));

describe('Legend', () => {
  it('should render all legend items', () => {
    render(<Legend />);
    
    expect(screen.getByText('Not Started')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Not Applicable')).toBeInTheDocument();
  });

  it('should render all status icons', () => {
    render(<Legend />);
    
    expect(screen.getByTestId('circle-icon')).toBeInTheDocument();
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    expect(screen.getByTestId('minus-icon')).toBeInTheDocument();
  });

  it('should have proper styling classes', () => {
    const { container } = render(<Legend />);
    
    const legendContainer = container.firstChild as HTMLElement;
    expect(legendContainer).toHaveClass('mt-4', 'flex', 'gap-6', 'text-sm', 'text-gray-600');
  });

  it('should have correct structure for each legend item', () => {
    render(<Legend />);
    
    // Find the individual item containers, not their parent
    const allDivs = screen.getByText('Not Started').closest('div');
    const completedDiv = screen.getByText('Completed').closest('div');
    const notApplicableDiv = screen.getByText('Not Applicable').closest('div');
    
    expect(allDivs).toHaveClass('flex', 'items-center', 'gap-2');
    expect(completedDiv).toHaveClass('flex', 'items-center', 'gap-2');
    expect(notApplicableDiv).toHaveClass('flex', 'items-center', 'gap-2');
  });

  it('should render as a static component without any interactive elements', () => {
    const { container } = render(<Legend />);
    
    const buttons = container.querySelectorAll('button');
    const inputs = container.querySelectorAll('input');
    const links = container.querySelectorAll('a');
    
    expect(buttons).toHaveLength(0);
    expect(inputs).toHaveLength(0);
    expect(links).toHaveLength(0);
  });

  it('should display icons and text in correct order for each status', () => {
    render(<Legend />);
    
    // Check that each legend item has both icon and text
    const notStartedContainer = screen.getByText('Not Started').closest('div');
    const completedContainer = screen.getByText('Completed').closest('div');
    const notApplicableContainer = screen.getByText('Not Applicable').closest('div');
    
    // Each container should have an icon and text
    expect(notStartedContainer).toContainElement(screen.getByTestId('circle-icon'));
    expect(completedContainer).toContainElement(screen.getByTestId('check-icon'));
    expect(notApplicableContainer).toContainElement(screen.getByTestId('minus-icon'));
  });
});
