"use client"

import React, { useState } from 'react';
import DbService from '../db/db-service';

const ExportButton = () => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (typeof window === 'undefined') return;
    
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const filename = `poultry-snapshot-${today}.csv`;
      await DbService.exportLatestSnapshot(filename);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="bg-[#EAC100] text-text hover:bg-background transition-colors disabled:opacity-50 rounded-lg px-4 py-2 m-4"
    >
      {loading ? 'Exporting...' : 'Export Data'}
    </button>
  );
};

export default ExportButton;