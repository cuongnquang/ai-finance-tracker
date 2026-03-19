"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { Trash2, Edit3, Play, Pause, ArrowLeft } from 'lucide-react'
import { CurrencySelect } from '@/components/forms/CurrencySelect'
import { getCurrencySymbol } from '@/lib/exchangeRates'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

type RecurringTransaction = {
  id: string
  name: string
  amount: number
  type: 'income' | 'expense'
  currency: string
  category: string | null
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  next_date: string
  is_active: boolean
}

const FREQUENCIES = [
  { value: 'daily', label: 'Hàng ngày' },
  { value: 'weekly', label: 'Hàng tuần' },
  { value: 'monthly', label: 'Hàng tháng' },
  { value: 'yearly', label: 'Hàng năm' }
]

export default function RecurringPage() {
  const { user } = useAuth()
  const [recurrings, setRecurrings] = useState<RecurringTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [newForm, setNewForm] = useState({
    name: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    currency: 'VND',
    category: '',
    frequency: 'monthly' as RecurringTransaction['frequency'],
    next_date: '',
    is_active: true
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(newForm)

  useEffect(() => {
    if (!user) return
    fetchRecurrings()
    setNewForm(prev => ({ ...prev, next_date: format(new Date(), 'yyyy-MM-dd') }))
  }, [user])

  const fetchRecurrings = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('recurring')
        .select('*')
        .eq('user_id', user!.id)
        .order('next_date')

      if (error) throw error
      setRecurrings(data || [])
    } catch (error) {
      toast.error('Lỗi tải giao dịch định kỳ')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newForm.name.trim() || !newForm.amount) return

    const { error } = await supabase
      .from('recurring')
      .insert({
        user_id: user.id,
        ...newForm,
        amount: parseFloat(newForm.amount),
        category: newForm.category || null,
        next_date: new Date(newForm.next_date).toISOString()
      })

    if (error) {
      toast.error('Lỗi tạo: ' + error.message)
    } else {
      toast.success('Tạo thành công!')
      setNewForm({
        name: '',
        amount: '',
        type: 'expense',
        currency: 'VND',
        category: '',
        frequency: 'monthly',
        next_date: '',
        is_active: true
      })
      fetchRecurrings()
    }
  }

  const handleEdit = (recurring: RecurringTransaction) => {
    setEditForm({
      name: recurring.name,
      amount: recurring.amount.toString(),
      type: recurring.type,
      currency: recurring.currency,
      category: recurring.category || '',
      frequency: recurring.frequency,
      next_date: recurring.next_date.slice(0, 10),
      is_active: recurring.is_active
    })
    setEditingId(recurring.id)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId || !user) return

    const { error } = await supabase
      .from('recurring')
      .update({
        ...editForm,
        amount: parseFloat(editForm.amount),
        category: editForm.category || null,
        next_date: new Date(editForm.next_date).toISOString()
      })
      .eq('id', editingId)

    if (error) {
      toast.error('Lỗi cập nhật')
    } else {
      toast.success('Cập nhật thành công!')
      setEditingId(null)
      fetchRecurrings()
    }
  }

  const handleToggleActive = async (id: string, is_active: boolean) => {
    const { error } = await supabase
      .from('recurring')
      .update({ is_active: !is_active })
      .eq('id', id)

    if (error) {
      toast.error('Lỗi thay đổi trạng thái')
    } else {
      toast.success('Cập nhật trạng thái!')
      fetchRecurrings()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa giao dịch định kỳ này?')) return

    const { error } = await supabase
      .from('recurring')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Lỗi xóa')
    } else {
      toast.success('Xóa thành công!')
      fetchRecurrings()
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Đang tải...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Giao dịch định kỳ ({recurrings.length})</h1>
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
      </div>

      {/* Create Form */}
      <Card>
        <CardHeader>
          <CardTitle>Thêm giao dịch định kỳ mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Label>Tên</Label>
              <Input
                value={newForm.name}
                onChange={(e) => setNewForm({...newForm, name: e.target.value })}
                placeholder="Lương hàng tháng, tiền nhà..."
                required
              />
            </div>
            <div>
              <Label>Số tiền</Label>
              <Input
                type="number"
                value={newForm.amount}
                onChange={(e) => setNewForm({...newForm, amount: e.target.value })}
                required
              />
            </div>
            <CurrencySelect 
              value={newForm.currency}
              onChange={(v) => setNewForm({...newForm, currency: v})}
            />
            <div>
              <Label>Loại</Label>
              <Select value={newForm.type} onValueChange={(v: 'income' | 'expense') => setNewForm({...newForm, type: v})}>
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
                value={newForm.category}
                onChange={(e) => setNewForm({...newForm, category: e.target.value })}
              />
            </div>
            <div>
              <Label>Tần suất</Label>
              <Select value={newForm.frequency} onValueChange={(v: RecurringTransaction['frequency']) => setNewForm({...newForm, frequency: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ngày thực hiện tiếp theo</Label>
              <Input
                type="date"
                value={newForm.next_date}
                onChange={(e) => setNewForm({...newForm, next_date: e.target.value })}
                required
              />
            </div>
            <div className="flex items-end gap-4">
              <Button type="submit" className="flex-1">
                Tạo định kỳ
              </Button>
              <label className="flex items-center gap-2 text-sm">
                <Input
                  type="checkbox"
                  checked={newForm.is_active}
                  onChange={(e) => setNewForm({...newForm, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Kích hoạt ngay</span>
              </label>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Recurring Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách giao dịch định kỳ</CardTitle>
        </CardHeader>
        <CardContent>
          {recurrings.length === 0 ? (
            <p className="text-center py-12 text-gray-500">
              Chưa có giao dịch định kỳ nào
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Tần suất</TableHead>
                  <TableHead>Ngày tới</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurrings.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.name}
                      {r.category && <p className="text-sm text-muted-foreground">{r.category}</p>}
                    </TableCell>
                    <TableCell className="font-mono">
                      <div className={r.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {r.amount.toLocaleString('vi-VN')} {getCurrencySymbol(r.currency)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.type === 'income' ? 'default' : 'secondary'}>
                        {r.type === 'income' ? 'Thu' : 'Chi'}
                      </Badge>
                    </TableCell>
                    <TableCell>{FREQUENCIES.find(f => f.value === r.frequency)?.label}</TableCell>
                    <TableCell>{format(new Date(r.next_date), 'dd/MM/yyyy', { locale: vi })}</TableCell>
                    <TableCell>
                      <Badge variant={r.is_active ? 'default' : 'secondary'}>
                        {r.is_active ? 'Hoạt động' : 'Tạm dừng'}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(r.id, r.is_active)}
                      >
                        {r.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(r)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(r.id)}
                      >
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

      {/* Edit Modal */}
      {editingId && (
        <Dialog open={!!editingId} onOpenChange={() => setEditingId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa định kỳ</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tên</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Số tiền</Label>
                  <Input
                    type="number"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({...editForm, amount: e.target.value })}
                  />
                </div>
              </div>
              <CurrencySelect 
                value={editForm.currency}
                onChange={(v) => setEditForm({...editForm, currency: v})}
              />
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
                  <Label>Tần suất</Label>
                  <Select value={editForm.frequency} onValueChange={(v: RecurringTransaction['frequency']) => setEditForm({...editForm, frequency: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ngày tới</Label>
                  <Input
                    type="date"
                    value={editForm.next_date}
                    onChange={(e) => setEditForm({...editForm, next_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="active"
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({...editForm, is_active: e.target.checked })}
                  className="w-5 h-5"
                />
                <Label htmlFor="active">Kích hoạt</Label>
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
      )}
    </div>
  )
}
