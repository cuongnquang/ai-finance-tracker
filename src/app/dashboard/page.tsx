"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

type Transaction = {
  id: string
  amount: number
  type: "income" | "expense"
  currency: string
  category: string | null
  date: string
  description: string | null
}

import { getCurrencySymbol } from "@/lib/exchangeRates";
import { CURRENCIES } from "@/lib/currencies";

const defaultCurrency = 'VND';
const userCurrencySymbol = getCurrencySymbol(defaultCurrency);

type ExpenseMap = Record<string, number>

const COLORS = ["#22c55e", "#ef4444", "#3b82f6", "#eab308", "#a855f7"]

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  if (!user) return

  let isMounted = true

  const fetchTransactions = async () => {
    setLoading(true)

    try {
        const { data, error } = await supabase
          .from("transactions")
          .select("id, amount, type, currency, category, date, description")
          .eq("user_id", user.id)
          .order("date", { ascending: false })

      if (error) throw error

      if (isMounted) {
        setTransactions(data ?? [])
      }
    } catch (err) {
      toast.error("Không thể tải dữ liệu")
      console.error(err)
    } finally {
      if (isMounted) setLoading(false)
    }
  }

  fetchTransactions()

  return () => {
    isMounted = false
  }
}, [user])

const stats = useMemo(() => {
  let totalIncome = 0
  let totalExpense = 0

  for (const t of transactions) {
    const amount = Number(t.amount) || 0

    if (t.type === "income") totalIncome += amount
    else totalExpense += amount
  }

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense
  }
}, [transactions])

  // Dữ liệu cho biểu đồ cột (theo loại)
  const barData = [
    { name: "Thu nhập", value: stats.totalIncome, fill: "#22c55e" },
    { name: "Chi tiêu", value: stats.totalExpense, fill: "#ef4444" },
  ]
  
  const pieData = useMemo(() => {
    const expenseByCategory = transactions
      .filter(t => t.type === "expense")
      .reduce((acc: ExpenseMap, t) => {
        const cat = t.category?.trim() || "Khác"
        acc[cat] = (acc[cat] || 0) + t.amount
        return acc
      }, {})

    return Object.entries(expenseByCategory)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [transactions])

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center">Đang tải dashboard...</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={() => router.push("/dashboard/add")}>+ Thêm giao dịch</Button>
      </div>

      {/* Thống kê chính */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Tổng Thu Nhập</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalIncome.toLocaleString("vi-VN")} {userCurrencySymbol}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Tổng Chi Tiêu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalExpense.toLocaleString("vi-VN")} {userCurrencySymbol}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Số Dư Hiện Tại</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${stats.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
              {stats.balance.toLocaleString("vi-VN")} {userCurrencySymbol}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ cột */}
        <Card>
          <CardHeader>
            <CardTitle>Thu Nhập - Chi Tiêu</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${Number(value || 0).toLocaleString("vi-VN")} ₫`} />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Biểu đồ tròn */}
        <Card>
          <CardHeader>
            <CardTitle>Top Danh Mục Chi Tiêu</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(Number(percent) * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${Number(value || 0).toLocaleString("vi-VN")} ₫`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 mt-20">Chưa có dữ liệu chi tiêu</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Danh sách giao dịch gần đây */}
      <Card>
        <CardHeader>
          <CardTitle>Giao dịch gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Chưa có giao dịch nào</p>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 8).map((t) => (
                <div key={t.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{t.description || t.category}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(t.date).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {t.type === "income" ? "+" : "-"}{t.amount.toLocaleString("vi-VN")} ₫
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}