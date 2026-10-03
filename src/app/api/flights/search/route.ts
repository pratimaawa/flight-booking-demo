import { searchFlights, simulateNetwork } from '@/lib/mock/server';
import { parseSearch } from '@/lib/schemas/search';

export async function GET(req: Request) {
  const parsed = parseSearch(new URL(req.url).searchParams);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    return Response.json({ code: 'INVALID_SEARCH', issues }, { status: 400 });
  }
  try {
    await simulateNetwork({ failRate: 0.05 });
  } catch {
    return Response.json({ code: 'UNAVAILABLE' }, { status: 503 });
  }
  return Response.json(searchFlights(parsed.data));
}
