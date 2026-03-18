"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FieldValues, Path, UseFormRegister } from "react-hook-form"

type Props<T extends FieldValues> = {
  label: string
  name: Path<T>
  type?: string
  register: UseFormRegister<T>
  error?: string
  placeholder?: string
}

export function FormField<T extends FieldValues>({
  label,
  name,
  type = "text",
  register,
  error,
  placeholder,
}: Props<T>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>

      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name)}
        className={error ? "border-red-500" : ""}
      />

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}