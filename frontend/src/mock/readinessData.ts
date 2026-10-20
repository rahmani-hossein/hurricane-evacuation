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
  /** Gold-table mobility proxy score used to derive riskTier. */
  riskScore?: number;
  riskTier: "CRITICAL" | "HIGH" | "MODERATE";
}

export interface ShelterCandidate {
  id: number;
  name: string;
  address: string;
  lat: number;
  lon: number;
  capacity: number;
  wheelchairStatus: "YES" | "UNRECORDED" | "NO";
  generatorOnsite: boolean;
  inSurgeZone: boolean;
  isMedical: boolean;
  usage: "EVAC" | "POST";
  groundingStatus: "Verified Active" | "Renamed / Updated" | "Unconfirmed";
  mapsPlaceUri: string;
  mapsPlaceId: string;
  lastVerified: string;
}

export interface ActionDirective {
  id: string;
  category: "SURGE_HAZARD" | "TRANSIT_GAP" | "ACCESSIBILITY_AUDIT" | "POWER_DEPENDENCY";
  severity: "URGENT" | "HIGH" | "MEDIUM";
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

/** Baseline BigQuery Gold snapshot for Lee County (FIPS 12071) */
export const MOCK_LEE_COUNTY_DATA: CountyReadinessData = {
  "county": "Lee County",
  "state": "FL",
  "seasonMonth": "August 2026",
  "summary": {
    "totalCarlessHouseholds": 14553,
    "powerDependentResidents": 8339,
    "totalShelterCapacity": 15556,
    "unrecordedAccessibilityPct": 93.3,
    "surgeExposedSheltersCount": 0,
    "medicalSheltersCount": 4
  },
  "tracts": [
    {
      "id": "12071020801",
      "name": "Lee Tract 020801",
      "householdsNoVehicle": 401,
      "pctNoVehicle": 22.6,
      "pctAge65Plus": 63.2,
      "mobileHomes": 2031,
      "lat": 26.69159750583268,
      "lon": -81.90787059019604,
      "distanceToShelterKm": 0.84,
      "riskTier": "CRITICAL"
    },
    {
      "id": "12071050104",
      "name": "Lee Tract 050104",
      "householdsNoVehicle": 77,
      "pctNoVehicle": 8.3,
      "pctAge65Plus": 59.3,
      "mobileHomes": 1549,
      "lat": 26.448565599571385,
      "lon": -81.84263872261336,
      "distanceToShelterKm": 1.75,
      "riskTier": "CRITICAL"
    },
    {
      "id": "12071010112",
      "name": "Lee Tract 010112",
      "householdsNoVehicle": 17,
      "pctNoVehicle": 4.1,
      "pctAge65Plus": 79.5,
      "mobileHomes": 2262,
      "lat": 26.748147440209078,
      "lon": -81.93007982200866,
      "distanceToShelterKm": 1.75,
      "riskTier": "CRITICAL"
    },
    {
      "id": "12071001913",
      "name": "Lee Tract 001913",
      "householdsNoVehicle": 29,
      "pctNoVehicle": 5.4,
      "pctAge65Plus": 69.7,
      "mobileHomes": 331,
      "lat": 26.504611650699868,
      "lon": -81.94770113724721,
      "distanceToShelterKm": 1.75,
      "riskTier": "CRITICAL"
    },
    {
      "id": "12071001910",
      "name": "Lee Tract 001910",
      "householdsNoVehicle": 17,
      "pctNoVehicle": 3.1,
      "pctAge65Plus": 78.6,
      "mobileHomes": 1364,
      "lat": 26.491331378222746,
      "lon": -81.95344916435548,
      "distanceToShelterKm": 1.75,
      "riskTier": "HIGH"
    },
    {
      "id": "12071001916",
      "name": "Lee Tract 001916",
      "householdsNoVehicle": 120,
      "pctNoVehicle": 10.3,
      "pctAge65Plus": 52.2,
      "mobileHomes": 449,
      "lat": 26.501891865395166,
      "lon": -81.93280451752432,
      "distanceToShelterKm": 1.75,
      "riskTier": "HIGH"
    },
    {
      "id": "12071020103",
      "name": "Lee Tract 020103",
      "householdsNoVehicle": 29,
      "pctNoVehicle": 2.1,
      "pctAge65Plus": 78.0,
      "mobileHomes": 1188,
      "lat": 26.73946951405078,
      "lon": -81.89993142909698,
      "distanceToShelterKm": 1.75,
      "riskTier": "HIGH"
    },
    {
      "id": "12071010209",
      "name": "Lee Tract 010209",
      "householdsNoVehicle": 38,
      "pctNoVehicle": 3.6,
      "pctAge65Plus": 85.8,
      "mobileHomes": 1213,
      "lat": 26.73313046924597,
      "lon": -81.91788516487331,
      "distanceToShelterKm": 1.75,
      "riskTier": "HIGH"
    },
    {
      "id": "12071020502",
      "name": "Lee Tract 020502",
      "householdsNoVehicle": 70,
      "pctNoVehicle": 7.8,
      "pctAge65Plus": 41.1,
      "mobileHomes": 1107,
      "lat": 26.67794350567092,
      "lon": -81.87070411751056,
      "distanceToShelterKm": 1.75,
      "riskTier": "HIGH"
    },
    {
      "id": "12071020501",
      "name": "Lee Tract 020501",
      "householdsNoVehicle": 136,
      "pctNoVehicle": 7.0,
      "pctAge65Plus": 52.3,
      "mobileHomes": 2291,
      "lat": 26.690458370984196,
      "lon": -81.8774266577564,
      "distanceToShelterKm": 1.75,
      "riskTier": "HIGH"
    },
    {
      "id": "12071000402",
      "name": "Lee Tract 000402",
      "householdsNoVehicle": 96,
      "pctNoVehicle": 9.6,
      "pctAge65Plus": 47.4,
      "mobileHomes": 805,
      "lat": 26.68006754201026,
      "lon": -81.79134575982314,
      "distanceToShelterKm": 1.75,
      "riskTier": "HIGH"
    },
    {
      "id": "12071001908",
      "name": "Lee Tract 001908",
      "householdsNoVehicle": 19,
      "pctNoVehicle": 1.6,
      "pctAge65Plus": 67.9,
      "mobileHomes": 638,
      "lat": 26.475042409608008,
      "lon": -81.92824372277559,
      "distanceToShelterKm": 1.75,
      "riskTier": "HIGH"
    },
    {
      "id": "12071001002",
      "name": "Lee Tract 001002",
      "householdsNoVehicle": 293,
      "pctNoVehicle": 19.3,
      "pctAge65Plus": 29.8,
      "mobileHomes": 728,
      "lat": 26.61934949648576,
      "lon": -81.8784534943857,
      "distanceToShelterKm": 1.75,
      "riskTier": "HIGH"
    },
    {
      "id": "12071020302",
      "name": "Lee Tract 020302",
      "householdsNoVehicle": 212,
      "pctNoVehicle": 24.6,
      "pctAge65Plus": 17.4,
      "mobileHomes": 2382,
      "lat": 26.716985837186193,
      "lon": -81.87197370136441,
      "distanceToShelterKm": 1.75,
      "riskTier": "HIGH"
    },
    {
      "id": "12071020102",
      "name": "Lee Tract 020102",
      "householdsNoVehicle": 79,
      "pctNoVehicle": 2.1,
      "pctAge65Plus": 50.9,
      "mobileHomes": 2068,
      "lat": 26.712741194701742,
      "lon": -81.88999705629847,
      "distanceToShelterKm": 1.75,
      "riskTier": "HIGH"
    }
  ],
  "shelters": [
    {
      "id": 133868,
      "name": "Royal Palm Exceptional Center",
      "address": "3050 INDIAN ST, FORT MYERS, FL 33916",
      "lat": 26.64468394,
      "lon": -81.85130633,
      "capacity": 470,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=Royal+Palm+Exceptional+Center",
      "mapsPlaceId": "LEE_133868",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 134881,
      "name": "Alva Middle School",
      "address": "17500 Church Ave, ALVA, FL 33920",
      "lat": 26.72567688,
      "lon": -81.59758061,
      "capacity": 0,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=Alva+Middle+School",
      "mapsPlaceId": "LEE_134881",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 344980,
      "name": "St. James City Civic Center",
      "address": "3300 Fourth Ave, SAINT JAMES CITY, FL 33956",
      "lat": 26.496439,
      "lon": -82.079088,
      "capacity": 100,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=St.+James+City+Civic+Center",
      "mapsPlaceId": "LEE_344980",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 134051,
      "name": "North Fort Myers Academy For The Arts",
      "address": "1856 ARTS WAY, NORTH FORT MYERS, FL 33917",
      "lat": 26.70711757,
      "lon": -81.88173085,
      "capacity": 2500,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=North+Fort+Myers+Academy+For+The+Arts",
      "mapsPlaceId": "LEE_134051",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 133777,
      "name": "Skyline Elementary School",
      "address": "620 SW 19TH ST, CAPE CORAL, FL 33991",
      "lat": 26.61765032,
      "lon": -81.98847992,
      "capacity": 1695,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=Skyline+Elementary+School",
      "mapsPlaceId": "LEE_133777",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 134672,
      "name": "Colonial Elementary School",
      "address": "3800 SCHOOLHOUSE RD E, FORT MYERS, FL 33916",
      "lat": 26.60878301,
      "lon": -81.84270881,
      "capacity": 1545,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=Colonial+Elementary+School",
      "mapsPlaceId": "LEE_134672",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 70852,
      "name": "Ray Potter Elementary Special Needs",
      "address": "4606 Challenger Blvd, FORT MYERS, FL 33912",
      "lat": 26.60342194,
      "lon": -81.81805037,
      "capacity": 500,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=Ray+Potter+Elementary+Special+Needs",
      "mapsPlaceId": "LEE_70852",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 345274,
      "name": "Westminster Presbyterian Church",
      "address": "9065 Ligon Court, FORT MYERS, FL 33908",
      "lat": 26.50254,
      "lon": -81.910114,
      "capacity": 100,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=Westminster+Presbyterian+Church",
      "mapsPlaceId": "LEE_345274",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 344986,
      "name": "East Lee County High School - Pets",
      "address": "715 Thomas Sherwin Ave S, Leheigh Acres, FL 33974",
      "lat": 26.5579,
      "lon": -81.601838,
      "capacity": 0,
      "wheelchairStatus": "NO",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=East+Lee+County+High+School+-+Pets",
      "mapsPlaceId": "LEE_344986",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 133769,
      "name": "South Fort Myers High School - Pets",
      "address": "14020 Plantation Road, Fort Myers, FL 33912",
      "lat": 26.537418,
      "lon": -81.849002,
      "capacity": 0,
      "wheelchairStatus": "YES",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=South+Fort+Myers+High+School+-+Pets",
      "mapsPlaceId": "LEE_133769",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 344975,
      "name": "Iona - Hope Episcopal Church",
      "address": "9650 Gladiolus Dr, FORT MYERS, FL 33908",
      "lat": 26.522105,
      "lon": -81.913283,
      "capacity": 100,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=Iona+-+Hope+Episcopal+Church",
      "mapsPlaceId": "LEE_344975",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 344917,
      "name": "First Baptist Church Of Alva",
      "address": "2790 Joel Blvd, ALVA, FL 33920",
      "lat": 26.700757,
      "lon": -81.599854,
      "capacity": 100,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=First+Baptist+Church+Of+Alva",
      "mapsPlaceId": "LEE_344917",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 345259,
      "name": "First Baptist Church Of Fort Myers Beach",
      "address": "130 Connecticut Street, FORT MYERS BEACH, FL 33931",
      "lat": 26.442968,
      "lon": -81.929891,
      "capacity": 100,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=First+Baptist+Church+Of+Fort+Myers+Beach",
      "mapsPlaceId": "LEE_345259",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 70853,
      "name": "Edison Center Special Needs",
      "address": "2645 Cortez Blvd., FORT MYERS, FL 33901",
      "lat": 26.6292246,
      "lon": -81.87831297,
      "capacity": 500,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=Edison+Center+Special+Needs",
      "mapsPlaceId": "LEE_70853",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 344979,
      "name": "St. Hilary's Episcopal Church",
      "address": "5011 McGregor Boulevard, FORT MYERS, FL 33901",
      "lat": 26.597312,
      "lon": -81.889216,
      "capacity": 100,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=St.+Hilary%27s+Episcopal+Church",
      "mapsPlaceId": "LEE_344979",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 70914,
      "name": "Lee-Caloosa Middle School Special Needs",
      "address": "610 South Del Trade Blvd, FORT MYERS, FL 33901",
      "lat": 26.57672713,
      "lon": -81.85981462,
      "capacity": 1,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=Lee-Caloosa+Middle+School+Special+Needs",
      "mapsPlaceId": "LEE_70914",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 134889,
      "name": "Alico Arena",
      "address": "12181 FGCU Lake Parkway E, FORT MYERS, FL 33913",
      "lat": 26.63174718,
      "lon": -81.85709964,
      "capacity": 1825,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=Alico+Arena",
      "mapsPlaceId": "LEE_134889",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 344907,
      "name": "Chapel By The Sea Presbyterian Church",
      "address": "100 Chapel Street, FORT MYERS BEACH, FL 33931",
      "lat": 26.449443,
      "lon": -81.942985,
      "capacity": 100,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=Chapel+By+The+Sea+Presbyterian+Church",
      "mapsPlaceId": "LEE_344907",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 133698,
      "name": "Three Oaks Middle School",
      "address": "18500 THREE OAKS PKWY, FORT MYERS, FL 33967",
      "lat": 26.45980132,
      "lon": -81.79446918,
      "capacity": 1440,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=Three+Oaks+Middle+School",
      "mapsPlaceId": "LEE_133698",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 134186,
      "name": "Lee Middle School",
      "address": "1333 MARSH AVE, FORT MYERS, FL 33905",
      "lat": 26.65327247,
      "lon": -81.82822973,
      "capacity": 620,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=Lee+Middle+School",
      "mapsPlaceId": "LEE_134186",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 345200,
      "name": "INACTIVE Grace Church",
      "address": "14830 Palm Beach Blvd, FORT MYERS, FL 33905",
      "lat": 26.701061,
      "lon": -81.76185,
      "capacity": 100,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=INACTIVE+Grace+Church",
      "mapsPlaceId": "LEE_345200",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 345230,
      "name": "Hope Lutheran Church",
      "address": "24861 Old 41 Road, BONITA SPRINGS, FL 34135",
      "lat": 26.380221,
      "lon": -81.80568,
      "capacity": 100,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=Hope+Lutheran+Church",
      "mapsPlaceId": "LEE_345230",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 70851,
      "name": "Harborside Events Center Special Needs",
      "address": "1375 Monroe St., FORT MYERS, FL 33901",
      "lat": 26.64415334,
      "lon": -81.8723055,
      "capacity": 300,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=Harborside+Events+Center+Special+Needs",
      "mapsPlaceId": "LEE_70851",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 134181,
      "name": "Lehigh Middle School",
      "address": "104 ARTHUR AVE, LEHIGH ACRES, FL 33936",
      "lat": 26.59969985,
      "lon": -81.63133216,
      "capacity": 710,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=Lehigh+Middle+School",
      "mapsPlaceId": "LEE_134181",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 345193,
      "name": "Faith Lutheran Church",
      "address": "705 Leeland Heights Boulevard East, LEHIGH ACRES, FL 33936",
      "lat": 26.603905,
      "lon": -81.619936,
      "capacity": 100,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=Faith+Lutheran+Church",
      "mapsPlaceId": "LEE_345193",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 134617,
      "name": "Diplomat Middle School",
      "address": "1039 NE 16TH TER, CAPE CORAL, FL 33909",
      "lat": 26.6221829,
      "lon": -81.95182356,
      "capacity": 1000,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=Diplomat+Middle+School",
      "mapsPlaceId": "LEE_134617",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 134416,
      "name": "Florida Gulf Coast University",
      "address": "10501 FGCU (FLORIDA GULF COAST UNIVERSITY) BLVD S, FORT MYERS, FL 33965",
      "lat": 26.63174718,
      "lon": -81.85709964,
      "capacity": 0,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=Florida+Gulf+Coast+University",
      "mapsPlaceId": "LEE_134416",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 134329,
      "name": "Heights Elementary School",
      "address": "15200 ALEXANDRIA CT, FORT MYERS, FL 33908",
      "lat": 26.5193904,
      "lon": -81.92515866,
      "capacity": 1000,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=Heights+Elementary+School",
      "mapsPlaceId": "LEE_134329",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 344984,
      "name": "St. Peter Evangelical Lutheran Church",
      "address": "3751 Estero Blvd, FORT MYERS BEACH, FL 33931",
      "lat": 26.441755,
      "lon": -81.927938,
      "capacity": 100,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=St.+Peter+Evangelical+Lutheran+Church",
      "mapsPlaceId": "LEE_344984",
      "lastVerified": "2026-08-15"
    },
    {
      "id": 134905,
      "name": "Ymca-bonita Springs Recreation Center",
      "address": "26740 PINE AVE, BONITA SPRINGS, FL 34134",
      "lat": 26.35134308,
      "lon": -81.78330859,
      "capacity": 350,
      "wheelchairStatus": "UNRECORDED",
      "generatorOnsite": false,
      "inSurgeZone": false,
      "isMedical": false,
      "usage": "EVAC",
      "groundingStatus": "Verified Active",
      "mapsPlaceUri": "https://maps.google.com/?q=Ymca-bonita+Springs+Recreation+Center",
      "mapsPlaceId": "LEE_134905",
      "lastVerified": "2026-08-15"
    }
  ],
  "directives": [
    {
      "id": "DIR-LEE-01",
      "category": "ACCESSIBILITY_AUDIT",
      "severity": "URGENT",
      "title": "State B Priority: Pre-Season ADA Physical Verification",
      "tractOrShelter": "Countywide (93% Unrecorded Shelters)",
      "rationale": "93% of candidate shelters in Lee County lack formal wheelchair paperwork at source. Unrecorded status does not indicate physical inaccessibility.",
      "recommendation": "Deploy physical site audit teams prior to September 1 to verify ramps, doorways, and restrooms."
    },
    {
      "id": "DIR-LEE-02",
      "category": "TRANSIT_GAP",
      "severity": "URGENT",
      "title": "State D Transit Gap: 2.0 km Paratransit Route Staging",
      "tractOrShelter": "Tract 12071050104 & North Fort Myers",
      "rationale": "Zero candidate pre-landfall shelters exist within 2.0 km walking threshold for high zero-vehicle households.",
      "recommendation": "Establish staged LeeTran paratransit shuttles prior to tropical storm force wind arrival."
    },
    {
      "id": "DIR-LEE-03",
      "category": "POWER_DEPENDENCY",
      "severity": "HIGH",
      "title": "Medical Electricity Priority (HHS emPOWER)",
      "tractOrShelter": "Lee County (8,339 DME Devices)",
      "rationale": "8,339 residents rely on electricity-dependent life-sustaining medical equipment (plus 801 on dialysis, 1,850 on oxygen).",
      "recommendation": "Pre-register high-risk patients to Special Needs Shelters with dual backup generation."
    }
  ]
};
