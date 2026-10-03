export type PaxCounts = { adults: number; children: number; infants: number };
export type Cabin = 'economy' | 'premium' | 'business';
export type FareId = 'saver' | 'standard' | 'flex';

export type Fare = {
  id: FareId;
  name: string;
  price: number; // cents, per adult
  baggageKg: number;
  changeable: boolean;
  refundable: boolean;
};

export type Segment = {
  from: string;
  to: string;
  departAt: string; // YYYY-MM-DDTHH:mm, no zone
  arriveAt: string;
  durationMin: number;
  flightNo: string;
};

export type Offer = {
  id: string;
  airline: string;
  segments: Segment[];
  stops: number;
  durationMin: number;
  fares: Fare[];
};

export type SearchResult = { outbound: Offer[]; inbound: Offer[] | null };

export type Airport = {
  code: string;
  city: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
};

export type Airline = { code: string; name: string };
