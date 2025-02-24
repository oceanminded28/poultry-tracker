// Jest setup
import '@testing-library/jest-dom';

// Mock data
export const mockBreedData = {
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

// Test utilities
export const createMockBreed = (overrides = {}) => ({
  breeders: {
    females: 0,
    males: 0,
    ...overrides.breeders
  },
  juvenile: {
    females: 0,
    males: 0,
    unknown: 0,
    ...overrides.juvenile
  },
  stages: {
    'Incubator': 0,
    'Hatch': 0,
    '1 Month': 0,
    ...overrides.stages
  }
});

// Custom matchers
expect.extend({
  toHaveValidBreedStructure(received) {
    const hasValidStructure = 
      received.breeders && 
      typeof received.breeders.females === 'number' &&
      typeof received.breeders.males === 'number' &&
      received.juvenile &&
      typeof received.juvenile.females === 'number' &&
      typeof received.juvenile.males === 'number' &&
      typeof received.juvenile.unknown === 'number' &&
      received.stages &&
      typeof received.stages['Incubator'] === 'number' &&
      typeof received.stages['Hatch'] === 'number' &&
      typeof received.stages['1 Month'] === 'number';

    return {
      message: () =>
        `expected ${JSON.stringify(received)} to have valid breed structure`,
      pass: hasValidStructure
    };
  }
});

// Global test constants
global.STAGES = ['Breeder', 'Juvenile', 'Incubator', 'Hatch', '1 Month'];
global.CATEGORIES = {
  'Chickens': ['Ayam Cemani', 'Silkie'],
  'Ducks': ['Pekin', 'Runner']
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
}); 