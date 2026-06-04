'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  MoreHorizontal,
  RefreshCcw,
  Search,
  X,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { adminApiCall, adminDownload } from '@/lib/admin-auth';
import { ApiError } from '@/lib/api';
import {
  STATUS_BADGE,
  STATUS_LABEL,
  ALLOWED_ACTIONS,
  ACTION_LABEL,
} from '@/lib/statuses';

const STATUS_OPTIONS = [
  { value: 'pending_review', label: 'Pending review' },
  { value: 'approved', label: 'Approved' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'incomplete_step_3', label: 'Abandoned (step 3)' },
  { value: 'incomplete_step_2', label: 'Abandoned (step 2)' },
  { value: 'incomplete_step_1', label: 'Abandoned (step 1)' },
];

const PAYMENT_METHODS = [
  { value: 'all', label: 'All methods' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'paypal', label: 'PayPal' },
];

const PER_PAGE = 15;
const DEBOUNCE_MS = 300;

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const DATETIME_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function fmtDate(iso, full = false) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return (full ? DATETIME_FMT : DATE_FMT).format(d);
}

function fmtMoney(value) {
  const n = Number(value || 0);
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function StatusBadge({ status }) {
  if (!status) return <Badge variant="outline">unknown</Badge>;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
        STATUS_BADGE[status] || 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      {STATUS_LABEL[status] || status}
    </span>
  );
}

