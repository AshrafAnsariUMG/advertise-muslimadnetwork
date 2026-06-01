'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  MoreHorizontal,
  RefreshCcw,
  Search,
  Send,
  TrendingUp,
  X,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { adminApiCall } from '@/lib/admin-auth';
import {
  STATUS_BADGE as STAGE_BADGE,
  STATUS_LABEL as STAGE_LABEL,
} from '@/lib/statuses';

const STAGE_OPTIONS = [
  { value: 'incomplete_step_1', label: 'Step 1 (business)' },
  { value: 'incomplete_step_2', label: 'Step 2 (campaign)' },
  { value: 'incomplete_step_3', label: 'Step 3 (review)' },
];

const AGE_OPTIONS = [
  { value: 1, label: '> 1 hour' },
  { value: 24, label: '> 24 hours' },
  { value: 48, label: '> 48 hours' },
  { value: 168, label: '> 7 days' },
];

const PER_PAGE = 15;
const DEBOUNCE_MS = 300;

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function fmtMoney(v) {
  const n = Number(v || 0);
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function fmtAge(hours) {
  if (hours == null) return '—';
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : DATE_FMT.format(d);
}

function StageBadge({ stage }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
        STAGE_BADGE[stage] || 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      {STAGE_LABEL[stage] || stage}
    </span>
  );
}

function CheckMark({ on, date }) {
  if (!on) return <span className="text-slate-400">—</span>;
  return (
    <span className="text-emerald-600 text-sm font-medium" title={fmtDate(date)}>
      ✓
    </span>
  );
}

