"use client";

import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

export default function LoginPage() {
  return (
    <AuthPageShell
      title="Chào mừng bạn trở lại."
      description="Đăng nhập để quản lý giỏ hàng, đơn mua, lịch thuê và hồ sơ xác minh của bạn."
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthPageShell>
  );
}
