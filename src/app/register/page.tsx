"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema, RegisterInput } from "@/lib/validation/auth"
import { useWatch } from "react-hook-form"
import { FormField } from "@/components/forms/FormField"
import { PasswordStrength } from "@/components/forms/PasswordStrength"
import { SubmitButton } from "@/components/forms/SubmitButton"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const password = useWatch({
  control,
  name: "password",
})

  const onSubmit = async (values: RegisterInput) => {
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success("Đăng ký thành công! Kiểm tra email.")
    router.push("/login")
  }

  const handleGoogle = async () => {
    setLoading(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Register
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

            <PasswordStrength password={password || ""} />

            <FormField
              label="Xác nhận mật khẩu"
              name="confirmPassword"
              type="password"
              register={register}
              error={errors.confirmPassword?.message}
            />

            <SubmitButton loading={loading}>
              Đăng ký
            </SubmitButton>
          </form>

          <Button onClick={handleGoogle} variant="outline" className="w-full">
            Đăng ký với Google
          </Button>

          <p className="text-center text-sm text-gray-500">
            Đã có tài khoản?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Đăng nhập
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}