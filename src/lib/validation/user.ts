import { z } from "zod"

export const userSchema = z.object({
  name: z.string().min(2, "Tên quá ngắn"),

  avatar: z.string().url("Avatar phải là URL").optional(),

  currency: z.enum(["VND", "USD"], {
    message: "Tiền tệ không hợp lệ",
  }),

  monthlyBudget: z.coerce
    .number()
    .min(0, "Ngân sách không hợp lệ")
    .optional(),
})

export type UserInput = z.infer<typeof userSchema>