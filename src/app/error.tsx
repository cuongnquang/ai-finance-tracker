"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-xl">Có lỗi xảy ra 😢</h2>

      <button
        onClick={reset}
        className="px-4 py-2 bg-black text-white rounded"
      >
        Thử lại
      </button>
    </div>
  )
}