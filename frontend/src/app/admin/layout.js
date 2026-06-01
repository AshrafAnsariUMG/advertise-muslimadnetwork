'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminAuthProvider, useAdminAuth } from '@/context/AdminAuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Auth-aware nav. The route guard lives here so every /admin/* page
 * inherits it for free.
 *  - Unauthenticated AND not on /admin/login → /admin/login
 *  - Authenticated AND on /admin/login → /admin
 *  - Otherwise: render the page
 */
function AdminShell({ children }) {
  const { user, isLoading, logout } = useAdminAuth();
  const pathname = usePathname() || '';
  const router = useRouter();
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoading) return;
    if (!user && !isLoginPage) {
      router.replace('/admin/login');
    } else if (user && isLoginPage) {
      router.replace('/admin');
    }
  }, [user, isLoading, isLoginPage, router]);

  // While hydrating we deliberately render nothing so a flash of the
  // wrong page doesn't appear before the redirect fires.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // Login page renders without the nav chrome.
  if (isLoginPage) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  // Not logged in → already redirecting; render nothing.
  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <div className="font-semibold text-slate-900">
              Muslim Ad Network
              <span className="ml-2 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Admin
              </span>
            </div>
            <nav className="flex items-center gap-1">
              <NavLink href="/admin" pathname={pathname}>
                Dashboard
              </NavLink>
              <NavLink href="/admin/review" pathname={pathname}>
                Review
              </NavLink>
              <NavLink href="/admin/abandoned" pathname={pathname}>
                Abandoned
              </NavLink>
              <NavLink href="/admin/audit" pathname={pathname}>
                Audit
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/admin/profile"
              className="text-xs text-slate-500 hover:text-indigo-600 hidden sm:inline transition-colors"
              title="Profile & password"
            >
              {user.email}
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, children, pathname }) {
  const isActive = pathname === href;
  return (
    <a
      href={href}
      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
        isActive
          ? 'bg-indigo-50 text-indigo-700 font-medium'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
      }`}
    >
      {children}
    </a>
  );
}

function DisabledNavLink({ label, tooltip }) {
  return (
    <TooltipProvider delay={150}>
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="px-3 py-1.5 text-sm rounded-md text-slate-400 cursor-not-allowed select-none" />
          }
        >
          {label}
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function AdminLayout({ children }) {
  return (
    <AdminAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAuthProvider>
  );
}
