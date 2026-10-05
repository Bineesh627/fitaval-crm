import React, { useEffect, useState, useMemo } from "react";
import { client } from "@/api/client";
import { Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, Download, TrendingUp, Percent } from "lucide-react";
import { EmptyState, PageHeader, Badge } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function Wallet() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await client.entities.WalletTransaction.list("-date", 100);
        setTransactions(t);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const balance = useMemo(() => {
    return transactions.reduce((sum, t) => {
      if (t.type === "credit") return sum + (t.amount || 0);
      if (t.type === "debit" || t.type === "withdrawal") return sum - (t.amount || 0);
      return sum;
    }, 0);
  }, [transactions]);

  const totalEarnings = useMemo(() => transactions.filter((t) => t.type === "credit").reduce((s, t) => s + (t.amount || 0), 0), [transactions]);
  const totalFees = useMemo(() => transactions.reduce((s, t) => s + (t.platform_fee || 0), 0), [transactions]);
  const totalWithdrawn = useMemo(() => transactions.filter((t) => t.type === "withdrawal").reduce((s, t) => s + (t.amount || 0), 0), [transactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Fitaval Wallet" subtitle="B2C revenue & settlements" />

      {/* Balance card */}
      <div className="rounded-3xl bg-gradient-to-br from-foreground to-foreground/80 text-white p-6 mb-4 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute right-20 -bottom-10 w-32 h-32 bg-primary/30 rounded-full blur-2xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <WalletIcon className="w-5 h-5 text-white" />
              </div>
              <p className="text-white/70 text-sm">Available Balance</p>
            </div>
            <Badge variant="green">Active</Badge>
          </div>
          <p className="text-4xl font-bold mt-4">₹{balance.toLocaleString("en-IN")}</p>
          <p className="text-white/50 text-xs mt-1">Updated {format(new Date(), "dd MMM yyyy, hh:mm a")}</p>
          <div className="flex gap-3 mt-5">
            <Button className="flex-1 bg-primary text-primary-foreground h-11 border-0">
              <Download className="w-4 h-4 mr-1.5" />Withdraw
            </Button>
            <Button variant="outline" className="flex-1 bg-white/10 text-white border-white/20 hover:bg-white/20 h-11">
              <ArrowUpRight className="w-4 h-4 mr-1.5" />Settlements
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-2xl bg-white border border-border p-4">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center mb-1.5">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-xs text-muted-foreground">Total Earned</p>
          <p className="font-bold text-foreground text-sm">₹{totalEarnings.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl bg-white border border-border p-4">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center mb-1.5">
            <Percent className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xs text-muted-foreground">Platform Fee</p>
          <p className="font-bold text-foreground text-sm">₹{totalFees.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl bg-white border border-border p-4">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center mb-1.5">
            <Download className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-xs text-muted-foreground">Withdrawn</p>
          <p className="font-bold text-foreground text-sm">₹{totalWithdrawn.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Transaction history */}
      <div className="rounded-2xl bg-white border border-border p-5">
        <h3 className="font-bold text-foreground mb-3">Transaction History</h3>
        {transactions.length === 0 ? (
          <EmptyState icon={WalletIcon} title="No transactions yet" description="B2C membership purchases will appear here" />
        ) : (
          <div className="space-y-1">
            {transactions.map((t) => {
              const isCredit = t.type === "credit";
              return (
                <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isCredit ? "bg-green-100" : "bg-red-100"}`}>
                    {isCredit ? <ArrowDownLeft className="w-5 h-5 text-green-600" /> : <ArrowUpRight className="w-5 h-5 text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{t.description || (isCredit ? "B2C Membership" : "Withdrawal")}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{format(new Date(t.date), "dd MMM yyyy")}</span>
                      <Badge variant={t.status === "completed" ? "green" : t.status === "pending" ? "amber" : "red"}>{t.status}</Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold text-sm ${isCredit ? "text-green-600" : "text-red-600"}`}>
                      {isCredit ? "+" : "-"}₹{(t.amount || 0).toLocaleString("en-IN")}
                    </p>
                    {t.platform_fee > 0 && <p className="text-[10px] text-muted-foreground">fee ₹{t.platform_fee}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}