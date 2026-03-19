"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { mapAuthError } from "@/lib/errors"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, LoginInput } from "@/lib/validation/auth"

import { FormField } from "@/components/forms/FormField"
import { SubmitButton } from "@/components/forms/SubmitButton"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const { loading: authLoading, user } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (user) router.replace("/dashboard")
  }, [user, router])

  const onSubmit = async (values: LoginInput) => {
  try {
    setSubmitting(true)

    const { error } = await supabase.auth.signInWithPassword(values)

    if (error) throw error

    toast.success("Đăng nhập thành công!")
    router.replace("/dashboard")

  } catch (err: unknown) {
    if (err instanceof Error) {
      toast.error(mapAuthError(err.message))
    } else {
      toast.error("Có lỗi xảy ra")
    }
  } finally {
    setSubmitting(false)
  }
}

  const handleGoogle = async () => {
  try {
    setSubmitting(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) throw error

  } catch (err: unknown) {
    if (err instanceof Error) {
      toast.error(mapAuthError(err.message))
    } else {
      toast.error("Đăng nhập Google thất bại")
    }
  } finally {
    setSubmitting(false)
  }
}

  if (authLoading) return <div>Loading...</div>

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Login
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <FormField
              label="Email"
              name="email"
              register={register}
              error={errors.email?.message}
            />

            <FormField
              label="Mật khẩu"
              name="password"
              type="password"
              register={register}
              error={errors.password?.message}
            />

            <SubmitButton loading={submitting}>
              Đăng nhập
            </SubmitButton>
          </form>

          <Button onClick={handleGoogle} variant="outline" className="w-full">
            Đăng nhập với Google
          </Button>
          <p className="text-center text-sm text-gray-500">
            Chưa có tài khoản?{" "}
            <a href="/register" className="text-blue-600 hover:underline">
              Đăng Ký
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}