import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import HexLogo from "@/assets/logos/HexLogo";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useRedirection from "@/hooks/useRedirection";
import { useAuth } from "../../context/Authcontext";
import api from "@/assets/api"

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Username or email is required")
    .min(3, "Must be at least 3 characters")
    .refine(
      (value) => {
        const isEmail = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value);

        const isUsername = /^[a-zA-Z0-9_]{3,30}$/.test(value);

        return isEmail || isUsername;
      },
      {
        message:
          "Enter a valid email or username (letters, numbers, underscores)",
      },
    ),

  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export default function LoginForm() {
  const { handleRedirectRegister } = useRedirection();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (formData) => {
    setServerError("");
    setLoading(true);
    try {
      const responseData = await api.post("/user/login", {
        email: formData.email,
        password: formData.password,
      });
      if (responseData?.data?.message === "User Logged In successfully") {
        login(
          responseData?.data?.data?.token,
          responseData?.data?.data?.email,
          responseData?.data?.data?.firstname,
          responseData?.data?.data?.lastname,
          responseData?.data?.data?.gender,
          responseData?.data?.data?.id,
          responseData?.data?.data?.username,
        );
        navigate(from, { replace: true });
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Invalid email or password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f0c29",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient background blobs */}
      <div
        style={{
          position: "absolute",
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "#7b5ea7",
          opacity: 0.12,
          top: -120,
          left: -100,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "#3b82f6",
          opacity: 0.12,
          bottom: -80,
          right: -60,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "#06b6d4",
          opacity: 0.1,
          top: "40%",
          left: "62%",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "1.2rem",
          left: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          opacity: 0.15,
          pointerEvents: "none",
        }}
      >
        <div
          style={{ width: 48, height: 8, background: "#fff", borderRadius: 8 }}
        />
        <div
          style={{
            width: 72,
            height: 8,
            background: "#fff",
            borderRadius: 8,
            marginLeft: 12,
          }}
        />
        <div
          style={{ width: 36, height: 8, background: "#fff", borderRadius: 8 }}
        />
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <HexLogo />
          <CardTitle className="text-2xl font-bold tracking-tight">
            HexaChat
          </CardTitle>
          <CardDescription>Login to your account</CardDescription>
        </CardHeader>

        <CardContent>
          <form id="login-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">
                  Username or Email
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="m@example.com"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">
                    Password
                    <span className="text-red-500">*</span>
                  </Label>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-sm">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {serverError && (
                <p className="text-sm text-red-400 text-center">
                  {serverError}
                </p>
              )}
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button
            type="submit"
            form="login-form"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Login"}
          </Button>
          <div className="flex items-center justify-center gap-1 text-sm">
            <span>Not Yet Registered?</span>
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={handleRedirectRegister}
            >
              Sign Up
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
