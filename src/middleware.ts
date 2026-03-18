import { NextResponse, NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const pathname = req.nextUrl.pathname

  console.log(`[Middleware] ${pathname} → Session: ${!!session}`)

  const publicRoutes = ['/login', '/register']
  const isPublic = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))

  // TẤT CẢ route bắt đầu bằng /dashboard đều là protected
  const isProtected = pathname.startsWith('/dashboard')

  if (!session && isProtected) {
    console.log("→ Redirect to /login")
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (session && isPublic) {
    console.log("→ Redirect to /dashboard")
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return res
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}