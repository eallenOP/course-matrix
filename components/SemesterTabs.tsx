import React from 'react';

export type SemesterType = 'start' | 'end';

interface SemesterTabsProps {
  activeSemester: SemesterType;
  onSemesterChange: (semester: SemesterType) => void;
}

const SemesterTabs: React.FC<SemesterTabsProps> = ({
  activeSemester,
  onSemesterChange
}) => {
  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => onSemesterChange('start')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSemester === 'start'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Start of Semester
          </button>
          <button
            onClick={() => onSemesterChange('end')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSemester === 'end'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            End of Semester
          </button>
        </nav>
      </div>
    </div>
  );
};

export default SemesterTabs;
