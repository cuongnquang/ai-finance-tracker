import { z } from "zod"

export const transactionSchema = z.object({
  title: z.string().min(1, "Tên giao dịch không được để trống"),

  amount: z.coerce
    .number()
    .positive("Số tiền phải lớn hơn 0"),

  type: z.enum(["income", "expense"], {
    message: "Loại giao dịch không hợp lệ",
  }),

  category: z.string().min(1, "Chọn danh mục"),

  date: z.string().min(1, "Chọn ngày"),

  note: z.string().optional(),
})

export type TransactionInput = z.infer<typeof transactionSchema>