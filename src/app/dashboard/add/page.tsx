'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

const categories = [
  "Ăn uống", 
  "Di chuyển", 
  "Điện nước", 
  "Internet", 
  "Giải trí",
  "Mua sắm", 
  "Sức khỏe", 
  "Giáo dục", 
  "Nhà ở", 
  "Lương", 
  "Thưởng", 
  "Đầu tư",
  "Khác"
]

export default function AddTransaction() {
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    const { error } = await supabase.from('transactions').insert({
      user_id: session.user.id,
      amount: parseFloat(amount),
      type,
      category: category || null,
      date: new Date(date).toISOString(),
      description: description || null,
    })

    if (error) {
      alert('Lỗi: ' + error.message)
    } else {
      alert('Thêm giao dịch thành công!')
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Thêm giao dịch mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <Label>Số tiền (VND)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Loại giao dịch</Label>
              <Select value={type} onValueChange={(v: 'income' | 'expense') => setType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Thu nhập</SelectItem>
                  <SelectItem value="expense">Chi tiêu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Phần Danh mục đã sửa thành Select */}
            <div>
              <Label>Danh mục</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Ngày</Label>
              <Input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                required 
              />
            </div>

            <div>
              <Label>Mô tả (tùy chọn)</Label>
              <Input 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Mua cà phê sáng, lương tháng 3..."
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Đang thêm...' : 'Thêm giao dịch'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}