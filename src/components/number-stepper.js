"use client"

import React from 'react';
import { Plus, Minus } from 'lucide-react';

const NumberStepper = ({ value, onChange, min = 0 }) => {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    onChange(value + 1);
  };

  return (
    <div className="flex items-center">
      <button
        onClick={handleDecrement}
        className="p-1 bg-white border border-foreground rounded-l hover:bg-gray-100"
      >
        <Minus size={16} className="text-foreground" />
      </button>
      <div className="px-4 py-1 bg-white border-t border-b border-foreground rounded-md min-w-[50px] text-center">
        {value}
      </div>
      <button
        onClick={handleIncrement}
        className="p-1 bg-white border border-foreground rounded-r hover:bg-gray-100"
      >
        <Plus size={16} className="text-foreground" />
      </button>
    </div>
  );
};

export default NumberStepper;