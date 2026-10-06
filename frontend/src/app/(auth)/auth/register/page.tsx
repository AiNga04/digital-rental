"use client";

import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import Routers from "@/constants/routers";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

export default function RegisterPage() {
  return (
    <AuthPageShell
      title="Tạo tài khoản mới."
      description="Lưu thiết bị yêu thích, theo dõi đơn hàng và hoàn tất eKYC khi bạn cần thuê thiết bị."
      imageSrc="/images/auth-register-hero.png"
      imageAlt="Đăng ký tài khoản Digital Rental"
      backHref={Routers.LOGIN}
      backLabel="Quay lại đăng nhập"
    >
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </AuthPageShell>
  );
}
