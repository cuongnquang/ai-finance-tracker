"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const { loading: authLoading, user } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Nếu đã login thì redirect ngay
  useEffect(() => {
    if (user) {
      router.replace("/dashboard")
    }
  }, [user, router])

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Vui lòng nhập email và mật khẩu")
      return
    }

    setSubmitting(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error(error.message)
      setSubmitting(false)
      return
    }

    if (data.session) {
      toast.success("Đăng nhập thành công!")
      router.replace("/dashboard")
    } else {
      setSubmitting(false)
    }
  }

  const handleLoginWithGoogle = async () => {
  setSubmitting(true)

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  })

  if (error) {
    toast.error(error.message)
    setSubmitting(false)
  } else {
    // fallback nếu không redirect (hiếm)
    setTimeout(() => setSubmitting(false), 5000)
  }
}

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        Đang kiểm tra đăng nhập...
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-2xl text-center">AI Finance Tracker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            onClick={handleLogin}
            disabled={submitting}
            className="w-full"
          >
            {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>

          <Button 
          onClick={handleLoginWithGoogle} 
          variant="outline" 
          className="w-full" 
          disabled={submitting}
          >
            Đăng nhập với Google
          </Button>

          <p className="text-center text-sm text-gray-500">
            Chưa có tài khoản?{" "}
            <a href="/register" className="text-blue-600 hover:underline">Đăng ký</a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}