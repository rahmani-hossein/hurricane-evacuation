export interface VulnerableTract {
  id: string;
  name: string;
  householdsNoVehicle: number;
  pctNoVehicle: number;
  pctAge65Plus: number;
  mobileHomes: number;
  lat: number;
  lon: number;
  distanceToShelterKm: number;
  riskTier: 'CRITICAL' | 'HIGH' | 'MODERATE';
}

export interface ShelterCandidate {
  id: number;
  name: string;
  address: string;
  lat: number;
  lon: number;
  capacity: number;
  wheelchairStatus: 'YES' | 'UNRECORDED' | 'NO';
  generatorOnsite: boolean;
  inSurgeZone: boolean;
  isMedical: boolean;
  usage: 'EVAC' | 'POST';
  groundingStatus: 'Verified Active' | 'Renamed / Updated' | 'Unconfirmed';
  mapsPlaceUri: string;
  mapsPlaceId: string;
  lastVerified: string;
}

export interface ActionDirective {
  id: string;
  category: 'SURGE_HAZARD' | 'TRANSIT_GAP' | 'ACCESSIBILITY_AUDIT' | 'POWER_DEPENDENCY';
  severity: 'URGENT' | 'HIGH' | 'MEDIUM';
  title: string;
  tractOrShelter: string;
  rationale: string;
  recommendation: string;
}

export interface CountyReadinessData {
  county: string;
  state: string;
  seasonMonth: string;
  summary: {
    totalCarlessHouseholds: number;
    powerDependentResidents: number;
    totalShelterCapacity: number;
    unrecordedAccessibilityPct: number;
    surgeExposedSheltersCount: number;
    medicalSheltersCount: number;
  };
  tracts: VulnerableTract[];
  shelters: ShelterCandidate[];
  directives: ActionDirective[];
}

