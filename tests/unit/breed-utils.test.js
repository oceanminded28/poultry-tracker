import { describe, expect, test } from '@jest/globals';
import { 
  getJuvenileTotal,
  getBreedTotal,
  getStageTotal,
  getBreedersTotal 
} from '../../src/utils/breed-utils';

describe('Breed Utility Functions', () => {
  const mockBreedData = {
    'Ayam Cemani': {
      breeders: {
        females: 2,
        males: 1
      },
      juvenile: {
        females: 3,
        males: 2,
        unknown: 1
      },
      stages: {
        'Incubator': 5,
        'Hatch': 2,
        '1 Month': 1
      }
    },
    'Silkie': {
      breeders: {
        females: 1,
        males: 1
      },
      juvenile: {
        females: 0,
        males: 0,
        unknown: 0
      },
      stages: {
        'Incubator': 0,
        'Hatch': 0,
        '1 Month': 0
      }
    }
  };

  test('getJuvenileTotal calculates juvenile-only totals', () => {
    // Tests just the juvenile section
    const juvenileResult = getJuvenileTotal('Ayam Cemani', mockBreedData);
    expect(juvenileResult).toBe(6);  // 3 females + 2 males + 1 unknown
  });

  test('getBreedTotal includes juveniles as part of grand total', () => {
    const breedTotal = getBreedTotal('Ayam Cemani', mockBreedData);
    
    // Break down the total
    const expectedBreederCount = 3;    // 2 females + 1 male
    const expectedJuvenileCount = 6;   // from getJuvenileTotal
    const expectedStageCount = 8;      // 5 Incubator + 2 Hatch + 1 Month
    const expectedTotal = expectedBreederCount + expectedJuvenileCount + expectedStageCount;
    
    expect(breedTotal).toBe(expectedTotal);
  });

  test('getStageTotal sums across breeds', () => {
    expect(getStageTotal('Incubator', mockBreedData)).toBe(5); // Only Ayam Cemani has incubator
    expect(getStageTotal('Juvenile', mockBreedData)).toBe(6); // Only Ayam Cemani has juveniles
  });

  test('getBreedersTotal sums specific type', () => {
    expect(getBreedersTotal('females', mockBreedData)).toBe(3); // 2 + 1
    expect(getBreedersTotal('males', mockBreedData)).toBe(2); // 1 + 1
  });
}); 