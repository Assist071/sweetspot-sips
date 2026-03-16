import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval, isSameDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminReports() {
  const [range, setRange] = useState("30");
  const [stats, setStats] = useState({ 
    totalSales: 0, totalOrders: 0, avgOrder: 0, 
    popularProducts: [] as any[], 
    dailyData: [] as any[],
    weeklyData: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const days = parseInt(range);
      const startDate = subDays(startOfDay(new Date()), days);
      
      const { data: orders } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .gte("created_at", startDate.toISOString());
      
      if (!orders) {
        setLoading(false);
        return;
      }

      const totalSales = orders.reduce((s, o) => s + Number(o.total_amount), 0);
      const totalOrders = orders.length;
      const avgOrder = totalOrders ? totalSales / totalOrders : 0;

      // Group by Day for Charts
      const interval = eachDayOfInterval({ start: startDate, end: new Date() });
      const dailyData = interval.map(date => {
        const dayOrders = orders.filter(o => isSameDay(new Date(o.created_at), date));
        return {
          date: format(date, "MMM dd"),
          revenue: dayOrders.reduce((s, o) => s + Number(o.total_amount), 0),
          orders: dayOrders.length
        };
      });

      // Weekly Data (last 7 days specifically)
      const weeklyData = dailyData.slice(-7);

      // Popular Products
      const productMap: Record<string, { count: number; revenue: number }> = {};
      orders.forEach(o => {
        o.order_items?.forEach((item: any) => {
          if (!productMap[item.product_name]) {
            productMap[item.product_name] = { count: 0, revenue: 0 };
          }
          productMap[item.product_name].count += item.quantity;
          productMap[item.product_name].revenue += item.quantity * Number(item.unit_price);
        });
      });

      const popularProducts = Object.entries(productMap)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({ totalSales, totalOrders, avgOrder, popularProducts, dailyData, weeklyData });
      setLoading(false);
    };
    load();
  }, [range]);

  const COLORS = ["#E58B6D", "#CDA275", "#83AF9B", "#493D35", "#F2D0B1"];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Track your business performance and trends.</p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[180px] rounded-xl">
            <SelectValue placeholder="Select Range" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-none shadow-sm bg-primary/20">
          <CardHeader className="pb-2">
            <CardDescription>Total Sales</CardDescription>
            <CardTitle className="text-3xl">₱{stats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-accent/20">
          <CardHeader className="pb-2">
            <CardDescription>Total Orders</CardDescription>
            <CardTitle className="text-3xl">{stats.totalOrders}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-success/5">
          <CardHeader className="pb-2">
            <CardDescription>Average Order</CardDescription>
            <CardTitle className="text-3xl">₱{stats.avgOrder.toLocaleString(undefined, { minimumFractionDigits: 2 })}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Sales Bar Chart */}
        <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle>Weekly Revenue</CardTitle>
            <CardDescription>Daily sales progress for the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pr-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(v) => `₱${v}`} />
                <RechartsTooltip 
                  cursor={{ fill: "#F8FAFC" }}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                  formatter={(value) => [`₱${Number(value).toFixed(2)}`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill="#E58B6D" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Most Popular Items Chart */}
        <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle>Most Popular Items</CardTitle>
            <CardDescription>Top 5 products by quantity sold.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.popularProducts}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {stats.popularProducts.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                />
                <Legend verticalAlign="bottom" align="center" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Trend Line Chart */}
      <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Detailed revenue tracking for the selected period.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] pr-8 pb-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.dailyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} minTickGap={30} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(v) => `₱${v}`} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                formatter={(value) => [`₱${Number(value).toFixed(2)}`, "Revenue"]}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#E58B6D" 
                strokeWidth={3} 
                dot={{ r: 4, fill: "#E58B6D", strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
