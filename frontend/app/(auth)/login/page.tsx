"use client";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Mail, Lock, ShieldCheck, Activity, Terminal, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Toggle decryption visualization animation every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRevealed((prev) => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  async function onSubmit(data: FormData) {
    setLoading(true);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      toast.error("Invalid email or password");
    } else {
      router.push("/");
    }
  }

  const secretsDemo = [
    { key: "DATABASE_URL", encrypted: "U2FsdGVkX182NmV4cDIyOQ==...", decrypted: "postgres://admin:vault_pass@db.envvault.net:5432/prod" },
    { key: "STRIPE_SECRET_KEY", encrypted: "U2FsdGVkX19zdHJpcGVfa2V5...", decrypted: "sk_live_YOUR_STRIPE_SECRET_KEY_PLACEHOLDER" },
    { key: "AWS_SECRET_ACCESS_KEY", encrypted: "U2FsdGVkX19hd3NfY2VkZW50...", decrypted: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYzEXAMPLE" },
  ];

  return (
    <div className="flex min-h-screen bg-[#07090e] font-sans antialiased text-slate-200">
      
      {/* Left Panel - Hero Visuals (hidden on mobile/tablet) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-[#0a0d14] via-[#0f131d] to-[#07090e] border-r border-white/[0.05]">
        
        {/* Glow Effects */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Grid Background Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px"
          }}
        />

        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20">
            <KeyRound className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            EnvVault
          </span>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full bg-indigo-500/10">
            SaaS
          </span>
        </div>

        {/* Middle Visuals - Interactive Encrypt/Decrypt Visualizer */}
        <div className="relative z-10 my-auto flex flex-col items-center">
          <div className="w-full max-w-md bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 backdrop-blur-md shadow-2xl relative">
            
            {/* Header for visualizer */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">AES-256-GCM Envelope Engine</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/[0.1]" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/[0.1]" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/[0.1]" />
              </div>
            </div>

            {/* Visualizer Body */}
            <div className="space-y-4">
              {secretsDemo.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-mono text-slate-500">{item.key}</span>
                    <span className="text-[10px] text-indigo-400/80 font-mono">
                      {revealed ? "Decrypted" : "AES_256"}
                    </span>
                  </div>
                  <div className="relative w-full rounded-lg bg-black/40 border border-white/[0.04] px-3 py-2 font-mono text-xs overflow-hidden flex items-center justify-between">
                    <span className={`transition-all duration-500 tracking-wide ${revealed ? "text-emerald-400" : "text-indigo-300/60"}`}>
                      {revealed ? item.decrypted : item.encrypted}
                    </span>
                    <Lock className={`h-3 w-3 text-slate-500 transition-all duration-500 ${revealed ? "rotate-180 opacity-0 scale-50" : "opacity-100"}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Visualizer Status Indicator */}
            <div className="mt-4 pt-3 border-t border-white/[0.05] flex justify-between items-center text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-mono text-[10px]">
                <Activity className="h-3 w-3 text-indigo-400" />
                Audit event emitted
              </span>
              <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded font-mono text-[10px]">
                Reads Metered +1
              </span>
            </div>
          </div>

          <div className="mt-6 text-center max-w-sm">
            <h2 className="text-lg font-semibold text-slate-100">Zero-Trust Environment Management</h2>
            <p className="text-xs text-slate-400 mt-1.5">
              Secure key distribution at scale. Rest assured that environment variables are decrypted strictly in memory at retrieval time.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex justify-between items-center text-xs text-slate-500 relative z-10">
          <span>© 2026 EnvVault Inc.</span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-indigo-500" /> ISO 27001</span>
            <span>GDPR Ready</span>
          </div>
        </div>

      </div>

      {/* Right Panel - Sign In Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 md:px-12 bg-[#07090e] relative">
        
        {/* Dynamic Glow */}
        <div className="absolute w-[500px] h-[500px] bg-indigo-600/[0.02] rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="w-full max-w-md space-y-8">
          
          {/* Header */}
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start mb-4 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                <KeyRound className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Enter your credentials to access the secrets vault.
            </p>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md p-8 shadow-2xl">
            
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 font-medium">Email Address</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@company.com" 
                  {...register("email")} 
                  error={errors.email?.message}
                  className="pl-10 bg-white/[0.03] border-white/[0.08] text-white placeholder-slate-500 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-0 focus-visible:border-indigo-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-300 font-medium">Password</Label>
                <Link href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  {...register("password")} 
                  error={errors.password?.message}
                  className="pl-10 bg-white/[0.03] border-white/[0.08] text-white placeholder-slate-500 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-0 focus-visible:border-indigo-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full mt-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/25 border-0 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200" 
              loading={loading}
            >
              <span className="flex items-center justify-center gap-2">
                Sign In
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>

            {/* Sign Up Footer */}
            <p className="text-center text-xs text-slate-500 pt-2 border-t border-white/[0.05]">
              New to EnvVault?{" "}
              <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline transition-colors">
                Create a free account
              </Link>
            </p>
          </form>

          {/* Quick Demo Assist */}
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex gap-3 items-start text-xs text-amber-400/90 max-w-md">
            <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Quick Demo Tip</span>
              Use your registered credentials to sign in, or click "Create a free account" to setup a sandbox environment.
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
