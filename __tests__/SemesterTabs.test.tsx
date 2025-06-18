import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SemesterTabs, { SemesterType } from '../components/SemesterTabs';

describe('SemesterTabs', () => {
  const defaultProps = {
    activeSemester: 'start' as SemesterType,
    onSemesterChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render both semester tab buttons', () => {
    render(<SemesterTabs {...defaultProps} />);
    
    expect(screen.getByText('Start of Semester')).toBeInTheDocument();
    expect(screen.getByText('End of Semester')).toBeInTheDocument();
  });

  it('should highlight the active semester tab', () => {
    render(<SemesterTabs {...defaultProps} activeSemester="start" />);
    
    const startTab = screen.getByText('Start of Semester');
    const endTab = screen.getByText('End of Semester');
    
    expect(startTab).toHaveClass('border-blue-500', 'text-blue-600');
    expect(endTab).toHaveClass('border-transparent', 'text-gray-500');
  });

  it('should highlight end semester when active', () => {
    render(<SemesterTabs {...defaultProps} activeSemester="end" />);
    
    const startTab = screen.getByText('Start of Semester');
    const endTab = screen.getByText('End of Semester');
    
    expect(endTab).toHaveClass('border-blue-500', 'text-blue-600');
    expect(startTab).toHaveClass('border-transparent', 'text-gray-500');
  });

  it('should call onSemesterChange when start tab is clicked', () => {
    render(<SemesterTabs {...defaultProps} activeSemester="end" />);
    
    const startTab = screen.getByText('Start of Semester');
    fireEvent.click(startTab);
    
    expect(defaultProps.onSemesterChange).toHaveBeenCalledWith('start');
  });

  it('should call onSemesterChange when end tab is clicked', () => {
    render(<SemesterTabs {...defaultProps} activeSemester="start" />);
    
    const endTab = screen.getByText('End of Semester');
    fireEvent.click(endTab);
    
    expect(defaultProps.onSemesterChange).toHaveBeenCalledWith('end');
  });

  it('should have proper tab navigation structure', () => {
    const { container } = render(<SemesterTabs {...defaultProps} />);
    
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('-mb-px', 'flex', 'space-x-8');
    
    const borderDiv = container.querySelector('.border-b');
    expect(borderDiv).toHaveClass('border-gray-200');
  });

  it('should apply hover styles to inactive tabs', () => {
    render(<SemesterTabs {...defaultProps} activeSemester="start" />);
    
    const endTab = screen.getByText('End of Semester');
    expect(endTab).toHaveClass('hover:text-gray-700', 'hover:border-gray-300');
  });
});
