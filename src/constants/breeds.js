export const CATEGORIES = {
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
  'Geese': [
    'Roman Geese'
  ],
  'Turkeys': [
    'Heritage Turkey', 'Black Spanish Turkey', 'Narragansett Turkey'
  ],
  'Guinea Fowl': [
    'Guinea Fowl'
  ],
  'Quail': [
    'Button Quail', 'Celadon Coturnix Quail', 'Pharaoh Coturnix Quail'
  ]
};

export const STAGES = ['Incubator', 'Hatch', '1 Month', '2 Month'];

export const getCategoryForBreed = (breed) => {
  for (const [category, breeds] of Object.entries(CATEGORIES)) {
    if (breeds.includes(breed)) {
      return category;
    }
  }
  return 'Unknown';
};
