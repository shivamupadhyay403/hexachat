import HexLogo from "@/assets/logos/HexLogo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useRedirection from "@/hooks/useRedirection";
export default function LoginForm() {
  const { handleRedirectRegister, handleRedirectDashboard } = useRedirection();
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

      {/* Decorative faint chat bubbles top-left */}
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
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input id="password" type="password" required />
              </div>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" onClick={handleRedirectDashboard}>
            Login
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
