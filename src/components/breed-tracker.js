"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Minus, ChevronUp, ChevronDown } from 'lucide-react';
import NumberStepper from './number-stepper';
import ExportButton from './export-button';
import DbService from '@/db/db-service';
import { CATEGORIES, STAGES } from '@/constants/breeds';

const BreedTracker = () => {
  // State declarations
  const [breedData, setBreedData] = useState(() => {
    const initialData = {};
    Object.entries(CATEGORIES).forEach(([category, breeds]) => {
      breeds.forEach(breed => {
        initialData[breed] = {
          breeders: {
            females: 0,
            males: 0
          },
          stages: {},
          juvenile: {
            males: 0,
            females: 0,
            unknown: 0
          }
        };
        STAGES.forEach(stage => {
          if (stage !== 'Juvenile') {
            initialData[breed].stages[stage] = 0;
          }
        });
      });
    });
    return initialData;
  });

  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedBreeds, setExpandedBreeds] = useState({});

  // Handler functions
  const handleStageChange = (breed, stage, value) => {
    setBreedData(prev => ({
      ...prev,
      [breed]: {
        ...prev[breed],
        stages: {
          ...prev[breed].stages,
          [stage]: value
        }
      }
    }));
  };

  const handleBreedersChange = (breed, type, value) => {
    setBreedData(prev => ({
      ...prev,
      [breed]: {
        ...prev[breed],
        breeders: {
          ...prev[breed].breeders,
          [type]: value
        }
      }
    }));
  };

  const handleJuvenileChange = (breed, type, value) => {
    setBreedData(prev => ({
      ...prev,
      [breed]: {
        ...prev[breed],
        juvenile: {
          ...prev[breed].juvenile,
          [type]: value
        }
      }
    }));
  };

  // Toggle functions
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleBreed = (breed) => {
    setExpandedBreeds(prev => ({
      ...prev,
      [breed]: !prev[breed]
    }));
  };

  // Calculation functions
  const getJuvenileTotal = (breed) => {
    const juvenileData = breedData[breed].juvenile;
    return Number(juvenileData.males || 0) + 
           Number(juvenileData.females || 0) + 
           Number(juvenileData.unknown || 0);
  };

  const getBreedTotal = (breed) => {
    const stageTotal = Object.entries(breedData[breed].stages)
      .reduce((sum, [stage, count]) => sum + count, 0);
    return stageTotal + 
           breedData[breed].breeders.females + 
           breedData[breed].breeders.males +
           getJuvenileTotal(breed);
  };

  const getStageTotal = (stage) => {
    if (stage === 'Juvenile') {
      return Object.keys(breedData).reduce((sum, breed) => sum + getJuvenileTotal(breed), 0);
    }
    return Object.values(breedData).reduce((sum, breed) => sum + (breed.stages[stage] || 0), 0);
  };

  const getJuvenileTypeTotal = (type) => {
    return Object.values(breedData).reduce((sum, breed) => sum + breed.juvenile[type], 0);
  };

  const getBreedersTotal = (type) => {
    return Object.values(breedData).reduce((sum, breed) => sum + breed.breeders[type], 0);
  };

  const getCategoryTotal = (category) => {
    return CATEGORIES[category].reduce((sum, breed) => sum + getBreedTotal(breed), 0);
  };

  const totalAllBreeds = Object.values(CATEGORIES).reduce((sum, breeds) => 
    sum + breeds.reduce((breedSum, breed) => breedSum + getBreedTotal(breed), 0), 0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saveSnapshot = async () => {
      try {
        // Filter out breeds with no counts
        const nonEmptyBreeds = Object.entries(breedData).reduce((acc, [breed, data]) => {
          const hasBreederCounts = data.breeders.females > 0 || data.breeders.males > 0;
          const hasJuvenileCounts = data.juvenile.females > 0 || data.juvenile.males > 0 || data.juvenile.unknown > 0;
          const hasStageCounts = Object.values(data.stages).some(count => count > 0);
          
          if (hasBreederCounts || hasJuvenileCounts || hasStageCounts) {
            acc[breed] = data;
          }
          return acc;
        }, {});

        // Only save if we have non-zero counts
        if (Object.keys(nonEmptyBreeds).length > 0) {
          console.log('Saving snapshot:', nonEmptyBreeds) // Debug log
          await DbService.saveDailySnapshot(nonEmptyBreeds);
        }
      } catch (error) {
        console.error('Failed to save snapshot:', error);
      }
    };

    // Use a longer debounce time
    const timeoutId = setTimeout(saveSnapshot, 2000);
    return () => clearTimeout(timeoutId);
  }, [breedData]);

  return (
    <div className="max-w-lg mx-auto p-4">
      <div className="flex items-center justify-center mb-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-text mb-2">Sugar Feather Farm</h1>
          <div className="h-1 w-32 bg-background mx-auto"></div>
        </div>
      </div>
      <div className="flex justify-between items-center mb-4">
  <div className="text-lg font-bold text-text">Total Birds: {totalAllBreeds}</div>
  <ExportButton />

</div>
      <Card className="mb-8 border-2 border-foreground">
        <CardHeader className="bg-background text-white">
          <CardTitle>Poultry Tracker</CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          <div className="text-lg mb-4 font-bold text-text">Total Birds: {totalAllBreeds}</div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-secondary p-3 rounded border border-foreground">
              <div className="font-semibold text-text mb-2">Breeder Females</div>
              <div>{getBreedersTotal('females')}</div>
            </div>
            <div className="bg-secondary p-3 rounded border border-foreground">
              <div className="font-semibold text-text mb-2">Breeding Males</div>
              <div>{getBreedersTotal('males')}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {STAGES.map(stage => (
              <div key={stage} className="bg-secondary p-3 rounded border border-foreground">
                <div className="font-semibold text-text mb-2">{stage}</div>
                <div>{getStageTotal(stage)}</div>
              </div>
            ))}
          </div>
          <div className="bg-secondary p-3 rounded border border-foreground mb-4">
            <div className="font-semibold text-text mb-2">
              Juvenile ({getStageTotal('Juvenile')})
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-sm">Males: {getJuvenileTypeTotal('males')}</div>
              <div className="text-sm">Females: {getJuvenileTypeTotal('females')}</div>
              <div className="text-sm">Unk: {getJuvenileTypeTotal('unknown')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {Object.entries(CATEGORIES).map(([category, breeds]) => (
        <Card key={category} className="mb-8 border-2 border-foreground">
          <CardHeader 
            className="bg-background text-white cursor-pointer flex flex-row items-center justify-between"
            onClick={() => toggleCategory(category)}
          >
            <CardTitle className="text-lg">
              {category} ({getCategoryTotal(category)})
            </CardTitle>
            {expandedCategories[category] ? 
              <Minus size={24} className="text-white" /> : 
              <Plus size={24} className="text-white" />
            }
          </CardHeader>
          
          {expandedCategories[category] && (
            <CardContent className="bg-white pt-15">
              {/* Category Summary Section */}
              <div className="mb-8 border-b-2 border-foreground pb-8">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-secondary p-3 rounded border border-foreground">
                    <div className="font-semibold text-text mb-2">Breeding Females</div>
                    <div>
                      {breeds.reduce((sum, breed) => sum + Number(breedData[breed].breeders.females || 0), 0)}
                    </div>
                  </div>
                  <div className="bg-secondary p-3 rounded border border-foreground">
                    <div className="font-semibold text-text mb-2">Breeding Males</div>
                    <div>
                      {breeds.reduce((sum, breed) => sum + Number(breedData[breed].breeders.males || 0), 0)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {STAGES.map(stage => (
                    <div key={stage} className="bg-secondary p-3 rounded border border-foreground">
                      <div className="font-semibold text-text mb-2">{stage}</div>
                      <div>
                        {breeds.reduce((sum, breed) => sum + Number(breedData[breed].stages[stage] || 0), 0)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-secondary p-3 rounded border border-foreground">
                  <div className="font-semibold text-text mb-2">
                    Juvenile ({breeds.reduce((sum, breed) => sum + getJuvenileTotal(breed), 0)})
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-sm">
                      Males: {breeds.reduce((sum, breed) => sum + Number(breedData[breed].juvenile.males || 0), 0)}
                    </div>
                    <div className="text-sm">
                      Females: {breeds.reduce((sum, breed) => sum + Number(breedData[breed].juvenile.females || 0), 0)}
                    </div>
                    <div className="text-sm">
                      Unk: {breeds.reduce((sum, breed) => sum + Number(breedData[breed].juvenile.unknown || 0), 0)}
                    </div>
                  </div>
                </div>
              </div>
              {/* Individual Breeds */}
              {breeds.map(breed => (
                <div key={breed} className="mb-8 last:mb-0 border-b-2 last:border-b-0 border-foreground pb-8">
                  <div className="flex justify-between items-center cursor-pointer mb-6"
                    onClick={() => toggleBreed(breed)}
                  >
                    <div className="font-medium text-text">{breed}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Total: {getBreedTotal(breed)}</span>
                      {expandedBreeds[breed] ? 
                        <ChevronUp size={20} className="text-background" /> : 
                        <ChevronDown size={20} className="text-background" />
                      }
                    </div>
                  </div>
                  
                  {expandedBreeds[breed] && (
                    <div>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-secondary p-3 rounded border border-foreground">
                          <label className="text-sm block mb-2 font-medium text-text">
                            Breeding Females
                          </label>
                          <NumberStepper
                            value={breedData[breed].breeders.females}
                            onChange={(value) => handleBreedersChange(breed, 'females', value)}
                          />
                        </div>
                        <div className="bg-secondary p-3 rounded border border-foreground">
                          <label className="text-sm block mb-2 font-medium text-text">
                            Breeding Males
                          </label>
                          <NumberStepper
                            value={breedData[breed].breeders.males}
                            onChange={(value) => handleBreedersChange(breed, 'males', value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {STAGES.map(stage => (
                          <div key={stage} className="bg-secondary p-3 rounded border border-foreground">
                            <label className="text-sm block mb-2 text-text">{stage}</label>
                            <NumberStepper
                              value={breedData[breed].stages[stage]}
                              onChange={(value) => handleStageChange(breed, stage, value)}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="bg-secondary p-3 rounded border border-foreground">
                        <div className="flex justify-between mb-3">
                          <label className="text-sm font-medium text-text">Juvenile</label>
                          <span className="text-sm">Total: {getJuvenileTotal(breed)}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs block mb-2 text-text">Males</label>
                            <NumberStepper
                              value={breedData[breed].juvenile.males}
                              onChange={(value) => handleJuvenileChange(breed, 'males', value)}
                            />
                          </div>
                          <div>
                            <label className="text-xs block mb-2 text-text">Females</label>
                            <NumberStepper
                              value={breedData[breed].juvenile.females}
                              onChange={(value) => handleJuvenileChange(breed, 'females', value)}
                            />
                          </div>
                          <div>
                            <label className="text-xs block mb-2 text-text">Unknown</label>
                            <NumberStepper
                              value={breedData[breed].juvenile.unknown}
                              onChange={(value) => handleJuvenileChange(breed, 'unknown', value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default BreedTracker;