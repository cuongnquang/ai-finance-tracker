"use client"

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Download, ArrowLeft, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import Papa from 'papaparse'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import 'jspdf-autotable'
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
} from 'recharts'
import { getCurrencySymbol } from '@/lib/exchangeRates'

type Transaction = {
  id: string
  amount: number
  type: 'income' | 'expense'
  currency: string
  category: string | null
  date: string
  description: string | null
}

type ReportStats = {
  totalIncome: number
  totalExpense: number
  balance: number
  categories: Array<{ name: string; value: number }>
}

const COLORS = ["#22c55e", "#ef4444", "#3b82f6", "#eab308", "#a855f7", "#10b981"]

export default function ReportsPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  })
  const [stats, setStats] = useState<ReportStats | null>(null)

  useEffect(() => {
    if (!user) return
    fetchReport()
  }, [user, dateRange])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const from = format(dateRange.from, 'yyyy-MM-dd')
      const to = format(dateRange.to, 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user!.id)
        .gte('date', from)
        .lte('date', to)
        .order('date')

      if (error) throw error

      const filtered = data as Transaction[]
      setTransactions(filtered)

      // Calculate stats
      let totalIncome = 0
      let totalExpense = 0
      const categoryMap = new Map<string, number>()

      filtered.forEach(t => {
        const amount = Number(t.amount)
        if (t.type === 'income') {
          totalIncome += amount
        } else {
          totalExpense += amount
          const cat = t.category || 'Khác'
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + amount)
        }
      })

      const categories = Array.from(categoryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)

      setStats({
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        categories
      })
    } catch (error) {
      toast.error('Lỗi tải báo cáo')
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    const csvData = transactions.map(t => ({
      'Mô tả': t.description || t.category || '',
      'Số tiền': `${t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString('vi-VN')} ${getCurrencySymbol(t.currency)}`,
      'Loại': t.type === 'income' ? 'Thu nhập' : 'Chi tiêu',
      'Danh mục': t.category || '',
      'Ngày': format(new Date(t.date), 'dd/MM/yyyy', { locale: vi }),
      'Đơn vị': t.currency
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `bao-cao-tai-chinh-${format(dateRange.from, 'yyyy-MM')}-${format(dateRange.to, 'yyyy-MM')}.csv`
    link.click()
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    const dateTitle = `${format(dateRange.from, 'dd/MM/yyyy', { locale: vi })} - ${format(dateRange.to, 'dd/MM/yyyy', { locale: vi })}`
    
    doc.setFontSize(20)
    doc.text('Báo cáo tài chính', 20, 20)
    doc.setFontSize(12)
    doc.text(dateTitle, 20, 30)

    if (stats) {
      doc.text(`Tổng thu nhập: ${stats.totalIncome.toLocaleString('vi-VN')} ${getCurrencySymbol('VND')}`, 20, 50)
      doc.text(`Tổng chi tiêu: ${stats.totalExpense.toLocaleString('vi-VN')} ${getCurrencySymbol('VND')}`, 20, 60)
      doc.text(`Số dư: ${stats.balance.toLocaleString('vi-VN')} ${getCurrencySymbol('VND')}`, 20, 70)
    }

    // Table
    const tableData = transactions.map(t => [
      t.description || t.category || '',
      `${t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString('vi-VN')} ${getCurrencySymbol(t.currency)}`,
      t.type === 'income' ? 'Thu' : 'Chi',
      t.category || '',
      format(new Date(t.date), 'dd/MM/yyyy', { locale: vi })
    ])

    autoTable(doc, {
      head: [['Mô tả', 'Số tiền', 'Loại', 'Danh mục', 'Ngày']],
      body: tableData,
      startY: 90,
      theme: 'grid'
    })

    doc.save(`bao-cao-${format(dateRange.from, 'yyyy-MM')}-${format(dateRange.to, 'yyyy-MM')}.pdf`)
  }

  const barData = useMemo(() => [
    { name: 'Thu nhập', value: stats?.totalIncome || 0, fill: '#22c55e' },
    { name: 'Chi tiêu', value: stats?.totalExpense || 0, fill: '#ef4444' }
  ], [stats])

  const pieData = useMemo(() => stats?.categories.map((cat, index) => ({
    name: cat.name,
    value: cat.value,
    fill: COLORS[index % COLORS.length]
  })) || [], [stats])

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Đang tải báo cáo...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Báo cáo tài chính</h1>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Chọn khoảng thời gian</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex gap-4 items-end">
            <div>
              <Label>Từ ngày</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, 'PPP', { locale: vi }) : <span>Chọn ngày</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Đến ngày</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, 'PPP', { locale: vi }) : <span>Chọn ngày</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={fetchReport}>
              <Filter className="w-4 h-4 mr-2" />
              Lọc báo cáo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Buttons */}
      {stats && (
        <Card>
          <CardContent className="p-6 flex gap-4">
            <Button onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={exportPDF}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <div className="ml-auto flex gap-2">
              <Badge>{transactions.length} giao dịch</Badge>
              <Badge variant="secondary">{format(dateRange.from, 'MMM yyyy', { locale: vi })} - {format(dateRange.to, 'MMM yyyy', { locale: vi })}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600 text-2xl">Tổng Thu Nhập</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-4xl font-bold">{stats.totalIncome.toLocaleString('vi-VN')} ₫</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600 text-2xl">Tổng Chi Tiêu</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-4xl font-bold">{stats.totalExpense.toLocaleString('vi-VN')} ₫</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Số dư</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className={`text-4xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.balance.toLocaleString('vi-VN')} ₫
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Thu - Chi</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chi tiêu theo danh mục</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex items-center justify-center h-full text-muted-foreground">
                Chưa có dữ liệu chi tiêu
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách giao dịch ({transactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              Không có giao dịch trong khoảng thời gian này
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-auto">
              {transactions.map((t) => (
                <div key={t.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{t.description || t.category || 'Giao dịch'}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <span>{t.category || ''}</span>
                      <Badge variant="outline" className="text-xs">{t.currency}</Badge>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-xl ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : ''}{t.amount.toLocaleString('vi-VN')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(t.date), 'dd/MM/yyyy', { locale: vi })}
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
