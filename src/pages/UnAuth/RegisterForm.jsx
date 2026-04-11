import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";

import HexLogo from "@/assets/logos/HexLogo";
import { Button } from "@/components/ui/button";
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

import api from "@/assets/api";
import { REGISTER } from "@/store/api";

const registerSchema = z
  .object({
    firstname: z.string().min(2).max(50),
    lastname: z.string().min(2).max(50),
    username: z.string().min(2).max(50),
    email: z.string().email(),
    gender: z.enum(["M", "F", "O"], {
      errorMap: () => ({ message: "Please select gender" }),
    }),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, "Must contain uppercase")
      .regex(/[0-9]/, "Must contain number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function RegisterForm() {
  const { handleRedirectLogin } = useRedirection();
  const [serverError, setServerError] = useState("");
  const [serverSuccess, setServerSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // 👇 NEW STATES
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      gender: "M",
    },
  });

  const onSubmit = async (formData) => {
    setServerError("");
    setServerSuccess("");
    setLoading(true);
    try {
      const { data } = await api.post(REGISTER, {
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        password: formData.password,
        username: formData.username,
        gender: formData.gender,
        confirmPassword: formData.confirmPassword,
      });
      if (data?.message === "User registered successfully") {
        alert(data?.data);
        reset();
        return;
      } else {
        alert(data?.data);
        return;
      }

      // const ok = login(data.token);
      // if (ok) {
      //   navigate("/user/dashboard", { replace: true });
      // } else {
      //   setServerError("Token invalid. Please login.");
      //   navigate("/login", { replace: true });
      // }
    } catch (err) {
      setServerError(err.response?.data?.message || "Registration failed");
      setServerSuccess("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0c29] p-8 relative overflow-hidden">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <HexLogo />
          <CardTitle className="text-2xl font-bold">
            Welcome to HexaChat
          </CardTitle>
          <CardDescription>
            Sign up to connect, chat, and share moments with your friends.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              {/* First Name */}
              <div className="grid gap-2">
                <Label>
                  First Name
                  <span className="text-red-500">*</span>
                </Label>
                <Input {...register("firstname")} />
                {errors.firstname && (
                  <p className="text-red-400 text-sm">
                    {errors.firstname.message}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className="grid gap-2">
                <Label>
                  Last Name
                  <span className="text-red-500">*</span>
                </Label>
                <Input {...register("lastname")} />
                {errors.lastname && (
                  <p className="text-red-400 text-sm">
                    {errors.lastname.message}
                  </p>
                )}
              </div>
              {/* Gender */}
              <div className="grid gap-2">
                <Label>
                  Gender
                  <span className="text-red-500">*</span>
                </Label>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" value="M" {...register("gender")} />
                    Male
                  </label>

                  <label className="flex items-center gap-2">
                    <input type="radio" value="F" {...register("gender")} />
                    Female
                  </label>

                  <label className="flex items-center gap-2">
                    <input type="radio" value="O" {...register("gender")} />
                    Other
                  </label>
                </div>

                {errors.gender && (
                  <p className="text-red-400 text-sm">
                    {errors.gender.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label>
                  User Name
                  <span className="text-red-500">*</span>
                </Label>
                <Input {...register("username")} />
                {errors.username && (
                  <p className="text-red-400 text-sm">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="grid gap-2">
                <Label>
                  Email
                  <span className="text-red-500">*</span>
                </Label>
                <Input type="text" {...register("email")} />
                {errors.email && (
                  <p className="text-red-400 text-sm">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <Label>
                  Password
                  <span className="text-red-500">*</span>
                </Label>
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

              {/* Confirm Password */}
              <div className="grid gap-2">
                <Label>
                  Confirm Password
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-sm">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {serverError && (
                <p className="text-red-400 text-center text-sm">
                  {serverError}
                </p>
              )}
              {serverSuccess && (
                <p className="text-green-400 text-center text-sm">
                  {serverSuccess}
                </p>
              )}

              <Button type="submit" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center text-sm">
          <span>Already part of HexaChat?</span>
          <Button
            variant="link"
            className="ml-1 p-0"
            onClick={handleRedirectLogin}
          >
            Login Here
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
