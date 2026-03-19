"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Edit, Trash2, Search, ArrowLeft } from 'lucide-react'
import { CurrencySelect } from '@/components/forms/CurrencySelect'
import { getCurrencySymbol } from '@/lib/exchangeRates'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

type Transaction = {
  id: string
  amount: number
  type: 'income' | 'expense'
  currency: string
  category: string | null
  date: string
  description: string | null
}

export default function TransactionsPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    currency: 'VND',
    category: '',
    date: '',
    description: ''
  })

  useEffect(() => {
    if (!user) return
    fetchTransactions()
  }, [user])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      toast.error('Lỗi tải giao dịch: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter(t => 
    t.description?.toLowerCase().includes(search.toLowerCase()) ||
    t.category?.toLowerCase().includes(search.toLowerCase())
  )

  const handleEdit = (transaction: Transaction) => {
    setEditForm({
      amount: transaction.amount.toString(),
      type: transaction.type,
      currency: transaction.currency,
      category: transaction.category || '',
      date: transaction.date.slice(0, 10),
      description: transaction.description || ''
    })
    setEditingId(transaction.id)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId || !user) return

    const { error } = await supabase
      .from('transactions')
      .update({
        amount: parseFloat(editForm.amount),
        type: editForm.type,
        currency: editForm.currency,
        category: editForm.category || null,
        date: new Date(editForm.date).toISOString(),
        description: editForm.description || null
      })
      .eq('id', editingId)

    if (error) {
      toast.error('Lỗi cập nhật: ' + error.message)
    } else {
      toast.success('Cập nhật thành công!')
      setEditingId(null)
      fetchTransactions()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa giao dịch này?')) return

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Lỗi xóa: ' + error.message)
    } else {
      toast.success('Xóa thành công!')
      fetchTransactions()
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Đang tải...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Giao dịch ({filteredTransactions.length})</h1>
        <Button onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Mô tả, danh mục..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách giao dịch</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <p className="text-center py-12 text-gray-500">
              Không tìm thấy giao dịch nào hoặc chưa có dữ liệu
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mô tả/Danh mục</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{t.description || t.category || 'Không có mô tả'}</p>
                        {t.category && <p className="text-sm text-muted-foreground">{t.category}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold">
                        <span className={t.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                          {t.type === 'income' ? '+' : '-'}
                        </span>
                        {t.amount.toLocaleString('vi-VN')} {getCurrencySymbol(t.currency)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.type === 'income' ? 'default' : 'secondary'}>
                        {t.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(t.date), 'dd/MM/yyyy', { locale: vi })}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Chỉnh sửa giao dịch</DialogTitle>
                            <DialogDescription>
                              Cập nhật thông tin giao dịch.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Số tiền</Label>
                                <Input
                                  type="number"
                                  value={editForm.amount}
                                  onChange={(e) => setEditForm({...editForm, amount: e.target.value })}
                                />
                              </div>
                              <CurrencySelect 
                                value={editForm.currency}
                                onChange={(v) => setEditForm({...editForm, currency: v})}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Loại</Label>
                                <Select value={editForm.type} onValueChange={(v: 'income' | 'expense') => setEditForm({...editForm, type: v})}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="income">Thu nhập</SelectItem>
                                    <SelectItem value="expense">Chi tiêu</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Danh mục</Label>
                                <Input
                                  value={editForm.category}
                                  onChange={(e) => setEditForm({...editForm, category: e.target.value })}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Ngày</Label>
                                <Input
                                  type="date"
                                  value={editForm.date}
                                  onChange={(e) => setEditForm({...editForm, date: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>Mô tả</Label>
                                <Input
                                  value={editForm.description}
                                  onChange={(e) => setEditForm({...editForm, description: e.target.value })}
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                                Hủy
                              </Button>
                              <Button type="submit">Cập nhật</Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
