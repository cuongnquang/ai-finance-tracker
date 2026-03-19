"use client"

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Trash2, Edit3 } from 'lucide-react'

type Category = {
  id: string
  name: string
  color: string
  created_at: string
}

export default function CategoriesPage() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#3b82f6')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const fetchCategories = useCallback(async () => {
  if (!user) return;

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id) 
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Lỗi tải danh mục: ' + error.message);
      return;
    }
    setCategories(data || []);

  } catch (err) {
    toast.error('Đã xảy ra lỗi hệ thống không mong muốn!');
    console.error(err);
  } finally {
    setLoading(false); 
  }
}, [user]);

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newName.trim()) return

    const { error } = await supabase
      .from('categories')
      .insert({ user_id: user.id, name: newName.trim(), color: newColor })
    
    if (error) {
      toast.error('Lỗi tạo danh mục: ' + error.message)
    } else {
      toast.success('Tạo danh mục thành công!')
      setNewName('')
      fetchCategories()
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return

    const { error } = await supabase
      .from('categories')
      .update({ name: editName.trim(), color: editColor })
      .eq('id', id)
    
    if (error) {
      toast.error('Lỗi cập nhật: ' + error.message)
    } else {
      toast.success('Cập nhật thành công!')
      setEditingId(null)
      fetchCategories()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa danh mục này?')) return

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    
    if (error) {
      toast.error('Lỗi xóa: ' + error.message)
    } else {
      toast.success('Xóa thành công!')
      fetchCategories()
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Đang tải...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quản lý Danh mục</h1>
      </div>

      {/* Create Form */}
      <Card>
        <CardHeader>
          <CardTitle>Thêm danh mục mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label>Tên danh mục</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ăn uống, Di chuyển..."
                required
              />
            </div>
            <div>
              <Label>Màu sắc</Label>
              <Input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full md:w-auto">
              Thêm danh mục
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách danh mục ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-center py-12 text-gray-500">
              Chưa có danh mục nào. Thêm danh mục đầu tiên ở trên!
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Màu</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">
                      {editingId === cat.id ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                          onBlur={() => handleUpdate(cat.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdate(cat.id)}
                        />
                      ) : (
                        cat.name
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {editingId === cat.id ? (
                          <Input
                            type="color"
                            value={editColor}
                            onChange={(e) => setEditColor(e.target.value)}
                            onBlur={() => handleUpdate(cat.id)}
                          />
                        ) : (
                          <>
                            <div 
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: cat.color }}
                            />
                            <Badge style={{ backgroundColor: cat.color, color: '#fff' }}>
                              {cat.color}
                            </Badge>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(cat.created_at).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell className="flex gap-2">
                      {editingId === cat.id ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingId(null)
                            setEditName('')
                            setEditColor('')
                          }}
                        >
                          Hủy
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditingId(cat.id)
                            setEditName(cat.name)
                            setEditColor(cat.color)
                          }}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(cat.id)}
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
    </div>
  )
}
