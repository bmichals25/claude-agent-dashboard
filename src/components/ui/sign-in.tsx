import React, { useState } from 'react';
import { Eye, EyeOff, Github } from 'lucide-react';

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
  </svg>
);

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  subtitle?: string;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  mode?: 'login' | 'signup';
  isLoading?: boolean;
  isDemoLoading?: boolean;
  error?: string | null;
  success?: string | null;
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onGitHubSignIn?: () => void;
  onDemoSignIn?: () => void;
  onResetPassword?: () => void;
  onToggleMode?: () => void;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border border-[var(--glass-border)] bg-white/[0.03] backdrop-blur-sm transition-all duration-200 focus-within:border-[var(--accent)]/50 focus-within:bg-[var(--accent)]/5 focus-within:shadow-[0_0_0_3px_rgba(255,107,53,0.1)]">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial; delay: string }) => (
  <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-4 w-56`}>
    <img src={testimonial.avatarSrc} className="h-9 w-9 object-cover rounded-xl" alt="avatar" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium text-[var(--text-main)]">{testimonial.name}</p>
      <p className="text-[var(--text-dim)] text-xs">{testimonial.handle}</p>
      <p className="mt-1 text-[var(--text-secondary)] text-xs">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="text-[var(--text-main)]">Welcome Back</span>,
  subtitle,
  description = "Access your account and continue your journey",
  heroImageSrc,
  testimonials = [],
  mode = 'login',
  isLoading = false,
  isDemoLoading = false,
  error,
  success,
  onSignIn,
  onGoogleSignIn,
  onGitHubSignIn,
  onDemoSignIn,
  onResetPassword,
  onToggleMode,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row w-[100dvw] bg-[var(--bg)]">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8 relative">
        {/* Background gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent)]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[var(--accent-tertiary)]/5 rounded-full blur-[100px]" />
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="flex flex-col gap-5">
            {/* Logo */}
            <div className="animate-element animate-delay-100 flex justify-center mb-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/25">
                <svg className="w-7 h-7 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
            </div>

            <div className="text-center">
              <h1 className="animate-element animate-delay-100 text-3xl md:text-4xl font-semibold leading-tight tracking-tight">{title}</h1>
              {subtitle && <p className="animate-element animate-delay-150 text-[var(--text-dim)] mt-1">{subtitle}</p>}
              <p className="animate-element animate-delay-200 text-[var(--text-secondary)] mt-2">{description}</p>
            </div>

            {/* Demo Button */}
            {onDemoSignIn && (
              <button
                type="button"
                onClick={onDemoSignIn}
                disabled={isDemoLoading}
                className="animate-element animate-delay-250 w-full rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent)]/80 px-8 py-4 font-semibold text-[var(--bg)] hover:from-[var(--accent)]/90 hover:to-[var(--accent)]/70 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-[var(--accent)]/20"
              >
                {isDemoLoading ? (
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    Try Demo Account
                  </>
                )}
              </button>
            )}

            <div className="animate-element animate-delay-300 relative flex items-center justify-center">
              <span className="w-full border-t border-[var(--glass-border)]"></span>
              <span className="px-4 text-sm text-[var(--text-dim)] bg-[var(--bg)] absolute">or continue with</span>
            </div>

            {/* OAuth Buttons */}
            <div className="animate-element animate-delay-350 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={onGoogleSignIn}
                className="flex items-center justify-center gap-3 border border-[var(--glass-border)] rounded-xl px-6 py-4 hover:bg-white/[0.03] hover:border-[var(--glass-border-hover)] transition-all text-[var(--text-secondary)]"
              >
                <GoogleIcon />
                <span className="font-medium">Google</span>
              </button>
              <button
                type="button"
                onClick={onGitHubSignIn}
                className="flex items-center justify-center gap-3 border border-[var(--glass-border)] rounded-xl px-6 py-4 hover:bg-white/[0.03] hover:border-[var(--glass-border-hover)] transition-all text-[var(--text-secondary)]"
              >
                <Github className="w-5 h-5" />
                <span className="font-medium">GitHub</span>
              </button>
            </div>

            <div className="animate-element animate-delay-400 relative flex items-center justify-center">
              <span className="w-full border-t border-[var(--glass-border)]"></span>
              <span className="px-4 text-sm text-[var(--text-dim)] bg-[var(--bg)] absolute">or with email</span>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="animate-element p-3 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-xl text-[var(--error)] text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="animate-element p-3 bg-[var(--success)]/10 border border-[var(--success)]/30 rounded-xl text-[var(--success)] text-sm">
                {success}
              </div>
            )}

            <form className="space-y-4" onSubmit={onSignIn}>
              <div className="animate-element animate-delay-450">
                <label className="text-sm font-medium text-[var(--text-dim)] mb-2 block">Email</label>
                <GlassInputWrapper>
                  <input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="w-full bg-transparent text-sm px-4 py-4 rounded-xl focus:outline-none text-[var(--text-main)] placeholder-[var(--text-muted)]"
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500">
                <label className="text-sm font-medium text-[var(--text-dim)] mb-2 block">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      required
                      minLength={6}
                      className="w-full bg-transparent text-sm px-4 py-4 pr-12 rounded-xl focus:outline-none text-[var(--text-main)] placeholder-[var(--text-muted)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-[var(--text-dim)] hover:text-[var(--text-secondary)] transition-colors" />
                      ) : (
                        <Eye className="w-5 h-5 text-[var(--text-dim)] hover:text-[var(--text-secondary)] transition-colors" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              {mode === 'login' && onResetPassword && (
                <div className="animate-element animate-delay-550 flex items-center justify-end text-sm">
                  <button
                    type="button"
                    onClick={onResetPassword}
                    className="hover:underline text-[var(--accent)] transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="animate-element animate-delay-600 w-full rounded-xl bg-white/5 border border-[var(--glass-border)] px-8 py-4 font-medium text-[var(--text-main)] hover:bg-white/10 hover:border-[var(--glass-border-hover)] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                  </>
                )}
              </button>
            </form>

            <p className="animate-element animate-delay-700 text-center text-sm text-[var(--text-dim)]">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={onToggleMode}
                className="ml-1 text-[var(--accent)] hover:underline transition-colors font-medium"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div
            className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImageSrc})` }}
          >
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 rounded-3xl" />
          </div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 px-8 w-full justify-center">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
              {testimonials[1] && (
                <div className="hidden xl:flex">
                  <TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" />
                </div>
              )}
              {testimonials[2] && (
                <div className="hidden 2xl:flex">
                  <TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" />
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
