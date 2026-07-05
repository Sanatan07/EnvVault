"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Mail, Lock, User, Building, ShieldCheck, Terminal, ArrowRight, Activity, Award } from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

const schema = z.object({
  full_name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  org_name: z.string().min(2, { message: "Organisation name must be at least 2 characters" }),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Cycle through registration visual steps every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await authApi.register(data);
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) throw new Error("Sign in failed after registration");
      router.push("/");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const setupSteps = [
    { title: "Initialize Organization Space", desc: "Setting up secure workspace boundaries, billing metrics, and admin permissions." },
    { title: "Generate Master Envelope Keys", desc: "Generating secure 256-bit symmetric keys in-memory to wrap project environment variables." },
    { title: "Provision Environments", desc: "Creating standard Production, Staging, and Development pipeline segregations." }
  ];

  return (
    <div className="flex min-h-screen bg-[#07090e] font-sans antialiased text-slate-200">
      
      {/* Left Panel - Hero Visuals */}
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

        {/* Middle Visuals - Setup Visualizer */}
        <div className="relative z-10 my-auto flex flex-col items-center">
          <div className="w-full max-w-md bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 backdrop-blur-md shadow-2xl relative">
            
            {/* Header for visualizer */}
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Workspace Build Pipeline</span>
              </div>
              <div className="flex gap-1">
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Online
                </span>
              </div>
            </div>

            {/* Visualizer Step Progress */}
            <div className="space-y-4">
              {setupSteps.map((step, idx) => (
                <div 
                  key={idx} 
                  className={`flex gap-4 p-3 rounded-xl border transition-all duration-500 ${
                    idx === activeStep 
                      ? "bg-white/[0.03] border-white/10 shadow-lg" 
                      : "bg-transparent border-transparent opacity-40"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                    idx === activeStep 
                      ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" 
                      : "bg-white/5 text-slate-400"
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-200">{step.title}</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Visualizer Footer */}
            <div className="mt-5 pt-3 border-t border-white/[0.05] flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1"><Activity className="h-3 w-3 text-indigo-400" /> System: READY</span>
              <span>100% SLA uptime guaranteed</span>
            </div>
          </div>

          <div className="mt-6 text-center max-w-sm">
            <h2 className="text-lg font-semibold text-slate-100">Set Up in Seconds</h2>
            <p className="text-xs text-slate-400 mt-1.5">
              Launch your secure multi-tenant organisation and start pulling secrets directly into your development workflow.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex justify-between items-center text-xs text-slate-500 relative z-10">
          <span>© 2026 EnvVault Inc.</span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-indigo-500" /> ISO 27001</span>
            <span>SOC2 Audit Ready</span>
          </div>
        </div>

      </div>

      {/* Right Panel - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 md:px-12 bg-[#07090e] relative">
        
        {/* Dynamic Glow */}
        <div className="absolute w-[500px] h-[500px] bg-indigo-600/[0.02] rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="w-full max-w-md space-y-6">
          
          {/* Header */}
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start mb-4 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                <KeyRound className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Get started with a free sandbox organization.
            </p>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md p-8 shadow-2xl">
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="text-slate-300 text-xs font-semibold">Full Name</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <Input 
                  id="full_name" 
                  type="text" 
                  placeholder="Jane Doe" 
                  {...register("full_name")} 
                  error={errors.full_name?.message}
                  className="pl-10 bg-white/[0.03] border-white/[0.08] text-white placeholder-slate-500 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-0 focus-visible:border-indigo-500"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-300 text-xs font-semibold">Email Address</Label>
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

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-300 text-xs font-semibold">Password</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="At least 8 characters" 
                  {...register("password")} 
                  error={errors.password?.message}
                  className="pl-10 bg-white/[0.03] border-white/[0.08] text-white placeholder-slate-500 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-0 focus-visible:border-indigo-500"
                />
              </div>
            </div>

            {/* Organisation Name */}
            <div className="space-y-1.5">
              <Label htmlFor="org_name" className="text-slate-300 text-xs font-semibold">Organisation Name</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-4 w-4 text-slate-500" />
                </div>
                <Input 
                  id="org_name" 
                  type="text" 
                  placeholder="Acme Corp" 
                  {...register("org_name")} 
                  error={errors.org_name?.message}
                  className="pl-10 bg-white/[0.03] border-white/[0.08] text-white placeholder-slate-500 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-0 focus-visible:border-indigo-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full mt-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/25 border-0 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200" 
              loading={loading}
            >
              <span className="flex items-center justify-center gap-2">
                Create Account
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>

            {/* Footer */}
            <p className="text-center text-xs text-slate-500 pt-2 border-t border-white/[0.05]">
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline transition-colors">
                Sign in
              </Link>
            </p>
          </form>

        </div>
      </div>

    </div>
  );
}
