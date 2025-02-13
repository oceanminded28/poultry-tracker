"use client"

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

const BreedTracker = () => {
  const categories = {
    'Chickens': [
      'Ayam Cemani', 'Bantam Cochin', 'Bantam Lyonnaise', 'Bantam Orpington',
      'Bielfelder', 'Copper Marans', 'Cream Legbar', 'Easter Egger',
      'Favaucana', 'Gold Laced Polish', 'Hedemora', 'Heritage Plymouth Rock',
      'Heritage Rhode Island White', 'Hmong', 'Icelandic', 'Lyonnaise',
      'Olive Egger', 'Pavlovskaya', 'Salmon Faverolles', 'Sanjak Longcrower',
      'Serama', 'Seranaise', 'Silkie', 'Silkie Showgirl', 'Silver Laced Polish',
      'Swedish Flower Hens', 'Tolbunt Polish', 'Whiting True Blue'
    ],
    'Ducks': [
      'Bantam Silkie Ducks', 'Cayuga Duck', 'Heritage Ducks', 'Silver Appleyard Duck'
    ],
    'Geese': ['Roman Geese', 'Guinea Fowl'],
    'Quail': ['Button Quail', 'Celadon Coturnix Quail', 'Pharaoh Coturnix Quail'],
    'Turkey': ['Heritage Turkey', 'Black Spanish Turkey', 'Narragansett Turkey']
  };

  const stages = ['Incubator', 'Hatch', '1 Month', '2 Month', 'Juvenile'];

  const [breedData, setBreedData] = useState(() => {
    const initialData = {};
    Object.entries(categories).forEach(([category, breeds]) => {
      breeds.forEach(breed => {
        initialData[breed] = {
          breeders: {
            hens: 0,
            roosters: 0
          },
          stages: {},
          juvenile: {
            cockerels: 0,
            pullets: 0,
            unknown: 0
          }
        };
        stages.forEach(stage => {
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

  const getJuvenileTotal = (breed) => {
    const juvenileData = breedData[breed].juvenile;
    return juvenileData.cockerels + juvenileData.pullets + juvenileData.unknown;
  };

  const getBreedTotal = (breed) => {
    const stageTotal = Object.entries(breedData[breed].stages)
      .reduce((sum, [stage, count]) => sum + count, 0);
    return stageTotal + 
           breedData[breed].breeders.hens + 
           breedData[breed].breeders.roosters +
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
    return categories[category].reduce((sum, breed) => sum + getBreedTotal(breed), 0);
  };

  const handleStageChange = (breed, stage, value) => {
    const numValue = parseInt(value) || 0;
    setBreedData(prev => ({
      ...prev,
      [breed]: {
        ...prev[breed],
        stages: {
          ...prev[breed].stages,
          [stage]: numValue
        }
      }
    }));
  };

  const handleBreedersChange = (breed, type, value) => {
    const numValue = parseInt(value) || 0;
    setBreedData(prev => ({
      ...prev,
      [breed]: {
        ...prev[breed],
        breeders: {
          ...prev[breed].breeders,
          [type]: numValue
        }
      }
    }));
  };

  const handleJuvenileChange = (breed, type, value) => {
    const numValue = parseInt(value) || 0;
    setBreedData(prev => ({
      ...prev,
      [breed]: {
        ...prev[breed],
        juvenile: {
          ...prev[breed].juvenile,
          [type]: numValue
        }
      }
    }));
  };

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

  const totalAllBreeds = Object.values(categories).reduce((sum, breeds) => 
    sum + breeds.reduce((breedSum, breed) => breedSum + getBreedTotal(breed), 0), 0);

  return (
    <div className="max-w-lg mx-auto p-4">
      {/* Logo */}
      <div className="flex items-center justify-center mb-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#335E3B] font-serif mb-2">Sugar Feather Farm</h1>
          <div className="h-1 w-32 bg-[#FFD97D] mx-auto"></div>
        </div>
      </div>

      <Card className="mb-4 border-2 border-[#335E3B]">
        <CardHeader className="bg-[#335E3B] text-white">
          <CardTitle>Poultry Tracker</CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          <div className="text-sm mb-2 font-bold text-[#335E3B]">Total Birds: {totalAllBreeds}</div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-[#FFD97D] p-2 rounded border border-[#335E3B]">
              <div className="font-semibold text-[#335E3B]">Breeding Hens</div>
              <div>{getBreedersTotal('hens')}</div>
            </div>
            <div className="bg-[#FFD97D] p-2 rounded border border-[#335E3B]">
              <div className="font-semibold text-[#335E3B]">Breeding Roosters</div>
              <div>{getBreedersTotal('roosters')}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {stages.slice(0, -1).map(stage => (
              <div key={stage} className="bg-[#FFD97D] p-2 rounded border border-[#335E3B]">
                <div className="font-semibold text-[#335E3B]">{stage}</div>
                <div>{getStageTotal(stage)}</div>
              </div>
            ))}
          </div>
          <div className="bg-[#FFD97D] p-2 rounded border border-[#335E3B] mb-4">
            <div className="font-semibold text-[#335E3B]">Juvenile ({getStageTotal('Juvenile')})</div>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <div className="text-sm">C: {getJuvenileTypeTotal('cockerels')}</div>
              <div className="text-sm">P: {getJuvenileTypeTotal('pullets')}</div>
              <div className="text-sm">U: {getJuvenileTypeTotal('unknown')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {Object.entries(categories).map(([category, breeds]) => (
        <Card key={category} className="mb-4 border-2 border-[#335E3B]">
          <CardHeader 
            className="bg-[#335E3B] text-white cursor-pointer flex flex-row items-center justify-between"
            onClick={() => toggleCategory(category)}
          >
            <CardTitle className="text-lg">
              {category} ({getCategoryTotal(category)})
            </CardTitle>
            {expandedCategories[category] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </CardHeader>
          
          {expandedCategories[category] && (
            <CardContent className="bg-white">
              {breeds.map(breed => (
                <div key={breed} className="mb-4 border-b border-[#335E3B] pb-4">
                  <div 
                    className="flex justify-between items-center cursor-pointer mb-2"
                    onClick={() => toggleBreed(breed)}
                  >
                    <div className="font-medium text-[#335E3B]">{breed}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Total: {getBreedTotal(breed)}</span>
                      {expandedBreeds[breed] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                  
                  {expandedBreeds[breed] && (
                    <div>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-[#FFD97D] p-2 rounded border border-[#335E3B]">
                          <label className="text-sm block mb-1 font-medium text-[#335E3B]">Breeding Hens</label>
                          <input
                            type="number"
                            min="0"
                            value={breedData[breed].breeders.hens}
                            onChange={(e) => handleBreedersChange(breed, 'hens', e.target.value)}
                            className="w-full p-1 border border-[#335E3B] rounded text-center bg-white"
                          />
                        </div>
                        <div className="bg-[#FFD97D] p-2 rounded border border-[#335E3B]">
                          <label className="text-sm block mb-1 font-medium text-[#335E3B]">Breeding Roosters</label>
                          <input
                            type="number"
                            min="0"
                            value={breedData[breed].breeders.roosters}
                            onChange={(e) => handleBreedersChange(breed, 'roosters', e.target.value)}
                            className="w-full p-1 border border-[#335E3B] rounded text-center bg-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {stages.slice(0, -1).map(stage => (
                          <div key={stage} className="bg-[#FFD97D] p-2 rounded border border-[#335E3B]">
                            <label className="text-sm block mb-1 text-[#335E3B]">{stage}</label>
                            <input
                              type="number"
                              min="0"
                              value={breedData[breed].stages[stage]}
                              onChange={(e) => handleStageChange(breed, stage, e.target.value)}
                              className="w-full p-1 border border-[#335E3B] rounded text-center bg-white"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="bg-[#FEC4B6] p-2 rounded border border-[#335E3B] mb-4">
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-medium text-[#335E3B]">Juvenile</label>
                          <span className="text-sm">Total: {getJuvenileTotal(breed)}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs block mb-1 text-[#335E3B]">Cockerels</label>
                            <input
                              type="number"
                              min="0"
                              value={breedData[breed].juvenile.cockerels}
                              onChange={(e) => handleJuvenileChange(breed, 'cockerels', e.target.value)}
                              className="w-full p-1 border border-[#335E3B] rounded text-center text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs block mb-1 text-[#335E3B]">Pullets</label>
                            <input
                              type="number"
                              min="0"
                              value={breedData[breed].juvenile.pullets}
                              onChange={(e) => handleJuvenileChange(breed, 'pullets', e.target.value)}
                              className="w-full p-1 border border-[#335E3B] rounded text-center text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs block mb-1 text-[#335E3B]">Unknown</label>
                            <input
                              type="number"
                              min="0"
                              value={breedData[breed].juvenile.unknown}
                              onChange={(e) => handleJuvenileChange(breed, 'unknown', e.target.value)}
                              className="w-full p-1 border border-[#335E3B] rounded text-center text-sm bg-white"
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