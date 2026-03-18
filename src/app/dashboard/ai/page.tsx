"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Sparkles } from "lucide-react"

type Transaction = {
  amount: number
  type: "income" | "expense"
  category: string | null
  date: string
  description: string | null
}

export default function AIInsightsPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [insight, setInsight] = useState<string>("")
  const [analyzing, setAnalyzing] = useState(false)

  const currentMonth = new Date().toISOString().slice(0, 7)

  const fetchTransactions = async () => {
    if (!user) return

    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", `${currentMonth}-01`)
      .lte("date", `${currentMonth}-31`)
      .order("date", { ascending: false })

    setTransactions(data || [])
  }

  useEffect(() => {
    fetchTransactions()
  })

const analyzeWithAI = async () => {
  if (transactions.length === 0) {
    toast.error("Chưa có giao dịch nào trong tháng này")
    return
  }

  setAnalyzing(true)
  setInsight("AI đang phân tích chi tiêu của bạn... (có thể mất 5-10 giây)")

  try {
    const totalIncome = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)

    const categorySummary = transactions
      .filter(t => t.type === "expense")
      .reduce((acc: Record<string, number>, t) => {
        const cat = t.category || "Khác"
        acc[cat] = (acc[cat] || 0) + t.amount
        return acc
    }, {})

    const prompt = `Phân tích ngắn gọn chi tiêu tháng này bằng tiếng Việt, giọng thân thiện, dùng emoji:

Tổng thu: ${totalIncome.toLocaleString('vi-VN')}₫
Tổng chi: ${totalExpense.toLocaleString('vi-VN')}₫
Số dư: ${(totalIncome - totalExpense).toLocaleString('vi-VN')}₫

Chi theo danh mục: ${Object.entries(categorySummary)
      .map(([cat, val]) => `${cat}: ${Number(val).toLocaleString('vi-VN')}₫`)
      .join(', ')}

Đưa ra 3-4 nhận xét quan trọng và 2 gợi ý cụ thể để cải thiện tháng sau.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            maxOutputTokens: 600,
            temperature: 0.8 
          }
        })
      }
    )

    const data = await response.json()

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (aiText && aiText.length > 20) {
      setInsight(aiText)
    } else {
      setInsight("Gemini hiện đang quá tải (rate limit). Vui lòng chờ 30-60 giây rồi thử lại. Hoặc tạo thêm ít giao dịch rồi thử.")
    }
  } catch (err) {
    console.error(err)
    setInsight("Không kết nối được với Gemini. Kiểm tra API Key trong .env.local và thử lại sau 1 phút.")
  } finally {
    setAnalyzing(false)
  }
}

  return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="text-purple-500" />
            AI Insights - Phân tích thông minh
          </CardTitle>
          <p className="text-gray-600">AI sẽ phân tích chi tiêu tháng này và đưa ra lời khuyên cá nhân hóa</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <Button 
            onClick={analyzeWithAI} 
            disabled={analyzing || transactions.length === 0}
            className="w-full py-6 text-lg"
            size="lg"
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang phân tích dữ liệu...
              </>
            ) : (
              "Phân tích chi tiêu bằng AI ✨"
            )}
          </Button>

          {insight && (
            <Card className="bg-linear-to-br from-purple-50 to-indigo-50 border-purple-200">
              <CardContent className="pt-6 whitespace-pre-wrap text-[15px] leading-relaxed">
                {insight}
              </CardContent>
            </Card>
          )}

          {transactions.length === 0 && !analyzing && (
            <p className="text-center text-gray-500 py-12">
              Chưa có giao dịch nào trong tháng này.<br />
              Hãy thêm một số giao dịch rồi quay lại phân tích nhé!
            </p>
          )}
        </CardContent>
      </Card>
  )
}