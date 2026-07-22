export function getBearerToken(request: Request): string {
  const auth = request.headers.get('Authorization') ?? '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : '';
}

export function corsHeaders(origin: string, allowedOrigins: string): Record<string, string> {
  const allowed = allowedOrigins === '*'
    ? '*'
    : allowedOrigins.split(',').map((value) => value.trim()).includes(origin)
      ? origin
      : '';

  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export function jsonResponse(body: object, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...cors,
    },
  });
}

export function buildErrorResponse(message: string, status: number, cors: Record<string, string>): Response {
  return jsonResponse({ error: message }, status, cors);
}

export function createTraceId(request: Request): string {
  return request.headers.get('cf-ray')
    ?? request.headers.get('x-request-id')
    ?? crypto.randomUUID().slice(0, 12);
}
