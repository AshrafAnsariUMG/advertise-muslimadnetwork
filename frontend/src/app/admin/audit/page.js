'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCcw,
  Search,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { adminApiCall } from '@/lib/admin-auth';

const TARGET_TYPES = [
  { value: 'all', label: 'All targets' },
  { value: 'Advertiser', label: 'Advertiser' },
  { value: 'User', label: 'User' },
  { value: 'system', label: 'System (no target)' },
];

const DATETIME_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
});

function relativeTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return DATETIME_FMT.format(d);
}

function fullTimestamp(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return DATETIME_FMT.format(d);
}

function ChangesCell({ changes, expanded, onToggle }) {
  if (!changes || (typeof changes === 'object' && Object.keys(changes).length === 0)) {
    return <span className="text-slate-400">—</span>;
  }

  // Smart render for status transitions (the common case)
  const before = changes.before;
  const after = changes.after;
  if (before?.status && after?.status) {
    const reasonNote = changes.reason ? (
      <div className="text-xs text-slate-500 mt-0.5 italic">
        “{changes.reason}”
      </div>
    ) : null;
    return (
      <div>
        <span className="font-mono text-xs">
          <span className="text-slate-500">{before.status}</span>
          <span className="mx-1.5 text-slate-400">→</span>
          <span className="text-slate-900 font-medium">{after.status}</span>
        </span>
        {reasonNote}
      </div>
    );
  }

  if (changes.attempted_email) {
    return (
      <span className="text-xs">
        Email: <span className="font-mono">{changes.attempted_email}</span>
      </span>
    );
  }

  if (changes.attempted_role) {
    return (
      <span className="text-xs">
        Role: <span className="font-mono">{changes.attempted_role}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-xs text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
    >
      <ChevronDown
        className={`w-3 h-3 transition-transform ${
          expanded ? 'rotate-180' : ''
        }`}
      />
      {expanded ? 'Hide JSON' : '(see details)'}
    </button>
  );
}

const PER_PAGE = 25;
const DEBOUNCE_MS = 300;

export default function AdminAuditPage() {
  const [actionFilter, setActionFilter] = useState('');
  const [debouncedAction, setDebouncedAction] = useState('');
  const [targetType, setTargetType] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});

  const debounceRef = useRef(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedAction(actionFilter);
      setPage(1);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [actionFilter]);

  useEffect(() => {
    setPage(1);
  }, [targetType, fromDate, toDate]);

  const queryString = useMemo(() => {
    const qs = new URLSearchParams();
    if (debouncedAction) qs.set('action', debouncedAction);
    if (targetType && targetType !== 'all') qs.set('target_type', targetType);
    if (fromDate) qs.set('from_date', fromDate);
    if (toDate) qs.set('to_date', toDate);
    qs.set('page', String(page));
    return qs.toString();
  }, [debouncedAction, targetType, fromDate, toDate, page]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminApiCall(`/api/admin/audit-logs?${queryString}`);
      setData(result);
    } catch (err) {
      if (err?.status !== 401) {
        setError(err?.message || 'Failed to load audit log');
      }
    } finally {
      setIsLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = data?.data || [];
  const meta = data
    ? {
        currentPage: data.current_page,
        lastPage: data.last_page,
        total: data.total,
        from: data.from,
        to: data.to,
      }
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit log</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Append-only history of admin actions.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
          <RefreshCcw
            className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Action</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <Input
                  placeholder="e.g. advertiser.* or approve"
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Trailing <code>*</code> = prefix match
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Target type</Label>
              <Select items={TARGET_TYPES} value={targetType} onValueChange={setTargetType}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">From</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">To</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          {isLoading && !data ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 text-indigo-600 mx-auto animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No audit entries match your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">When</TableHead>
                    <TableHead>Who</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead className="w-28">IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const isExpanded = !!expanded[row.id];
                    return (
                      <>
                        <TableRow key={row.id}>
                          <TableCell
                            className="text-xs text-slate-500"
                            title={fullTimestamp(row.created_at)}
                          >
                            {relativeTime(row.created_at)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-700">
                            {row.user?.email || (
                              <span className="text-slate-400 italic">system</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs font-mono">
                              {row.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {row.target_type === 'system' ? (
                              <span className="text-slate-400">—</span>
                            ) : (
                              <div>
                                <div className="font-medium">{row.target_type}</div>
                                <div className="font-mono text-[10px] text-slate-400">
                                  {String(row.target_id).slice(0, 8)}…
                                </div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <ChangesCell
                              changes={row.changes}
                              expanded={isExpanded}
                              onToggle={() =>
                                setExpanded((prev) => ({
                                  ...prev,
                                  [row.id]: !prev[row.id],
                                }))
                              }
                            />
                          </TableCell>
                          <TableCell className="text-xs font-mono text-slate-500">
                            {row.ip_address || '—'}
                          </TableCell>
                        </TableRow>
                        {isExpanded && row.changes && (
                          <TableRow
                            key={`${row.id}-expanded`}
                            className="bg-slate-50/50"
                          >
                            <TableCell colSpan={6}>
                              <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap p-3 bg-white border border-slate-200 rounded">
                                {JSON.stringify(row.changes, null, 2)}
                              </pre>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {meta && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                {meta.total > 0 ? (
                  <>
                    Showing <span className="font-medium">{meta.from}</span>–
                    <span className="font-medium">{meta.to}</span> of{' '}
                    <span className="font-medium">{meta.total}</span>
                  </>
                ) : (
                  '—'
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span className="text-xs text-slate-500">
                  Page {meta.currentPage} / {meta.lastPage || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.currentPage >= meta.lastPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
