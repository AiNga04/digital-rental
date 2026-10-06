"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  loginSchema,
  type LoginRequest,
  type LoginResponse,
} from "@/schemas/auth/login";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/auth";
import { persistRefreshTokenCookie } from "@/lib/refresh-token-client";
import { AUTH_ME_QUERY_KEY } from "@/constants/query-keys";
import Routers from "@/constants/routers";
import { getValidRedirectUrl } from "@/lib/utils";
import { getRoleRedirectUrl } from "@/lib/auth-redirect";
import { startGoogleOAuth } from "@/lib/google-oauth";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [isResendingActivation, setIsResendingActivation] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

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
            : "Không thể mở đăng nhập Google",
        );
      }
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleResendActivation = async () => {
    if (!pendingEmail) return;
    setIsResendingActivation(true);
    try {
      const res = await authService.resendActivation({ email: pendingEmail });
      if (res.data.success) {
        toast.success(
          "Email kích hoạt đã được gửi lại. Vui lòng kiểm tra hộp thư.",
        );
      } else {
        toast.error(res.data.message || "Không thể gửi lại email kích hoạt");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setIsResendingActivation(false);
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
        error instanceof Error ? error.message : "Không thể mở đăng nhập Google",
      );
    }
  };

  const handleSocialAuthComingSoon = (provider: "Facebook") => {
    toast.warning(`Đăng nhập bằng ${provider} đang được phát triển.`);
  };

  const onSubmit = async (values: LoginRequest) => {
    setPendingEmail(null);
    try {
      const { data } = await authService.login(values);
      const payload = data.data as LoginResponse;

      toast.success(data.message || "Đăng nhập thành công");

      // Set state and sync with persistence
      await persistRefreshTokenCookie(payload.refreshToken);
      setAccessToken(payload.accessToken);

      // Update query cache with fresh user data
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, payload.user);

      // Check for forced redirect URL from search params
      const redirectUrl = getValidRedirectUrl(searchParams);
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      window.location.href = getRoleRedirectUrl(payload.user.roles);
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Đăng nhập thất bại, thử lại";
      const statusCode = err?.response?.status;

      // Check for PENDING account (403 or message contains activation-related text)
      if (
        statusCode === 403 ||
        message.toLowerCase().includes("chưa kích hoạt") ||
        message.toLowerCase().includes("pending") ||
        message.toLowerCase().includes("activate")
      ) {
        setPendingEmail(values.email);
      }

      toast.error(message);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-7">
        <p className="mb-2 text-sm font-medium text-red-600">Đăng nhập</p>
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-950">
          Tiếp tục với tài khoản của bạn
        </h2>
        <p className="mt-2 text-sm font-normal leading-6 text-zinc-500">
          Nhập email và mật khẩu đã đăng ký.
        </p>
      </div>

      {/* Pending Activation Banner */}
      {pendingEmail && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                Tài khoản chưa được kích hoạt
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Vui lòng kiểm tra email{" "}
                <span className="font-medium">{pendingEmail}</span> để kích hoạt
                tài khoản.
              </p>
              <button
                onClick={handleResendActivation}
                disabled={isResendingActivation}
                className="mt-2 text-sm font-medium text-amber-800 underline underline-offset-4 transition-colors hover:text-amber-900 disabled:opacity-50"
              >
                {isResendingActivation
                  ? "Đang gửi..."
                  : "Gửi lại email kích hoạt"}
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu của bạn"
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

        <div className="flex justify-end pt-1">
          <Link
            href={Routers.FORGOT_PASSWORD}
            className="text-xs font-normal text-zinc-500 transition-colors hover:text-red-600"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <button
          type="submit"
          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-zinc-950 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting}
        >
          <span style={{ color: "#ffffff" }}>
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
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
        Chưa có tài khoản?{" "}
        <Link
          href={Routers.REGISTER}
          className="ml-1 font-medium text-red-600 transition-colors hover:text-red-700"
        >
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