export default function AdminReviewPage() {
  // Filter state
  const [statuses, setStatuses] = useState(['pending_review']);
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('created_at');
  const [direction, setDirection] = useState('desc');

  // Server state
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detail sheet
  const [openSheetId, setOpenSheetId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [auditEntries, setAuditEntries] = useState([]);

  // Reject modal — rejectFor is either an advertiser row, or the sentinel
  // '__bulk__' when rejecting the current multi-selection.
  const [rejectFor, setRejectFor] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Search debounce
  const debounceRef = useRef(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Reset page + clear selection when filters change
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [statuses, paymentMethod, fromDate, toDate, sort, direction]);

  // Build query string for the list endpoint
  const queryString = useMemo(() => {
    const qs = new URLSearchParams();
    if (statuses.length > 0) qs.set('status', statuses.join(','));
    if (paymentMethod && paymentMethod !== 'all') qs.set('payment_method', paymentMethod);
    if (debouncedSearch) qs.set('search', debouncedSearch);
    if (fromDate) qs.set('from_date', fromDate);
    if (toDate) qs.set('to_date', toDate);
    qs.set('sort', sort);
    qs.set('direction', direction);
    qs.set('page', String(page));
    return qs.toString();
  }, [statuses, paymentMethod, debouncedSearch, fromDate, toDate, sort, direction, page]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminApiCall(`/api/admin/advertisers?${queryString}`);
      setData(result);
    } catch (err) {
      if (err?.status !== 401) {
        setError(err?.message || 'Failed to load advertisers');
      }
    } finally {
      setIsLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    load();
  }, [load]);

  // Detail sheet — fetch full record + audit trail when opened
  useEffect(() => {
    if (!openSheetId) {
      setDetail(null);
      setAuditEntries([]);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    (async () => {
      try {
        const [full, audit] = await Promise.all([
          adminApiCall(`/api/admin/advertisers/${openSheetId}`),
          adminApiCall(
            `/api/admin/audit-logs?target_type=Advertiser&target_id=${openSheetId}`
          ),
        ]);
        if (cancelled) return;
        setDetail(full);
        setAuditEntries((audit?.data || []).slice(0, 10));
      } catch (err) {
        if (err?.status !== 401) {
          toast.error(err?.message || 'Failed to load advertiser detail');
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [openSheetId]);

  // Toggle a status filter checkbox
  const toggleStatus = (value) => {
    setStatuses((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const clearFilters = () => {
    setStatuses(['pending_review']);
    setPaymentMethod('all');
    setSearch('');
    setFromDate('');
    setToDate('');
    setSort('created_at');
    setDirection('desc');
  };

  // Run a transition action against the API
  const runAction = async (id, action, body = {}) => {
    try {
      const updated = await adminApiCall(
        `/api/admin/advertisers/${id}/${action}`,
        { method: 'POST', body }
      );
      toast.success(`${ACTION_LABEL[action] || action}d.`);
      // Refresh the list + the open detail sheet if any
      await load();
      if (openSheetId === id) {
        setDetail((prev) => (prev ? { ...prev, ...updated } : prev));
        // Reload audit trail to reflect the new entry
        const audit = await adminApiCall(
          `/api/admin/audit-logs?target_type=Advertiser&target_id=${id}`
        );
        setAuditEntries((audit?.data || []).slice(0, 10));
      }
      return updated;
    } catch (err) {
      if (err?.status === 409) {
        toast.error(err.message || 'Status transition not allowed.');
      } else if (err instanceof ApiError && err.errors) {
        const first = Object.values(err.errors)[0]?.[0];
        toast.error(first || err.message);
      } else {
        toast.error(err?.message || 'Action failed.');
      }
      throw err;
    }
  };

  const handleReject = async () => {
    if (!rejectFor || rejectReason.trim().length < 3) return;
    setRejectSubmitting(true);
    try {
      if (rejectFor === '__bulk__') {
        const result = await adminApiCall(
          '/api/admin/advertisers/bulk-reject',
          { method: 'POST', body: { ids: Array.from(selectedIds), reason: rejectReason.trim() } }
        );
        toast.success(`Rejected ${result.rejected}, skipped ${result.skipped}.`);
        setSelectedIds(new Set());
        await load();
      } else {
        await runAction(rejectFor.id, 'reject', { reason: rejectReason.trim() });
      }
      setRejectFor(null);
      setRejectReason('');
    } catch (err) {
      if (rejectFor === '__bulk__') {
        toast.error(err?.message || 'Bulk reject failed.');
      }
      // single-reject toast already shown by runAction
    } finally {
      setRejectSubmitting(false);
    }
  };

  // Bulk approve the current selection
  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setBulkSubmitting(true);
    try {
      const result = await adminApiCall('/api/admin/advertisers/bulk-approve', {
        method: 'POST',
        body: { ids: Array.from(selectedIds) },
      });
      toast.success(`Approved ${result.approved}, skipped ${result.skipped}.`);
      setSelectedIds(new Set());
      await load();
    } catch (err) {
      toast.error(err?.message || 'Bulk approve failed.');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Export the current filtered set (not just the page) as CSV
  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    try {
      const qs = new URLSearchParams();
      if (statuses.length > 0) qs.set('status', statuses.join(','));
      if (paymentMethod && paymentMethod !== 'all') qs.set('payment_method', paymentMethod);
      if (debouncedSearch) qs.set('search', debouncedSearch);
      if (fromDate) qs.set('from_date', fromDate);
      if (toDate) qs.set('to_date', toDate);
      const stamp = new Date().toISOString().slice(0, 10);
      await adminDownload(`/api/admin/advertisers/export?${qs.toString()}`, `advertisers-${stamp}.csv`);
    } catch (err) {
      toast.error(err?.message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  // Click a sortable header
  const onSort = (column) => {
    if (sort === column) {
      setDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(column);
      setDirection('desc');
    }
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

  // Only pending_review rows are bulk-actionable (the only status from which
  // both approve and reject are valid). Select-all applies to those only.
  const selectableIds = rows
    .filter((r) => r.status === 'pending_review')
    .map((r) => r.id);
  const allSelectableSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));
  const someSelectableSelected =
    selectableIds.some((id) => selectedIds.has(id)) && !allSelectableSelected;

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelectableSelected) {
        selectableIds.forEach((id) => next.delete(id));
      } else {
        selectableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Review queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Approve, reject, and manage campaign submissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            <Download className={`w-3.5 h-3.5 mr-1.5 ${exporting ? 'animate-pulse' : ''}`} />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
            <RefreshCcw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
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
              <Label className="text-xs">Payment method</Label>
              <Select items={PAYMENT_METHODS} value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
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

          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-xs text-slate-500 mr-1">Statuses:</Label>
            {STATUS_OPTIONS.map((opt) => {
              const active = statuses.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleStatus(opt.value)}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto text-xs h-8"
            >
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
              No advertisers match your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">
                      <Checkbox
                        checked={
                          allSelectableSelected
                            ? true
                            : someSelectableSelected
                            ? 'indeterminate'
                            : false
                        }
                        onCheckedChange={toggleSelectAll}
                        disabled={selectableIds.length === 0}
                      />
                    </TableHead>
                    <SortableTh column="business_name" sort={sort} direction={direction}>
                      Business
                    </SortableTh>
                    <TableHead>Contact</TableHead>
                    <TableHead>Campaign</TableHead>
                    <SortableTh column="monthly_budget" sort={sort} direction={direction} onSort={onSort}>
                      Budget
                    </SortableTh>
                    <TableHead>Total</TableHead>
                    <TableHead>Method</TableHead>
                    <SortableTh column="created_at" sort={sort} direction={direction} onSort={onSort}>
                      Submitted
                    </SortableTh>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const actions = ALLOWED_ACTIONS[row.status] || [];
                    return (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer"
                        data-state={selectedIds.has(row.id) ? 'selected' : undefined}
                        onClick={(e) => {
                          if (e.target.closest('[data-row-action]')) return;
                          setOpenSheetId(row.id);
                        }}
                      >
                        <TableCell data-row-action="true">
                          <Checkbox
                            checked={selectedIds.has(row.id)}
                            onCheckedChange={() => toggleSelected(row.id)}
                            disabled={row.status !== 'pending_review'}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">
                          {row.business_name || '—'}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          <div>{row.contact_name || '—'}</div>
                          <div className="text-xs text-slate-500">{row.contact_email}</div>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {row.campaign_name || '—'}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {fmtMoney(row.monthly_budget)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {fmtMoney(row.total)}
                        </TableCell>
                        <TableCell className="text-slate-600 capitalize">
                          {row.payment_method || '—'}
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs">
                          {fmtDate(row.created_at, true)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={row.status} />
                        </TableCell>
                        <TableCell className="text-right" data-row-action="true">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() => setOpenSheetId(row.id)}
                              >
                                View detail
                              </DropdownMenuItem>
                              {actions.length > 0 && <DropdownMenuSeparator />}
                              {actions.map((action) => (
                                <DropdownMenuItem
                                  key={action}
                                  onSelect={() => {
                                    if (action === 'reject') {
                                      setRejectFor(row);
                                    } else {
                                      runAction(row.id, action).catch(() => {});
                                    }
                                  }}
                                >
                                  {ACTION_LABEL[action]}
                                </DropdownMenuItem>
                              ))}
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
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <span className="h-4 w-px bg-slate-700" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBulkApprove}
            disabled={bulkSubmitting}
            className="text-white hover:bg-slate-800 hover:text-white h-8"
          >
            {bulkSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : null}
            Approve selected
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRejectReason('');
              setRejectFor('__bulk__');
            }}
            disabled={bulkSubmitting}
            className="text-white hover:bg-slate-800 hover:text-white h-8"
          >
            Reject selected
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
        onOpenChange={(open) => {
          if (!open) setOpenSheetId(null);
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <SheetHeader className="p-6 pb-3 border-b border-slate-100">
            <SheetTitle>
              {detail?.business_name || 'Advertiser detail'}
            </SheetTitle>
            {detail && (
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                <StatusBadge status={detail.status?.value || detail.status} />
                <span>·</span>
                <span>Created {fmtDate(detail.created_at, true)}</span>
              </div>
            )}
          </SheetHeader>

          {detailLoading && !detail ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 text-indigo-600 mx-auto animate-spin" />
            </div>
          ) : detail ? (
            <div className="p-6 space-y-6">
              <Section title="Business">
                <Field label="Business name" value={detail.business_name} />
                <Field
                  label="Type"
                  value={detail.business_type?.replace(/_/g, ' ')}
                />
                <Field label="Contact" value={detail.contact_name} />
                <Field label="Email" value={detail.contact_email} />
                <Field label="Phone" value={detail.contact_phone} />
                <Field label="Website" value={detail.website_url} />
                {detail.company_description && (
                  <Field
                    label="Description"
                    value={detail.company_description}
                    wide
                  />
                )}
              </Section>

              <Section title="Campaign">
                <Field label="Name" value={detail.campaign_name} />
                <Field
                  label="Objective"
                  value={detail.campaign_objective?.replace(/_/g, ' ')}
                />
                <Field label="Purchase type" value={detail.purchase_type} />
                <Field
                  label="Budget"
                  value={`${fmtMoney(detail.monthly_budget)} / month`}
                />
                <Field
                  label="Duration"
                  value={
                    detail.campaign_start_date && detail.campaign_end_date
                      ? `${fmtDate(detail.campaign_start_date)} – ${fmtDate(detail.campaign_end_date)}`
                      : '—'
                  }
                />
                {detail.campaign_offer && (
                  <Field label="Special offer" value={detail.campaign_offer} wide />
                )}
                <Field label="Has CTV" value={detail.has_ctv ? 'Yes' : 'No'} />
                <Field
                  label="Design service"
                  value={detail.design_service ? 'Yes (+$200)' : 'No'}
                />
                {Array.isArray(detail.target_countries) &&
                  detail.target_countries.length > 0 && (
                    <Field
                      label="Countries"
                      value={detail.target_countries.join(', ')}
                      wide
                    />
                  )}
                {detail.target_location && (
                  <Field
                    label="Location"
                    value={`${detail.target_location.address || ''} (${detail.target_location.radius_miles} mi)`}
                    wide
                  />
                )}
              </Section>

              <Section title="Ad creatives">
                {detail.design_service ? (
                  <div className="text-sm text-slate-600 col-span-2 p-3 bg-purple-50 border border-purple-100 rounded">
                    Design service requested — our team will produce the
                    creatives.
                  </div>
                ) : Array.isArray(detail.ad_creatives) &&
                  detail.ad_creatives.length > 0 ? (
                  <div className="col-span-2 grid grid-cols-2 gap-3">
                    {detail.ad_creatives.map((c, i) => (
                      <div
                        key={c.file_url || i}
                        className="border border-slate-200 rounded p-2"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={c.file_url}
                          alt={c.file_name}
                          className="w-full h-auto rounded"
                        />
                        <div className="text-xs text-slate-500 mt-1">
                          {c.dimension_label}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 col-span-2">
                    No creatives uploaded.
                  </div>
                )}
              </Section>

              <Section title="Payment">
                <Field label="Method" value={detail.payment_method?.replace(/_/g, ' ')} />
                <Field label="Status" value={detail.payment_status} />
                <Field
                  label="Total paid"
                  value={fmtMoney(detail.computed?.total)}
                />
                {detail.stripe_payment_intent && (
                  <Field
                    label="Stripe intent"
                    value={detail.stripe_payment_intent}
                    mono
                    wide
                  />
                )}
                {detail.paypal_payment_id && (
                  <Field
                    label="PayPal capture"
                    value={detail.paypal_payment_id}
                    mono
                    wide
                  />
                )}
              </Section>

              {detail.notes && (
                <Section title="Status history (notes)">
                  <pre className="col-span-2 whitespace-pre-wrap text-xs bg-slate-50 border border-slate-200 rounded p-3 text-slate-700">
                    {detail.notes}
                  </pre>
                </Section>
              )}

              <Section title="Audit trail (last 10)">
                {auditEntries.length === 0 ? (
                  <div className="col-span-2 text-sm text-slate-500">
                    No audit entries yet.
                  </div>
                ) : (
                  <div className="col-span-2 space-y-2">
                    {auditEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="text-xs border border-slate-100 rounded p-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-700">
                            {entry.action}
                          </span>
                          <span className="text-slate-400">
                            {fmtDate(entry.created_at, true)}
                          </span>
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          by {entry.user?.email || 'system'}
                          {entry.changes?.reason && (
                            <span> — reason: {entry.changes.reason}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* Sticky action footer */}
              <div className="-mx-6 -mb-6 px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center gap-2 flex-wrap">
                {(ALLOWED_ACTIONS[detail.status?.value || detail.status] || []).map(
                  (action) => (
                    <Button
                      key={action}
                      variant={action === 'reject' ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => {
                        if (action === 'reject') {
                          setRejectFor(detail);
                        } else {
                          runAction(detail.id, action).catch(() => {});
                        }
                      }}
                    >
                      {ACTION_LABEL[action]}
                    </Button>
                  )
                )}
                {(ALLOWED_ACTIONS[detail.status?.value || detail.status] || [])
                  .length === 0 && (
                  <span className="text-xs text-slate-500">
                    No transitions available from{' '}
                    <strong>{detail.status?.value || detail.status}</strong>.
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Reject modal */}
      <Dialog
        open={!!rejectFor}
        onOpenChange={(open) => {
          if (!open) {
            setRejectFor(null);
            setRejectReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {rejectFor === '__bulk__'
                ? `Reject ${selectedIds.size} submission${selectedIds.size === 1 ? '' : 's'}`
                : 'Reject submission'}
            </DialogTitle>
            <DialogDescription>
              {rejectFor === '__bulk__'
                ? 'The same reason is recorded for each. Only pending-review records are affected; others are skipped.'
                : 'The reason is recorded in the audit log and appended to the advertiser’s notes.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Why is this being rejected?"
            />
            {rejectReason && rejectReason.trim().length < 3 && (
              <p className="text-xs text-rose-600">
                Reason must be at least 3 characters.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectFor(null);
                setRejectReason('');
              }}
              disabled={rejectSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={rejectReason.trim().length < 3 || rejectSubmitting}
              onClick={handleReject}
            >
              {rejectSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Rejecting…
                </>
              ) : (
                'Reject'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SortableTh({ column, sort, direction, onSort, children }) {
  const isActive = sort === column && !!onSort;
  return (
    <TableHead>
      {onSort ? (
        <button
          type="button"
          onClick={() => onSort(column)}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
        >
          {children}
          {isActive && (
            <span className="text-[10px]">
              {direction === 'asc' ? '▲' : '▼'}
            </span>
          )}
        </button>
      ) : (
        children
      )}
    </TableHead>
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

function Field({ label, value, wide, mono }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <div className="text-xs text-slate-500">{label}</div>
      <div
        className={`text-sm text-slate-900 ${
          mono ? 'font-mono break-all' : ''
        } capitalize-`}
      >
        {value || '—'}
      </div>
    </div>
  );
}
