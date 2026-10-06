import React, { useEffect, useState, useMemo } from "react";
import { client } from "@/api/client";
import { Plus, TrendingUp, TrendingDown, Wallet, Calendar, CreditCard, Download } from "lucide-react";
import { EmptyState, PageHeader, Sheet, Badge } from "@/components/ui-shared";
import { format, startOfMonth, endOfMonth, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useToast } from "@/components/ui/use-toast";

const incomeCategories = ["Membership", "Renewal", "Personal Training", "Merchandise", "Other"];
const expenseCategories = ["Rent", "Salary", "Electricity", "Maintenance", "Equipment", "Other"];
const paymentMethods = ["cash", "card", "upi", "bank_transfer", "other"];

export const formatPaymentMethod = (method) => {
  if (!method) return "Cash";
  const m = String(method).toLowerCase();
  if (m === "upi") return "UPI";
  if (m === "bank_transfer") return "Bank Transfer";
  return m.charAt(0).toUpperCase() + m.slice(1);
};

export default function Finance() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [range, setRange] = useState("month");

  const [form, setForm] = useState({
    type: "income",
    amount: "",
    category: "Membership",
    payment_method: "cash",
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const t = await client.entities.Transaction.list("-date", 500);
        setTransactions(t);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredTx = useMemo(() => {
    const now = new Date();
    let start, end;
    if (range === "today") {
      start = end = now;
    } else if (range === "week") {
      start = subDays(now, 7);
      end = now;
    } else if (range === "month") {
      start = startOfMonth(now);
      end = endOfMonth(now);
    } else {
      return transactions;
    }
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
  }, [transactions, range]);

  const summary = useMemo(() => {
    const income = filteredTx.filter((t) => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
    const expense = filteredTx.filter((t) => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);
    return { income, expense, net: income - expense };
  }, [filteredTx]);

  const displayTx = useMemo(() => {
    if (tab === "all") return filteredTx;
    return filteredTx.filter((t) => t.type === tab);
  }, [filteredTx, tab]);

  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dayTx = transactions.filter((t) => format(new Date(t.date), "yyyy-MM-dd") === format(d, "yyyy-MM-dd"));
      days.push({
        day: format(d, "EEE"),
        income: dayTx.filter((t) => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0),
        expense: dayTx.filter((t) => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0),
      });
    }
    return days;
  }, [transactions]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await client.entities.Transaction.create({
        type: form.type,
        amount: parseFloat(form.amount),
        category: form.category,
        payment_method: form.payment_method,
        date: form.date,
        description: form.description,
      });
      setTransactions((prev) => [created, ...prev]);
      setSheetOpen(false);
      setForm({ type: "income", amount: "", category: "Membership", payment_method: "cash", date: format(new Date(), "yyyy-MM-dd"), description: "" });
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to add transaction");
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    const dataToExport = displayTx.length > 0 ? displayTx : transactions;
    if (!dataToExport || dataToExport.length === 0) {
      toast({
        title: "No transactions",
        description: "There are no transactions available to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      const headers = [
        "Transaction ID",
        "Date",
        "Type",
        "Category",
        "Amount (INR)",
        "Payment Method",
        "Description",
      ];

      const rows = dataToExport.map((t) => [
        t.id || "",
        t.date || "",
        (t.type || "").toUpperCase(),
        `"${(t.category || "").replace(/"/g, '""')}"`,
        t.amount || 0,
        `"${formatPaymentMethod(t.payment_method)}"`,
        `"${(t.description || "").replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `fitaval_finance_export_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Exported ${dataToExport.length} transaction${
          dataToExport.length === 1 ? "" : "s"
        } as CSV.`,
      });
    } catch (err) {
      console.error("Export error:", err);
      toast({
        title: "Export Failed",
        description: "An error occurred while generating the CSV.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Finance"
        subtitle="Income & Expenses"
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-10 px-3 rounded-xl gap-1.5 text-xs font-semibold shadow-xs hover:bg-muted"
              title="Export Transactions CSV"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Export</span>
            </Button>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs shrink-0 hover:bg-primary/90 transition-colors"
              title="Add Transaction"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-2xl bg-card border border-border p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-emerald-950/40 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-emerald-400" />
            </div>
            <p className="text-xs text-muted-foreground">Income</p>
          </div>
          <p className="font-bold text-green-600 dark:text-emerald-400">₹{summary.income.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-xs text-muted-foreground">Expense</p>
          </div>
          <p className="font-bold text-red-600 dark:text-red-400">₹{summary.expense.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white p-4 border border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-white/70">Net</p>
          </div>
          <p className="font-bold text-white text-base">₹{summary.net.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Date range filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {[
          { key: "today", label: "Today" },
          { key: "week", label: "This Week" },
          { key: "month", label: "This Month" },
          { key: "all", label: "All Time" },
        ].map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              range === r.key ? "bg-primary text-primary-foreground font-bold shadow-xs" : "bg-card border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-2xl bg-card border border-border p-4 mb-4 shadow-xs">
        <h3 className="font-semibold text-foreground text-sm mb-3">7-Day Overview</h3>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: 12,
                fontSize: 12,
                color: "hsl(var(--card-foreground))",
              }}
              formatter={(v) => `₹${v.toLocaleString("en-IN")}`}
            />
            <Bar dataKey="income" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Type tabs */}
      <div className="flex gap-2 mb-3">
        {[
          { key: "all", label: "All" },
          { key: "income", label: "Income" },
          { key: "expense", label: "Expense" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              tab === t.key ? "bg-primary text-primary-foreground shadow-xs" : "bg-card border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Transaction list header */}
      <div className="flex items-center justify-between mb-2.5 mt-4">
        <h3 className="font-bold text-sm text-foreground">
          Transactions ({displayTx.length})
        </h3>
      </div>

      {/* Transaction list */}
      {displayTx.length === 0 ? (
        <EmptyState icon={Wallet} title="No transactions" description="Record your first income or expense" />
      ) : (
        <div className="space-y-2.5">
          {displayTx.map((t) => (
            <div
              key={t.id}
              className="flex items-start sm:items-center gap-3 rounded-2xl bg-card border border-border p-3.5 shadow-xs transition-colors hover:border-primary/30"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                  t.type === "income"
                    ? "bg-green-100 dark:bg-emerald-950/40 text-green-600 dark:text-emerald-400"
                    : "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                }`}
              >
                {t.type === "income" ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="font-bold text-foreground text-sm truncate">
                    {t.category}
                  </h4>
                  <span
                    className={`font-black text-sm sm:text-base shrink-0 ${
                      t.type === "income" ? "text-green-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}₹{(t.amount || 0).toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Description clearly visible */}
                {t.description ? (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground/60 italic mt-0.5">
                    No description
                  </p>
                )}

                {/* Badges: Payment Method & Type & Date */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
                  {/* Payment Method Badge */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/90 text-[11px] font-semibold text-foreground border border-border/60">
                    <CreditCard className="w-3 h-3 text-muted-foreground" />
                    <span>{formatPaymentMethod(t.payment_method)}</span>
                  </span>

                  {/* Type badge */}
                  <Badge variant={t.type === "income" ? "green" : "red"}>
                    {t.type === "income" ? "Income" : "Expense"}
                  </Badge>

                  {/* Date */}
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium ml-auto sm:ml-0">
                    <Calendar className="w-3 h-3 text-muted-foreground/80" />
                    {format(new Date(t.date), "dd MMM yyyy")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add transaction sheet */}
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Add Transaction">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setForm({ ...form, type: "income", category: "Membership" })} className={`py-3 rounded-xl font-semibold text-sm border-2 transition-colors ${form.type === "income" ? "border-green-500 bg-green-50 text-green-600" : "border-border text-muted-foreground"}`}>
              <TrendingUp className="w-4 h-4 inline mr-1" />Income
            </button>
            <button type="button" onClick={() => setForm({ ...form, type: "expense", category: "Rent" })} className={`py-3 rounded-xl font-semibold text-sm border-2 transition-colors ${form.type === "expense" ? "border-red-500 bg-red-50 text-red-600" : "border-border text-muted-foreground"}`}>
              <TrendingDown className="w-4 h-4 inline mr-1" />Expense
            </button>
          </div>
          <div>
            <Label>Amount (₹) *</Label>
            <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className="mt-1.5" placeholder="0" />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(form.type === "income" ? incomeCategories : expenseCategories).map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Payment Method</Label>
            <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
              <SelectTrigger className="mt-1.5 capitalize"><SelectValue /></SelectTrigger>
              <SelectContent>
                {paymentMethods.map((m) => (
                  <SelectItem key={m} value={m} className="capitalize">{m.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1.5" />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5" placeholder="Optional note" />
          </div>
          <Button type="submit" disabled={saving} className="w-full bg-primary text-primary-foreground h-11">
            {saving ? "Saving..." : "Add Transaction"}
          </Button>
        </form>
      </Sheet>
    </div>
  );
}