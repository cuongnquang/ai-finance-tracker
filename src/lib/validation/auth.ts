import { z } from "zod"

// ✅ Login
export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Ít nhất 6 ký tự"),
})

// ✅ Register
export const registerSchema = z
  .object({
    email: z.string().email("Email không hợp lệ"),
    password: z
      .string()
      .min(8, "Ít nhất 8 ký tự")
      .regex(/[A-Z]/, "Phải có chữ hoa")
      .regex(/[0-9]/, "Phải có số"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  })

// 👉 Type export
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>