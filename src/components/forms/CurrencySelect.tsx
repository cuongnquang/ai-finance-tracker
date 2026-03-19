"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES, type Currency } from "@/lib/currencies";
import { Label } from "@/components/ui/label";

interface CurrencySelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function CurrencySelect({ value, onChange, label = "Đơn vị tiền tệ" }: CurrencySelectProps) {
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Chọn đơn vị tiền" />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((currency: Currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              {currency.symbol} {currency.name} ({currency.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
