'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApiCall } from '@/lib/admin-auth';
import { STATUS_LABEL as STATUS_LABELS, PAYMENT_LABELS } from '@/lib/statuses';

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});
const FULL_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function formatMoney(value) {
  const n = Number(value || 0);
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatShortDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return DATE_FMT.format(d);
}

function formatTimestamp(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return FULL_FMT.format(d);
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminApiCall('/api/admin/dashboard/metrics');
      setData(result);
    } catch (err) {
      // 401 is already handled by adminApiCall (redirects to /admin/login);
      // surface anything else inline.
      if (err?.status !== 401) {
        setError(err?.message || 'Failed to load metrics');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading && !data) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-3">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCcw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) return null;

  const {
    totals,
    abandoned,
    status_breakdown: statusBreakdown,
    signups_last_30_days: signups,
    payment_method_breakdown: paymentBreakdown,
    recent_submissions: recent,
  } = data;

  const signupsForChart = signups.map((row) => ({
    ...row,
    label: formatShortDate(row.date),
  }));

  const statusForChart = statusBreakdown.map((row) => ({
    name: STATUS_LABELS[row.status] || row.status,
    count: row.count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Submissions, revenue, and recent activity at a glance.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
          <RefreshCcw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Row 1 — Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Advertisers"
          value={totals.all.toLocaleString()}
        />
        <StatCard
          label="Paid"
          value={totals.paid.toLocaleString()}
          subline={`${formatMoney(totals.total_revenue)} total revenue`}
        />
        <StatCard
          label="Pending Review"
          value={totals.pending_review.toLocaleString()}
        />
        <StatCard
          label="Abandoned (24h+)"
          value={abandoned.count.toLocaleString()}
          subline={`${formatMoney(abandoned.sum_potential)} potential revenue`}
          tone="amber"
        />
      </div>

      {/* Row 2 — Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signups — Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={signupsForChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                />
                <RechartsTooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {statusForChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                No submissions yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusForChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-12}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3 — Recent submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="text-sm text-slate-500 py-8 text-center">
              No paid submissions yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                    <th className="py-2 pr-4 font-medium">Business</th>
                    <th className="py-2 pr-4 font-medium">Contact</th>
                    <th className="py-2 pr-4 font-medium">Campaign</th>
                    <th className="py-2 pr-4 font-medium">Total</th>
                    <th className="py-2 pr-4 font-medium">Method</th>
                    <th className="py-2 pr-4 font-medium">Submitted</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-2.5 pr-4 font-medium text-slate-900">
                        {row.business_name || '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600">
                        {row.contact_email || '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600">
                        {row.campaign_name || '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-900 font-medium">
                        {formatMoney(row.total)}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600">
                        {PAYMENT_LABELS[row.payment_method] || row.payment_method || '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-slate-500">
                        {formatTimestamp(row.updated_at || row.created_at)}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge variant="secondary" className="text-xs">
                          {STATUS_LABELS[row.status] || row.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 text-xs text-slate-400 text-center">
            Full review queue available in S10.
          </div>

          {Object.keys(paymentBreakdown || {}).length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="font-medium uppercase tracking-wide">
                Paid by method:
              </span>
              {Object.entries(paymentBreakdown).map(([method, count]) => (
                <span key={method}>
                  {PAYMENT_LABELS[method] || method}:{' '}
                  <span className="text-slate-900 font-medium">{count}</span>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, subline, tone = 'default' }) {
  const toneClasses =
    tone === 'amber'
      ? 'border-amber-200 bg-amber-50'
      : 'border-slate-200 bg-white';
  return (
    <div className={`rounded-lg border ${toneClasses} p-4`}>
      <div className="text-xs uppercase tracking-wide text-slate-500 font-medium">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
      {subline && (
        <div className="mt-1 text-xs text-slate-500">{subline}</div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-lg border border-slate-200 bg-slate-50 animate-pulse"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-80 rounded-lg border border-slate-200 bg-slate-50 animate-pulse" />
        <div className="h-80 rounded-lg border border-slate-200 bg-slate-50 animate-pulse" />
      </div>
      <div className="h-48 rounded-lg border border-slate-200 bg-slate-50 animate-pulse" />
    </div>
  );
}
