export const getJuvenileTotal = (breed, breedData) => {
  const juvenileData = breedData[breed].juvenile;
  return Number(juvenileData.males || 0) + 
         Number(juvenileData.females || 0) + 
         Number(juvenileData.unknown || 0);
};

export const getBreedTotal = (breed, breedData) => {
  const stageTotal = Object.entries(breedData[breed].stages)
    .reduce((sum, [stage, count]) => sum + count, 0);
  return stageTotal + 
         breedData[breed].breeders.females + 
         breedData[breed].breeders.males +
         getJuvenileTotal(breed, breedData);
};

export const getStageTotal = (stage, breedData) => {
  if (stage === 'Juvenile') {
    return Object.keys(breedData).reduce((sum, breed) => 
      sum + getJuvenileTotal(breed, breedData), 0);
  }
  return Object.values(breedData).reduce((sum, breed) => 
    sum + (breed.stages[stage] || 0), 0);
};

export const getBreedersTotal = (type, breedData) => {
  return Object.values(breedData).reduce((sum, breed) => 
    sum + breed.breeders[type], 0);
};

export const getCategoryTotal = (category, breedData, categoryBreeds) => {
  return categoryBreeds.reduce((sum, breed) => 
    sum + getBreedTotal(breed, breedData), 0);
}; 