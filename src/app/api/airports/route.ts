import { searchAirports } from '@/lib/mock/airports';
import { simulateNetwork } from '@/lib/mock/server';

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q') ?? '';
  await simulateNetwork();
  return Response.json(searchAirports(q));
}
