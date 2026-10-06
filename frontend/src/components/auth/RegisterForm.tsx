"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerSchema, type RegisterRequest } from "@/schemas/auth/register";
import { authService } from "@/services/auth";
import Routers from "@/constants/routers";
import { startGoogleOAuth } from "@/lib/google-oauth";

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("triggerGoogle") === "true") {
      const url = new URL(window.location.href);
      url.searchParams.delete("triggerGoogle");
      window.history.replaceState({}, "", url.toString());

      try {
        startGoogleOAuth();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Không thể mở đăng ký Google",
        );
      }
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterRequest) => {
    try {
      const payload = {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      };

      const res = await authService.register(payload);
      toast.success(
        res.data.message || "Đăng ký thành công, vui lòng kiểm tra email",
      );
      router.push(Routers.VERIFY);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message =
        err?.response?.data?.message || "Đăng ký thất bại, vui lòng thử lại";
      toast.error(message);
    }
  };

  const handleGoogleAuth = () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    try {
      startGoogleOAuth();
    } catch (error) {
      setIsGoogleLoading(false);
      toast.error(
        error instanceof Error ? error.message : "Không thể mở đăng ký Google",
      );
    }
  };

  const handleSocialAuthComingSoon = (provider: "Facebook") => {
    toast.warning(`Đăng ký bằng ${provider} đang được phát triển.`);
  };

  return (
    <div className="w-full">
      <div className="mb-7">
        <p className="mb-2 text-sm font-medium text-red-600">Đăng ký</p>
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-950">
          Tạo tài khoản Digital Rental
        </h2>
        <p className="mt-2 text-sm font-normal leading-6 text-zinc-500">
          Điền thông tin bên dưới để bắt đầu.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="mb-1.5 block text-xs font-normal text-zinc-600">
            Họ và tên
          </label>
          <Input
            placeholder="Nhập họ và tên của bạn"
            {...register("fullName")}
            className={`h-10 rounded-xl border-zinc-200 bg-white px-3 text-sm font-normal text-zinc-900 shadow-none placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-0 ${errors.fullName ? "border-red-500" : ""}`}
          />
          {errors.fullName && (
            <p className="mt-1 text-xs font-normal text-red-600">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-normal text-zinc-600">
            Email
          </label>
          <Input
            placeholder="Nhập địa chỉ email của bạn"
            type="email"
            {...register("email")}
            className={`h-10 rounded-xl border-zinc-200 bg-white px-3 text-sm font-normal text-zinc-900 shadow-none placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-0 ${errors.email ? "border-red-500" : ""}`}
          />
          {errors.email && (
            <p className="mt-1 text-xs font-normal text-red-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-normal text-zinc-600">
            Mật khẩu
          </label>
          <div className="relative">
            <Input
              placeholder="Nhập mật khẩu"
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className={`h-10 rounded-xl border-zinc-200 bg-white px-3 pr-10 text-sm font-normal text-zinc-900 shadow-none placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-0 ${errors.password ? "border-red-500" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-900"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs font-normal text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-normal text-zinc-600">
            Xác nhận mật khẩu
          </label>
          <Input
            placeholder="Nhập lại mật khẩu"
            type="password"
            {...register("confirmPassword")}
            className={`h-10 rounded-xl border-zinc-200 bg-white px-3 text-sm font-normal text-zinc-900 shadow-none placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-0 ${errors.confirmPassword ? "border-red-500" : ""}`}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs font-normal text-red-600">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-xl bg-zinc-950 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
          disabled={isSubmitting}
        >
          <span style={{ color: "#ffffff" }}>
            {isSubmitting ? "Đang tạo tài khoản..." : "Đăng ký"}
          </span>
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200"></div>
        </div>
        <span className="relative bg-white px-3 text-xs font-normal text-zinc-400">
          Hoặc tiếp tục với
        </span>
      </div>

      {/* Social Login */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          disabled={isGoogleLoading || isSubmitting}
          onClick={handleGoogleAuth}
          className="h-10 w-full justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-800 shadow-none hover:bg-zinc-50"
        >
          {isGoogleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
          ) : (
            <Image
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              width={18}
              height={18}
              alt="Google"
            />
          )}
          Google
        </Button>
        <Button
          type="button"
          onClick={() => handleSocialAuthComingSoon("Facebook")}
          className="h-10 w-full justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-xs font-medium text-zinc-800 shadow-none hover:bg-zinc-50"
        >
          <svg
            className="w-5 h-5 fill-current text-[#1877F2]"
            viewBox="0 0 24 24"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook
        </Button>
      </div>

      <p className="mt-6 text-center text-sm font-normal text-zinc-500">
        Đã có tài khoản?{" "}
        <Link
          href={Routers.LOGIN}
          className="ml-1 font-medium text-red-600 transition-colors hover:text-red-700"
        >
          Đăng nhập ngay
        </Link>
      </p>
    </div>
  );
}
