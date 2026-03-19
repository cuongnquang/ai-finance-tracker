import { toast } from "sonner"
import { mapAuthError } from "./errors"

export function handleError(err: unknown) {
  if (err instanceof Error) {
    toast.error(mapAuthError(err.message))
  } else {
    toast.error("Có lỗi xảy ra")
  }
}