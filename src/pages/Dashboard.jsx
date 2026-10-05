import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { client } from "@/api/client";
import { Users, UserCheck, Clock, UserX, TrendingUp, TrendingDown, Wallet, Plus, ArrowRight, Calendar } from "lucide-react";
import StatCard from "@/components/StatCard";
import { EmptyState, PageHeader } from "@/components/ui-shared";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, subDays, isAfter, isBefore, addDays } from "date-fns";

export default function Dashboard() {
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [m, t, p] = await Promise.all([
          client.entities.Member.list("-created_date", 200),
          client.entities.Transaction.list("-date", 200),
          client.entities.MembershipPlan.list("-created_date", 50),
        ]);
        setMembers(m);
        setTransactions(t);
        setPlans(p);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const today = new Date();
    const soon = addDays(today, 7);
    const active = members.filter((m) => m.status === "active" && isAfter(new Date(m.expiry_date || today), today));
    const expiring = members.filter((m) => {
      const exp = new Date(m.expiry_date || today);
      return isAfter(exp, today) && isBefore(exp, soon);
    });
    const inactive = members.filter((m) => m.status === "inactive" || (m.expiry_date && isBefore(new Date(m.expiry_date), today)));
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthTx = transactions.filter((t) => new Date(t.date) >= monthStart);
    const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
    const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);
    const todayTx = transactions.filter((t) => format(new Date(t.date), "yyyy-MM-dd") === format(today, "yyyy-MM-dd"));
    const dailyIncome = todayTx.filter((t) => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
    return { total: members.length, active: active.length, expiring: expiring.length, inactive: inactive.length, income, expense, net: income - expense, dailyIncome };
  }, [members, transactions]);

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

  const recentMembers = [...members].slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Greeting */}
      <div className="rounded-3xl bg-gradient-to-br from-foreground to-foreground/80 text-white p-5 mb-5 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
        <div className="absolute right-10 bottom-0 w-24 h-24 bg-primary/30 rounded-full blur-2xl" />
        <div className="relative">
          <p className="text-white/60 text-sm">{format(new Date(), "EEEE, dd MMM")}</p>
          <h2 className="text-2xl font-bold mt-1">Welcome back 👋</h2>
          <p className="text-white/70 text-sm mt-1">Here's your gym overview for this month</p>
          <div className="flex items-center gap-4 mt-4">
            <div>
              <p className="text-white/60 text-xs">Monthly Income</p>
              <p className="text-xl font-bold">₹{stats.income.toLocaleString("en-IN")}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div>
              <p className="text-white/60 text-xs">Net Profit</p>
              <p className="text-xl font-bold text-green-300">₹{stats.net.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>
      </div>

      <PageHeader title="Overview" />

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard title="Total Members" value={stats.total} icon={Users} accent="dark" />
        <StatCard title="Active" value={stats.active} icon={UserCheck} accent="green" />
        <StatCard title="Expiring" value={stats.expiring} icon={Clock} accent="amber" />
        <StatCard title="Inactive" value={stats.inactive} icon={UserX} accent="red" />
      </div>

      {/* Chart */}
      <div className="rounded-2xl bg-white border border-border p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-foreground">Cash Flow</h3>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" />Income</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-foreground/40" />Expense</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }}
              formatter={(v) => `₹${v.toLocaleString("en-IN")}`}
            />
            <Area type="monotone" dataKey="income" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#gInc)" />
            <Area type="monotone" dataKey="expense" stroke="hsl(var(--foreground))" strokeWidth={2} fill="url(#gExp)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-2xl bg-white border border-border p-4">
          <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-xs text-muted-foreground">Income (Mo)</p>
          <p className="font-bold text-foreground">₹{stats.income.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl bg-white border border-border p-4">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center mb-2">
            <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-xs text-muted-foreground">Expense (Mo)</p>
          <p className="font-bold text-foreground">₹{stats.expense.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl bg-white border border-border p-4">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground">Today</p>
          <p className="font-bold text-foreground">₹{stats.dailyIncome.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Link to="/members" className="rounded-2xl bg-primary text-primary-foreground p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Plus className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-semibold text-sm">Add Member</p>
            <p className="text-xs text-primary-foreground/70">New or existing</p>
          </div>
        </Link>
        <Link to="/finance" className="rounded-2xl bg-white border border-border p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Wallet className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <p className="font-semibold text-sm">Add Transaction</p>
            <p className="text-xs text-muted-foreground">Income or expense</p>
          </div>
        </Link>
      </div>

      {/* Recent members */}
      <div className="rounded-2xl bg-white border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-foreground">Recent Members</h3>
          <Link to="/members" className="text-xs font-semibold text-primary flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentMembers.length === 0 ? (
          <EmptyState icon={Users} title="No members yet" description="Add your first member to get started" />
        ) : (
          <div className="space-y-1">
            {recentMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-2">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-accent-foreground shrink-0">
                  {m.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground text-sm truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.plan_name || "No plan"}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  m.status === "active" ? "bg-green-100 text-green-700" :
                  m.status === "expiring" ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {m.status || "active"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}