export const MOCK_LEE_COUNTY_DATA: CountyReadinessData = {
  county: "Lee County",
  state: "FL",
  seasonMonth: "August 2026",
  summary: {
    totalCarlessHouseholds: 3840,
    powerDependentResidents: 1420,
    totalShelterCapacity: 28400,
    unrecordedAccessibilityPct: 87.5,
    surgeExposedSheltersCount: 3,
    medicalSheltersCount: 2
  },
  tracts: [
    {
      id: "12071080102",
      name: "Tract 801.02 (Pine Island / Matlacha)",
      householdsNoVehicle: 412,
      pctNoVehicle: 18.2,
      pctAge65Plus: 44.5,
      mobileHomes: 395,
      lat: 26.6214,
      lon: -82.1158,
      distanceToShelterKm: 11.2,
      riskTier: "CRITICAL"
    },
    {
      id: "12071040304",
      name: "Tract 403.04 (Central Fort Myers East)",
      householdsNoVehicle: 680,
      pctNoVehicle: 24.1,
      pctAge65Plus: 28.3,
      mobileHomes: 140,
      lat: 26.6385,
      lon: -81.8542,
      distanceToShelterKm: 3.4,
      riskTier: "HIGH"
    },
    {
      id: "12071060201",
      name: "Tract 602.01 (North Cape Coral Corridor)",
      householdsNoVehicle: 310,
      pctNoVehicle: 8.5,
      pctAge65Plus: 32.1,
      mobileHomes: 520,
      lat: 26.6850,
      lon: -81.9720,
      distanceToShelterKm: 6.8,
      riskTier: "HIGH"
    },
    {
      id: "12071070100",
      name: "Tract 701.00 (Sanibel Island Coast)",
      householdsNoVehicle: 195,
      pctNoVehicle: 9.2,
      pctAge65Plus: 52.8,
      mobileHomes: 15,
      lat: 26.4420,
      lon: -82.0830,
      distanceToShelterKm: 14.5,
      riskTier: "CRITICAL"
    }
  ],
  shelters: [
    {
      id: 1042,
      name: "Estero High School",
      address: "21900 River Ranch Rd, Estero, FL 33928",
      lat: 26.4385,
      lon: -81.7942,
      capacity: 2400,
      wheelchairStatus: "YES",
      generatorOnsite: true,
      inSurgeZone: false,
      isMedical: true,
      usage: "EVAC",
      groundingStatus: "Verified Active",
      mapsPlaceUri: "https://maps.google.com/?cid=1042_estero_hs",
      mapsPlaceId: "ChIJ7xH8G-k324gRBk231042",
      lastVerified: "Live Grounded (3 mins ago)"
    },
    {
      id: 1088,
      name: "Sanibel Community House",
      address: "2173 Periwinkle Way, Sanibel, FL 33957",
      lat: 26.4369,
      lon: -82.0792,
      capacity: 450,
      wheelchairStatus: "UNRECORDED",
      generatorOnsite: false,
      inSurgeZone: true,
      isMedical: false,
      usage: "EVAC",
      groundingStatus: "Renamed / Updated",
      mapsPlaceUri: "https://maps.google.com/?cid=1088_sanibel_house",
      mapsPlaceId: "ChIJ8yR9H-k324gRBk231088",
      lastVerified: "Live Grounded (4 mins ago)"
    },
    {
      id: 1120,
      name: "Dunbar High School",
      address: "3800 Edison Ave, Fort Myers, FL 33916",
      lat: 26.6278,
      lon: -81.8415,
      capacity: 2100,
      wheelchairStatus: "YES",
      generatorOnsite: true,
      inSurgeZone: false,
      isMedical: false,
      usage: "EVAC",
      groundingStatus: "Verified Active",
      mapsPlaceUri: "https://maps.google.com/?cid=1120_dunbar_hs",
      mapsPlaceId: "ChIJ9zT0I-k324gRBk231120",
      lastVerified: "Live Grounded (1 min ago)"
    },
    {
      id: 1195,
      name: "Island Coast High School",
      address: "2125 De Navarra Pkwy, Cape Coral, FL 33909",
      lat: 26.7021,
      lon: -81.9482,
      capacity: 2600,
      wheelchairStatus: "UNRECORDED",
      generatorOnsite: false,
      inSurgeZone: false,
      isMedical: false,
      usage: "EVAC",
      groundingStatus: "Verified Active",
      mapsPlaceUri: "https://maps.google.com/?cid=1195_island_coast",
      mapsPlaceId: "ChIJ2wK1J-k324gRBk231195",
      lastVerified: "Live Grounded (2 mins ago)"
    },
    {
      id: 1204,
      name: "Fort Myers Beach Elementary",
      address: "2751 Oak St, Fort Myers Beach, FL 33931",
      lat: 26.4412,
      lon: -81.9420,
      capacity: 350,
      wheelchairStatus: "NO",
      generatorOnsite: false,
      inSurgeZone: true,
      isMedical: false,
      usage: "POST",
      groundingStatus: "Verified Active",
      mapsPlaceUri: "https://maps.google.com/?cid=1204_fmb_elem",
      mapsPlaceId: "ChIJ4mN3K-k324gRBk231204",
      lastVerified: "Live Grounded (5 mins ago)"
    }
  ],
  directives: [
    {
      id: "DIR-01",
      category: "SURGE_HAZARD",
      severity: "URGENT",
      title: "De-designate Sanibel Community House from Pre-Landfall EVAC",
      tractOrShelter: "Shelter #1088 (Sanibel)",
      rationale: "FEMA NRI & SLOSH model confirm building is in Category 2 coastal storm surge footprint. Zero evacuation should route to barrier islands.",
      recommendation: "Re-assign barrier island residents to inland Estero High School before August 25."
    },
    {
      id: "DIR-02",
      category: "TRANSIT_GAP",
      severity: "URGENT",
      title: "Establish Coordinated Paratransit Depot at Pine Island Center",
      tractOrShelter: "Tract 801.02 (Pine Island / Matlacha)",
      rationale: "412 households have no personal vehicle and distance to nearest verified inland shelter is 11.2 km (impassable without vehicle).",
      recommendation: "Stage 6 paratransit buses at Pine Island Fire Station #1 for pre-landfall scheduled evacuation runs."
    },
    {
      id: "DIR-03",
      category: "ACCESSIBILITY_AUDIT",
      severity: "HIGH",
      title: "Dispatch Field Inspector to Verify Ramps at Island Coast High",
      tractOrShelter: "Shelter #1195 (Cape Coral)",
      rationale: "Federal NSS entry lists wheelchair accessibility as UNRECORDED. Facility has 2,600 capacity and sits outside surge zone.",
      recommendation: "Perform in-person audit to confirm power door openers, elevator backup, and curb ramp grade."
    },
    {
      id: "DIR-04",
      category: "POWER_DEPENDENCY",
      severity: "HIGH",
      title: "Transfer Agreement for 280 Oxygen-Dependent Residents",
      tractOrShelter: "Fort Myers Central Corridor",
      rationale: "Only 2 shelters in Lee County carry generator + medical designation, with a combined capacity of 2,400.",
      recommendation: "Formalize mutual-aid generator transfer agreement with Lee Health System for Dunbar High School."
    }
  ]
};
