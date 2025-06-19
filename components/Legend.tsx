import React from 'react';
import { CheckCircle2, Circle, Minus } from 'lucide-react';

const Legend: React.FC = () => {
  return (
    <div className="mt-4 flex gap-6 text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <Circle className="w-4 h-4 text-gray-300" /> Not Started
      </div>
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-500" /> Completed
      </div>
      <div className="flex items-center gap-2">
        <Minus className="w-4 h-4 text-gray-400" /> Not Applicable
      </div>
    </div>
  );
};

export default Legend;
