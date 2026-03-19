export function mapAuthError(message: string) {
  if (message.includes("Invalid login credentials")) {
    return "Sai email hoặc mật khẩu"
  }

  if (message.includes("Email not confirmed")) {
    return "Email chưa xác nhận"
  }

  if (message.includes("OAuth")) {
    return "Đăng nhập Google thất bại"
  }

  return "Có lỗi xảy ra, vui lòng thử lại"
}