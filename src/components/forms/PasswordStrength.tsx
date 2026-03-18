"use client"

type Props = {
  password: string
}

function getStrength(password: string) {
  let score = 0

  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  return score
}

export function PasswordStrength({ password }: Props) {
  const strength = getStrength(password)

  const getColor = () => {
    if (strength <= 1) return "bg-red-500 w-1/4"
    if (strength === 2) return "bg-yellow-500 w-2/4"
    if (strength === 3) return "bg-blue-500 w-3/4"
    return "bg-green-500 w-full"
  }

  const labels = ["Rất yếu", "Yếu", "Trung bình", "Mạnh"]

  return (
    <div className="space-y-1">
      <div className="h-2 bg-gray-200 rounded">
        <div className={`h-2 rounded transition-all ${getColor()}`} />
      </div>

      {password && (
        <p className="text-xs text-gray-500">
          {labels[strength - 1] || ""}
        </p>
      )}
    </div>
  )
}