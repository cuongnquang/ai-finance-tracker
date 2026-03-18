"use client"

import { Button } from "@/components/ui/button"

type Props = {
  loading: boolean
  children: React.ReactNode
}

export function SubmitButton({ loading, children }: Props) {
  return (
    <Button type="submit" disabled={loading} className="w-full">
      {loading ? "Đang xử lý..." : children}
    </Button>
  )
}