export default function AdminAbandonedPage() {
  // Filter state
  const [stages, setStages] = useState([
    'incomplete_step_1',
    'incomplete_step_2',
    'incomplete_step_3',
  ]);
  const [minAge, setMinAge] = useState(24);
  const [hasEmail, setHasEmail] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState('created_at');
  const [direction, setDirection] = useState('asc'); // oldest first by default
  const [page, setPage] = useState(1);

  // Server state
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Detail sheet
  const [openSheetId, setOpenSheetId] = useState(null);

  // Bulk confirm dialog
  const [bulkAction, setBulkAction] = useState(null); // 'send' | 'push' | null
  const [bulkForce, setBulkForce] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Debounced search
  const debounceRef = useRef(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, DEBOUNCE_MS);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [search]);

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [stages, minAge, hasEmail, sort, direction]);

  const queryString = useMemo(() => {
    const qs = new URLSearchParams();
    if (stages.length > 0) qs.set('stage', stages.join(','));
    qs.set('min_age_hours', String(minAge));
    qs.set('has_email', hasEmail ? 'true' : 'false');
    if (debouncedSearch) qs.set('search', debouncedSearch);
    qs.set('sort', sort);
    qs.set('direction', direction);
    qs.set('page', String(page));
    return qs.toString();
  }, [stages, minAge, hasEmail, debouncedSearch, sort, direction, page]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminApiCall(`/api/admin/abandoned?${queryString}`);
      setData(result);
    } catch (err) {
      if (err?.status !== 401) {
        setError(err?.message || 'Failed to load abandoned drafts');
      }
    } finally {
      setIsLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStage = (value) => {
    setStages((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const clearFilters = () => {
    setStages(['incomplete_step_1', 'incomplete_step_2', 'incomplete_step_3']);
    setMinAge(24);
    setHasEmail(true);
    setSearch('');
    setSort('created_at');
    setDirection('asc');
  };

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
  const summary = data?.summary;

  const pageIds = rows.map((r) => r.id);
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const someOnPageSelected =
    pageIds.some((id) => selectedIds.has(id)) && !allOnPageSelected;

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Single-record action
  const runSingle = async (id, action) => {
    try {
      const path =
        action === 'send'
          ? `/api/admin/abandoned/${id}/send-recovery`
          : `/api/admin/abandoned/${id}/push-pipedrive`;
      const result = await adminApiCall(path, { method: 'POST' });
      const verb = action === 'send' ? 'Recovery email dispatched' : 'Pipedrive push queued';
      toast.success(`${verb}.`);
      await load();
      return result;
    } catch (err) {
      if (err?.status === 409) {
        toast.error(err.message || 'Already done — use bulk with Force to re-run.');
      } else {
        toast.error(err?.message || 'Action failed.');
      }
    }
  };

  // Bulk action — selectedIds + force flag
  const runBulk = async () => {
    if (!bulkAction || selectedIds.size === 0) return;
    setBulkSubmitting(true);
    const ids = Array.from(selectedIds);

    try {
      const path =
        bulkAction === 'send'
          ? '/api/admin/abandoned/bulk-send-recovery'
          : '/api/admin/abandoned/bulk-push-pipedrive';

      const result = await adminApiCall(path, {
        method: 'POST',
        body: { ids, force: bulkForce },
      });
      toast.success(
        `Dispatched ${result.dispatched}, skipped ${result.skipped} (of ${result.total}).`
      );
      setBulkAction(null);
      setBulkForce(false);
      setSelectedIds(new Set());
      await load();
    } catch (err) {
      toast.error(err?.message || 'Bulk action failed.');
    } finally {
      setBulkSubmitting(false);
    }
  };

  // Compute bulk preview counts before the user clicks confirm
  const bulkPreview = useMemo(() => {
    if (!bulkAction || selectedIds.size === 0) return null;
    const selected = rows.filter((r) => selectedIds.has(r.id));
    const already = selected.filter((r) =>
      bulkAction === 'send' ? r.recovery_email_sent : r.pushed_to_pipedrive
    ).length;
    const noEmail = selected.filter((r) => !r.contact_email).length;
    return {
      total: selected.length,
      already,
      noEmail,
      willDispatch: bulkForce
        ? selected.length - noEmail
        : selected.length - already - noEmail,
    };
  }, [bulkAction, selectedIds, rows, bulkForce]);

  const detailRow = openSheetId
    ? rows.find((r) => r.id === openSheetId) || null
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Abandoned carts</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Recover drafts that never completed checkout.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
          <RefreshCcw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label="Abandoned"
          value={summary ? summary.total_count.toLocaleString() : '—'}
        />
        <StatTile
          label="Potential revenue"
          value={summary ? fmtMoney(summary.total_potential) : '—'}
          icon={<TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
        />
        <StatTile
          label="Emailed"
          value={
            summary
              ? `${summary.emailed_count} (${
                  summary.total_count
                    ? Math.round((summary.emailed_count / summary.total_count) * 100)
                    : 0
                }%)`
              : '—'
          }
        />
        <StatTile
          label="Pushed to Pipedrive"
          value={
            summary
              ? `${summary.pipedrive_pushed_count} (${
                  summary.total_count
                    ? Math.round(
                        (summary.pipedrive_pushed_count / summary.total_count) * 100
                      )
                    : 0
                }%)`
              : '—'
          }
        />
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="pt-6 pb-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <Input
                  placeholder="Business, contact name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Minimum age</Label>
              <Select
                value={String(minAge)}
                onValueChange={(v) => setMinAge(parseInt(v, 10))}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Sort</Label>
              <Select
                value={`${sort}:${direction}`}
                onValueChange={(v) => {
                  const [s, d] = v.split(':');
                  setSort(s);
                  setDirection(d);
                }}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at:asc">Oldest first</SelectItem>
                  <SelectItem value="created_at:desc">Newest first</SelectItem>
                  <SelectItem value="monthly_budget:desc">Highest budget</SelectItem>
                  <SelectItem value="recovery_email_sent_date:desc">Recently emailed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">&nbsp;</Label>
              <label className="flex items-center gap-2 h-9 cursor-pointer">
                <Checkbox
                  checked={hasEmail}
                  onCheckedChange={(v) => setHasEmail(!!v)}
                />
                <span className="text-xs text-slate-700">
                  Has contact email
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-xs text-slate-500 mr-1">Stages:</Label>
            {STAGE_OPTIONS.map((opt) => {
              const active = stages.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleStage(opt.value)}
                  className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-xs h-8">
              <X className="w-3.5 h-3.5 mr-1" />
              Clear filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading && !data ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 text-indigo-600 mx-auto animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No abandoned drafts match your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">
                      <Checkbox
                        checked={
                          allOnPageSelected
                            ? true
                            : someOnPageSelected
                            ? 'indeterminate'
                            : false
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Step</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Potential</TableHead>
                    <TableHead className="text-center">Emailed</TableHead>
                    <TableHead className="text-center">Pipedrive</TableHead>
                    <TableHead className="w-12 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const isSelected = selectedIds.has(row.id);
                    return (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer"
                        data-state={isSelected ? 'selected' : undefined}
                        onClick={(e) => {
                          if (e.target.closest('[data-row-action]')) return;
                          setOpenSheetId(row.id);
                        }}
                      >
                        <TableCell data-row-action="true">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelected(row.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">
                          {row.business_name || (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          <div>{row.contact_name || '—'}</div>
                          <div className="text-xs text-slate-500">
                            {row.contact_email || '(no email)'}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {row.campaign_name || '—'}
                        </TableCell>
                        <TableCell>
                          <StageBadge stage={row.status} />
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs">
                          {fmtAge(row.age_hours)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {row.potential_total != null ? fmtMoney(row.potential_total) : '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <CheckMark
                            on={row.recovery_email_sent}
                            date={row.recovery_email_sent_date}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <CheckMark on={row.pushed_to_pipedrive} />
                        </TableCell>
                        <TableCell className="text-right" data-row-action="true">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => setOpenSheetId(row.id)}>
                                View detail
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={
                                  row.recovery_email_sent || !row.contact_email
                                }
                                onSelect={() => runSingle(row.id, 'send')}
                              >
                                <Mail className="w-3.5 h-3.5 mr-2" />
                                Send recovery email
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={row.pushed_to_pipedrive}
                                onSelect={() => runSingle(row.id, 'push')}
                              >
                                <Send className="w-3.5 h-3.5 mr-2" />
                                Push to Pipedrive
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
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

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-full shadow-2xl px-5 py-2.5 flex items-center gap-3 z-40">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <span className="h-4 w-px bg-slate-700" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBulkAction('send')}
            className="text-white hover:bg-slate-800 hover:text-white h-8"
          >
            <Mail className="w-3.5 h-3.5 mr-1.5" />
            Send recovery
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBulkAction('push')}
            className="text-white hover:bg-slate-800 hover:text-white h-8"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Push to Pipedrive
          </Button>
          <span className="h-4 w-px bg-slate-700" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
            className="text-slate-300 hover:bg-slate-800 hover:text-white h-8"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Detail sheet */}
      <Sheet
        open={!!openSheetId}
        onOpenChange={(o) => !o && setOpenSheetId(null)}
      >
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
          <SheetHeader className="p-6 pb-3 border-b border-slate-100">
            <SheetTitle>
              {detailRow?.business_name || 'Abandoned draft'}
            </SheetTitle>
            {detailRow && (
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                <StageBadge stage={detailRow.status} />
                <span>·</span>
                <span>{fmtAge(detailRow.age_hours)} old</span>
                <span>·</span>
                <span>{fmtDate(detailRow.created_at)}</span>
              </div>
            )}
          </SheetHeader>
          {detailRow && (
            <div className="p-6 space-y-5">
              <Section title="Contact">
                <Field label="Name" value={detailRow.contact_name} />
                <Field label="Email" value={detailRow.contact_email} />
                <Field label="Phone" value={detailRow.contact_phone} />
              </Section>

              <Section title="Campaign">
                <Field label="Name" value={detailRow.campaign_name} />
                <Field
                  label="Budget"
                  value={
                    detailRow.monthly_budget != null
                      ? `${fmtMoney(detailRow.monthly_budget)} / mo`
                      : '—'
                  }
                />
                <Field
                  label="Design service"
                  value={detailRow.design_service ? 'Yes (+$200)' : 'No'}
                />
                <Field
                  label="Potential total"
                  value={
                    detailRow.potential_total != null
                      ? fmtMoney(detailRow.potential_total)
                      : '—'
                  }
                />
              </Section>

              <Section title="Recovery history">
                <Field
                  label="Email sent"
                  value={
                    detailRow.recovery_email_sent
                      ? fmtDate(detailRow.recovery_email_sent_date)
                      : 'Not sent'
                  }
                />
                <Field
                  label="Pipedrive push"
                  value={
                    detailRow.pushed_to_pipedrive
                      ? 'Pushed'
                      : 'Not pushed'
                  }
                />
              </Section>

              <div className="-mx-6 -mb-6 px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  disabled={
                    !detailRow.contact_email || detailRow.recovery_email_sent
                  }
                  onClick={() => runSingle(detailRow.id, 'send')}
                >
                  <Mail className="w-3.5 h-3.5 mr-1.5" />
                  Send recovery
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={detailRow.pushed_to_pipedrive}
                  onClick={() => runSingle(detailRow.id, 'push')}
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Push to Pipedrive
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Bulk confirmation dialog */}
      <Dialog
        open={!!bulkAction}
        onOpenChange={(o) => {
          if (!o) {
            setBulkAction(null);
            setBulkForce(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === 'send'
                ? 'Send recovery email'
                : 'Push to Pipedrive'}
            </DialogTitle>
            <DialogDescription>
              {bulkPreview && (
                <>
                  {bulkPreview.total} selected.{' '}
                  {bulkPreview.already > 0 && (
                    <>
                      <strong>{bulkPreview.already}</strong> already{' '}
                      {bulkAction === 'send' ? 'received this email' : 'pushed'} —
                      will be skipped unless you check Force below.{' '}
                    </>
                  )}
                  {bulkPreview.noEmail > 0 && bulkAction === 'send' && (
                    <>
                      <strong>{bulkPreview.noEmail}</strong> have no contact
                      email and will be skipped.{' '}
                    </>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {bulkPreview && (
              <div className="text-sm bg-slate-50 border border-slate-200 rounded px-3 py-2">
                Will dispatch:{' '}
                <strong>{Math.max(0, bulkPreview.willDispatch)}</strong>
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={bulkForce}
                onCheckedChange={(v) => setBulkForce(!!v)}
              />
              <span className="text-sm">
                Force —{' '}
                {bulkAction === 'send'
                  ? 're-send to advertisers already emailed'
                  : 're-push advertisers already in Pipedrive (creates a new deal)'}
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBulkAction(null);
                setBulkForce(false);
              }}
              disabled={bulkSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={runBulk}
              disabled={bulkSubmitting || !bulkPreview || bulkPreview.willDispatch <= 0}
            >
              {bulkSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Dispatching…
                </>
              ) : (
                'Dispatch'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatTile({ label, value, icon }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-1.5">
        {icon}
        <div className="text-xs uppercase tracking-wide text-slate-500 font-medium">
          {label}
        </div>
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h3 className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">{children}</div>
    </section>
  );
}

function Field({ label, value, wide }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm text-slate-900">{value || '—'}</div>
    </div>
  );
}
