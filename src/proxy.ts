import { NextRequest, NextResponse } from 'next/server'

// Cookie-authenticated mutations must originate from this application.
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.protocol + '//' + request.headers.get('host')) return NextResponse.json({ success: false, error: 'Origen no permitido' }, { status: 403 })
    if (request.headers.get('sec-fetch-site') === 'cross-site') return NextResponse.json({ success: false, error: 'Origen no permitido' }, { status: 403 })
  }
  return NextResponse.next()
}
export const config = { matcher: '/api/:path*' }
