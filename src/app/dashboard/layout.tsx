"use client"

import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Wallet, Sparkles, LogOut } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Luôn hiển thị đầy đủ, cố định */}
      <div className="w-72 bg-white border-r shadow-sm flex flex-col h-screen sticky top-0">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-purple-600 mb-12">AI Finance</h1>
          
          <nav className="space-y-2">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-3 px-5 py-4 rounded-xl hover:bg-purple-50 text-gray-700 font-medium transition-all hover:translate-x-1"
            >
              <Home size={24} />
              Dashboard
            </Link>
            <Link 
              href="/dashboard/budget" 
              className="flex items-center gap-3 px-5 py-4 rounded-xl hover:bg-purple-50 text-gray-700 font-medium transition-all hover:translate-x-1"
            >
              <Wallet size={24} />
              Ngân sách
            </Link>
            <Link 
              href="/dashboard/ai" 
              className="flex items-center gap-3 px-5 py-4 rounded-xl hover:bg-purple-50 text-gray-700 font-medium transition-all hover:translate-x-1"
            >
              <Sparkles size={24} />
              AI Insights
            </Link>
          </nav>
        </div>

        {/* Phần dưới Sidebar */}
        <div className="mt-auto p-8 border-t">
          <div className="text-sm text-gray-500 mb-1">Xin chào</div>
          <div className="font-medium text-gray-800 mb-6 break-all">
            {user?.email}
          </div>

          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2 py-6"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            Đăng xuất
          </Button>
        </div>
      </div>

      {/* Nội dung chính */}
      <div className="flex-1 overflow-auto">
        <main className="p-6 md:p-10 max-w-6xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}