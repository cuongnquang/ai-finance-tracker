"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { getCurrencySymbol } from "@/lib/exchangeRates"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

const categories = [
  "Ăn uống", "Di chuyển", "Điện nước", "Internet", "Giải trí",
  "Mua sắm", "Sức khỏe", "Giáo dục", "Nhà ở", "Khác"
]

const defaultCurrency = 'VND';
const currencySymbol = getCurrencySymbol(defaultCurrency);

type Budget = {
  id: string
  category: string
  amount: number
  month: string
}

type Transaction = {
  category?: string
  amount: number | string
}

type SpentData = {
  [category: string]: number
}

export default function BudgetPage() {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [spent, setSpent] = useState<SpentData>({})
  const [category, setCategory] = useState("")
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

  const fetchData = useCallback(async () => {
  if (!user) return

  try {
    const startDate = `${currentMonth}-01`
    const endDate = new Date(
      new Date(startDate).getFullYear(),
      new Date(startDate).getMonth() + 1,
      0
    )
      .toISOString()
      .slice(0, 10)

    const [budgetRes, spentRes] = await Promise.all([
      supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .eq("month", currentMonth),

      supabase
        .from("transactions")
        .select("category, amount, currency")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .gte("date", startDate)
        .lte("date", endDate)
    ])

    if (budgetRes.error) throw budgetRes.error
    if (spentRes.error) throw spentRes.error

    const spentMap: SpentData = {}

    spentRes.data?.forEach((t: Transaction) => {
      const cat = t.category ?? "Khác"
      const amount = Number(t.amount) || 0
      spentMap[cat] = (spentMap[cat] ?? 0) + amount
    })

    setBudgets(budgetRes.data ?? [])
    setSpent(spentMap)
  } catch (err) {
    console.error("Fetch error:", err)
  } finally {
    setFetching(false)
  }
},[user, currentMonth])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !category || !amount) {
      toast.error("Vui lòng chọn danh mục và nhập số tiền")
      return
    }

    setLoading(true)

    const { error } = await supabase.from("budgets").upsert({
      user_id: user.id,
      category,
      amount: parseFloat(amount),
      month: currentMonth,
    }, { onConflict: 'user_id,category,month' })

    if (error) {
      toast.error("Lỗi: " + error.message)
    } else {
      toast.success("Cập nhật ngân sách thành công!")
      setCategory("")
      setAmount("")
      fetchData()
    }
    setLoading(false)
  }

  return (
    
      <Card>
        <CardHeader>
          <CardTitle>Quản lý Ngân sách - Tháng {currentMonth}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Form thêm ngân sách */}
          <form onSubmit={handleAddBudget} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div>
              <Label>Danh mục</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Số tiền ngân sách {currencySymbol}</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000000"
              />
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Đang lưu..." : "Lưu ngân sách"}
              </Button>
            </div>
          </form>

          {/* Danh sách ngân sách */}
          <div className="space-y-6">
            {fetching ? (
              <p>Đang tải...</p>
            ) : budgets.length === 0 ? (
              <p className="text-center text-gray-500 py-12">
                Bạn chưa đặt ngân sách cho tháng này.<br />Hãy thêm ngân sách ở trên.
              </p>
            ) : (
              budgets.map((budget) => {
                const used = spent[budget.category] || 0
                const percent = budget.amount > 0 ? Math.min(Math.round((used / budget.amount) * 100), 100) : 0
                const isOver = used > budget.amount
                const remaining = Math.max(budget.amount - used, 0)

                return (
                  <Card key={budget.id} className={isOver ? "border-red-500" : ""}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-lg">{budget.category}</p>
                          <p className="text-sm text-gray-500">
                            Ngân sách: {budget.amount.toLocaleString('vi-VN')} ₫
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-xl ${isOver ? "text-red-600" : "text-green-600"}`}>
                            {used.toLocaleString('vi-VN')} ₫
                          </p>
                          <p className="text-xs text-gray-500">đã chi</p>
                        </div>
                      </div>

                      <Progress value={percent} className="h-3 mb-2" />

                      <div className="flex justify-between text-sm">
                        <span>{percent}% đã dùng</span>
                        <span className={isOver ? "text-red-600 font-medium" : ""}>
                          Còn lại: {remaining.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>

                      {isOver && (
                        <Badge variant="destructive" className="mt-3">
                          ĐÃ VƯỢT NGÂN SÁCH!
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
  )
}