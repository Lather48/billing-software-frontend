import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
    FiDollarSign, FiFileText, FiAlertTriangle, FiUsers,
    FiEye, FiPrinter, FiMessageCircle
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BusinessContext } from '../context/BusinessContext';

// Dummy data for chart if api fails or is empty
const data = [
    { name: 'Mon', sales: 4000 },
    { name: 'Tue', sales: 3000 },
    { name: 'Wed', sales: 2000 },
    { name: 'Thu', sales: 2780 },
    { name: 'Fri', sales: 1890 },
    { name: 'Sat', sales: 2390 },
    { name: 'Sun', sales: 3490 },
];

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, link, linkText }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${colorClass}`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
        </div>
        <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">{subtext}</p>
            {link && (
                <Link to={link} className="text-sm font-medium text-primary hover:text-blue-700">
                    {linkText}
                </Link>
            )}
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        todaySales: 0,
        todayBillsCount: 0,
        pendingBills: 0,
        lowStockCount: 0,
        totalCustomers: 0,
        recentBills: []
    });
    const [loading, setLoading] = useState(true);
    const { business } = useContext(BusinessContext);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                const res = await axios.get('https://billing-software-backend-production-0456.up.railway.app/api/reports/dashboard');
                setStats(res.data);
            } catch (error) {
                console.error('Error fetching dashboard stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardStats();
    }, []);

    if (loading) {
        return <div className="animate-pulse flex space-x-4 p-6">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-gray-800">Overview</h2>
                <div className="space-x-2">
                    <Link to="/bills/new" className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center inline-flex">
                        <span>+ New Bill</span>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Today's Sales"
                    value={`₹${stats.todaySales.toLocaleString('en-IN')}`}
                    subtext="Revenue generated today"
                    icon={FiDollarSign}
                    colorClass="bg-blue-500"
                />
                <StatCard
                    title="Bills Created"
                    value={stats.todayBillsCount}
                    subtext={`${stats.pendingBills} pending payment`}
                    icon={FiFileText}
                    colorClass="bg-emerald-500"
                    link="/bills"
                    linkText="View all"
                />
                <StatCard
                    title="Low Stock Items"
                    value={stats.lowStockCount}
                    subtext="Needs attention"
                    icon={FiAlertTriangle}
                    colorClass="bg-amber-500"
                    link="/inventory"
                    linkText="Restock"
                />
                <StatCard
                    title="Total Customers"
                    value={stats.totalCustomers}
                    subtext="Registered clients"
                    icon={FiUsers}
                    colorClass="bg-purple-500"
                    link="/customers"
                    linkText="View"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Sales Overview</h3>
                        <select className="border border-gray-300 rounded text-sm px-2 py-1 outline-none">
                            <option>Last 7 Days</option>
                            <option>This Month</option>
                        </select>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(value) => `₹${value}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(value) => [`₹${value}`, 'Sales']}
                                />
                                <Area type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Bills Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Recent Bills</h3>
                        <Link to="/bills" className="text-sm font-medium text-primary hover:text-blue-700">View All</Link>
                    </div>
                    {stats.recentBills.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">No recent bills found.</p>
                    ) : (
                        <div className="space-y-4">
                            {stats.recentBills.map((bill) => (
                                <div key={bill._id} className="flex items-center justify-between pb-4 border-b border-gray-50 last:border-0">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{bill.billNumber}</p>
                                        <p className="text-xs text-gray-500">{bill.customer?.name || bill.customerName || 'Walk-in Customer'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-800">₹{bill.grandTotal.toLocaleString('en-IN')}</p>
                                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium capitalize
                      ${bill.status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                      ${bill.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${bill.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                                            {bill.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
