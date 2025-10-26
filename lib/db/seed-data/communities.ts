// Major communities for each parish (will reference parish by code)
export const jamaimaCommunities = [
  // Kingston
  { name: 'Downtown Kingston', parishCode: 'KGN', coordinates: { lat: 17.9681, lng: -76.7836 } },
  { name: 'Tivoli Gardens', parishCode: 'KGN', coordinates: { lat: 17.9712, lng: -76.7925 } },
  { name: 'Rae Town', parishCode: 'KGN', coordinates: { lat: 17.9750, lng: -76.7800 } },
  { name: 'Denham Town', parishCode: 'KGN', coordinates: { lat: 17.9680, lng: -76.7920 } },

  // St. Andrew
  { name: 'Half Way Tree', parishCode: 'AND', coordinates: { lat: 18.0129, lng: -76.7972 } },
  { name: 'Liguanea', parishCode: 'AND', coordinates: { lat: 18.0070, lng: -76.7750 } },
  { name: 'Mona', parishCode: 'AND', coordinates: { lat: 18.0070, lng: -76.7467 } },
  { name: 'Papine', parishCode: 'AND', coordinates: { lat: 18.0233, lng: -76.7417 } },
  { name: 'Constant Spring', parishCode: 'AND', coordinates: { lat: 18.0242, lng: -76.7992 } },
  { name: 'Manor Park', parishCode: 'AND', coordinates: { lat: 18.0250, lng: -76.8050 } },
  { name: 'Crossroads', parishCode: 'AND', coordinates: { lat: 18.0050, lng: -76.7900 } },
  { name: 'New Kingston', parishCode: 'AND', coordinates: { lat: 18.0075, lng: -76.7844 } },
  { name: 'Barbican', parishCode: 'AND', coordinates: { lat: 18.0200, lng: -76.7800 } },
  { name: 'Red Hills', parishCode: 'AND', coordinates: { lat: 18.0400, lng: -76.8200 } },
  { name: 'Stony Hill', parishCode: 'AND', coordinates: { lat: 18.0700, lng: -76.7900 } },

  // St. Thomas
  { name: 'Morant Bay', parishCode: 'THO', coordinates: { lat: 17.8814, lng: -76.4092 } },
  { name: 'Yallahs', parishCode: 'THO', coordinates: { lat: 17.9167, lng: -76.5667 } },
  { name: 'Port Morant', parishCode: 'THO', coordinates: { lat: 17.8936, lng: -76.3333 } },
  { name: 'Bath', parishCode: 'THO', coordinates: { lat: 17.9500, lng: -76.3667 } },

  // Portland
  { name: 'Port Antonio', parishCode: 'POR', coordinates: { lat: 18.1765, lng: -76.4511 } },
  { name: 'Boston Bay', parishCode: 'POR', coordinates: { lat: 18.1833, lng: -76.3833 } },
  { name: 'Buff Bay', parishCode: 'POR', coordinates: { lat: 18.2167, lng: -76.5833 } },
  { name: 'Long Bay', parishCode: 'POR', coordinates: { lat: 18.1667, lng: -76.4167 } },

  // St. Mary
  { name: 'Port Maria', parishCode: 'MAR', coordinates: { lat: 18.3697, lng: -76.8906 } },
  { name: 'Ocho Rios', parishCode: 'MAR', coordinates: { lat: 18.4079, lng: -77.1025 } },
  { name: 'Annotto Bay', parishCode: 'MAR', coordinates: { lat: 18.2733, lng: -76.7772 } },
  { name: 'Highgate', parishCode: 'MAR', coordinates: { lat: 18.1833, lng: -76.8167 } },

  // St. Ann
  { name: 'St. Ann\'s Bay', parishCode: 'ANN', coordinates: { lat: 18.4358, lng: -77.2008 } },
  { name: 'Runaway Bay', parishCode: 'ANN', coordinates: { lat: 18.4667, lng: -77.3333 } },
  { name: 'Browns Town', parishCode: 'ANN', coordinates: { lat: 18.4000, lng: -77.3500 } },
  { name: 'Discovery Bay', parishCode: 'ANN', coordinates: { lat: 18.4667, lng: -77.4167 } },

  // Trelawny
  { name: 'Falmouth', parishCode: 'TRL', coordinates: { lat: 18.4919, lng: -77.6561 } },
  { name: 'Duncans', parishCode: 'TRL', coordinates: { lat: 18.4833, lng: -77.7333 } },
  { name: 'Clark\'s Town', parishCode: 'TRL', coordinates: { lat: 18.4167, lng: -77.6000 } },

  // St. James
  { name: 'Montego Bay', parishCode: 'JAM', coordinates: { lat: 18.4762, lng: -77.8937 } },
  { name: 'Ironshore', parishCode: 'JAM', coordinates: { lat: 18.4667, lng: -77.8333 } },
  { name: 'Rose Hall', parishCode: 'JAM', coordinates: { lat: 18.4833, lng: -77.8167 } },
  { name: 'Cambridge', parishCode: 'JAM', coordinates: { lat: 18.4500, lng: -77.9000 } },

  // Hanover
  { name: 'Lucea', parishCode: 'HAN', coordinates: { lat: 18.4508, lng: -78.1731 } },
  { name: 'Green Island', parishCode: 'HAN', coordinates: { lat: 18.3667, lng: -78.2000 } },
  { name: 'Sandy Bay', parishCode: 'HAN', coordinates: { lat: 18.4167, lng: -78.2167 } },

  // Westmoreland
  { name: 'Savanna-la-Mar', parishCode: 'WML', coordinates: { lat: 18.2189, lng: -78.1328 } },
  { name: 'Negril', parishCode: 'WML', coordinates: { lat: 18.2692, lng: -78.3425 } },
  { name: 'Little London', parishCode: 'WML', coordinates: { lat: 18.3000, lng: -78.1500 } },
  { name: 'Bluefields', parishCode: 'WML', coordinates: { lat: 18.1667, lng: -78.0333 } },

  // St. Elizabeth
  { name: 'Black River', parishCode: 'ELI', coordinates: { lat: 18.0253, lng: -77.8464 } },
  { name: 'Santa Cruz', parishCode: 'ELI', coordinates: { lat: 18.0833, lng: -77.7667 } },
  { name: 'Treasure Beach', parishCode: 'ELI', coordinates: { lat: 17.9000, lng: -77.7500 } },
  { name: 'Junction', parishCode: 'ELI', coordinates: { lat: 18.1667, lng: -77.6667 } },

  // Manchester
  { name: 'Mandeville', parishCode: 'MAN', coordinates: { lat: 18.0333, lng: -77.5000 } },
  { name: 'Christiana', parishCode: 'MAN', coordinates: { lat: 18.1667, lng: -77.5167 } },
  { name: 'Porus', parishCode: 'MAN', coordinates: { lat: 18.0000, lng: -77.3833 } },
  { name: 'Williamsfield', parishCode: 'MAN', coordinates: { lat: 18.0167, lng: -77.6167 } },

  // Clarendon
  { name: 'May Pen', parishCode: 'CLA', coordinates: { lat: 17.9650, lng: -77.2433 } },
  { name: 'Chapelton', parishCode: 'CLA', coordinates: { lat: 18.1167, lng: -77.2167 } },
  { name: 'Old Harbour', parishCode: 'CLA', coordinates: { lat: 17.9500, lng: -77.1167 } },
  { name: 'Lionel Town', parishCode: 'CLA', coordinates: { lat: 17.8167, lng: -77.2000 } },

  // St. Catherine
  { name: 'Spanish Town', parishCode: 'CAT', coordinates: { lat: 17.9914, lng: -76.9572 } },
  { name: 'Portmore', parishCode: 'CAT', coordinates: { lat: 17.9500, lng: -76.8833 } },
  { name: 'Old Harbour Bay', parishCode: 'CAT', coordinates: { lat: 17.9167, lng: -77.1000 } },
  { name: 'Linstead', parishCode: 'CAT', coordinates: { lat: 18.1333, lng: -77.0333 } },
  { name: 'Bog Walk', parishCode: 'CAT', coordinates: { lat: 18.1167, lng: -76.9833 } },
];
