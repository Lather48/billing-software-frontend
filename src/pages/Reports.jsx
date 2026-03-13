import { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const API = 'https://server.robinlather.in';

const Reports = () => {
    const [activeTab, setActiveTab] = useState('sales');
    const [loading, setLoading] = useState(false);
    const [salesData, setSalesData] = useState(null);
    const [customersData, setCustomersData] = useState([]);
    const [productsData, setProductsData] = useState([]);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().substring(0, 10),
        end: new Date().toISOString().substring(0, 10)
    });

    const fetchSalesData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/api/reports/sales?startDate=${dateRange.start}&endDate=${dateRange.end}`);
            setSalesData(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load sales data');
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomersData = async () => {
        setLoading(true);
        try {
            const [customersRes, billsRes] = await Promise.all([
                axios.get(`${API}/api/customers`),
                axios.get(`${API}/api/bills`)
            ]);

            const customers = customersRes.data;
            const bills = billsRes.data.filter(b => b.status !== 'cancelled');

            const enriched = customers.map(customer => {
                const customerBills = bills.filter(bill => {
                    if (bill.customer?._id === customer._id) return true;
                    if (bill.customerPhone && customer.phone &&
                        bill.customerPhone.replace(/\D/g, '').slice(-10) === customer.phone.replace(/\D/g, '').slice(-10)) return true;
                    return false;
                });

                const totalBilled = customerBills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);
                const totalPaid = customerBills.reduce((sum, b) => sum + (b.amountPaid || 0), 0);
                const outstanding = totalBilled - totalPaid;

                return {
                    ...customer,
                    totalBilled,
                    totalPaid,
                    outstanding: outstanding > 0 ? outstanding : 0,
                    billCount: customerBills.length
                };
            });

            const sorted = enriched.sort((a, b) => b.outstanding - a.outstanding);
            setCustomersData(sorted);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load customer data');
        } finally {
            setLoading(false);
        }
    };

    const fetchProductsData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/api/products`);
            setProductsData(res.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load stock data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'sales' || activeTab === 'gst') {
            fetchSalesData();
        } else if (activeTab === 'customers') {
            fetchCustomersData();
        } else if (activeTab === 'stock') {
            fetchProductsData();
        }
    }, [activeTab, dateRange]);

    const chartData = salesData?.bills ? salesData.bills.map(b => ({
        name: format(new Date(b.billDate), 'dd MMM'),
        sales: b.grandTotal,
        taxable: b.taxableAmount
    })) : [];

    const exportSalesToExcel = () => {
        if (!salesData || !salesData.bills || salesData.bills.length === 0) {
            toast.error('No sales data to export');
            return;
        }
        const exportData = salesData.bills.map((bill) => ({
            'Date': format(new Date(bill.billDate), 'dd MMM yyyy'),
            'Bill No': bill.billNumber,
            'Customer Name': bill.customer?.name || bill.customerName || 'Walk-in',
            'Payment Mode': bill.paymentMode,
            'Items': bill.items.map(i => `${i.name} (${i.qty})`).join(', '),
            'Taxable Amount': bill.taxableAmount,
            'CGST': bill.cgst || 0,
            'SGST': bill.sgst || 0,
            'Total GST': bill.totalGST,
            'Grand Total': bill.grandTotal,
            'Amount Paid': bill.amountPaid,
            'Balance Due': bill.balanceDue,
            'Status': bill.status
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wscols = [
            { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 40 },
            { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
            { wch: 15 }, { wch: 15 }, { wch: 12 }
        ];
        ws['!cols'] = wscols;
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
        XLSX.writeFile(wb, `Sales_Report_${dateRange.start}_to_${dateRange.end}.xlsx`);
        toast.success('Excel file downloaded successfully');
    };

    return (
        <div className="space-y-6 max-w-7xl">
            <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>

            <div className="flex space-x-4 border-b border-gray-200">
                {['sales', 'gst', 'stock', 'customers'].map(tab => (
                    <button key={tab}
                        className={`py-2 px-4 text-sm font-medium capitalize outline-none transition-colors border-b-2
                            ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                        onClick={() => setActiveTab(tab)}>
                        {tab} Report
                    </button>
                ))}
            </div>

            {/* Sales Report */}
            {activeTab === 'sales' && (
                <div className="space-y-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-end gap-4 flex-wrap">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
                            <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
                            <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary" />
                        </div>
                        <button onClick={fetchSalesData} className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                            Apply Filter
                        </button>
                        <div className="flex-1 text-right">
                            <button onClick={exportSalesToExcel} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                                Export to Excel
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="h-40 flex items-center justify-center text-gray-500">Loading reports...</div>
                    ) : salesData && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <p className="text-sm font-medium text-gray-500">Net Sales</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">₹{salesData.summary.totalTaxable.toLocaleString()}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <p className="text-sm font-medium text-gray-500">Total GST Collected</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">₹{salesData.summary.totalGST.toLocaleString()}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <p className="text-sm font-medium text-gray-500">Gross Amount</p>
                                    <p className="text-2xl font-bold text-primary mt-1">₹{salesData.summary.totalSales.toLocaleString()}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <p className="text-sm font-medium text-gray-500">Number of Bills</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{salesData.summary.billCount}</p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-base font-bold text-gray-800 mb-6">Sales Trend</h3>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                            <YAxis axisLine={false} tickLine={false} />
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="sales" stroke="#2563EB" fillOpacity={1} fill="url(#colorSales)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-gray-50">
                                    <h3 className="font-semibold text-gray-800">Bills List</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-white">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill No</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {salesData.bills.length === 0 ? (
                                                <tr><td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">No bills found for this period.</td></tr>
                                            ) : (
                                                salesData.bills.map((bill) => (
                                                    <tr key={bill._id} className="hover:bg-gray-50 text-sm">
                                                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">{format(new Date(bill.billDate), 'dd MMM yyyy')}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap font-medium text-blue-600">{bill.billNumber}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-gray-900">{bill.customer?.name || bill.customerName || 'Walk-in'}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-gray-500 capitalize">{bill.paymentMode}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-right font-medium text-gray-900">₹{bill.grandTotal.toLocaleString()}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-right text-green-600">₹{bill.amountPaid?.toLocaleString() || '0'}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-right text-red-600">₹{bill.balanceDue?.toLocaleString() || '0'}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize
                                                                ${bill.status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                                                                ${bill.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                                ${bill.status === 'partial' ? 'bg-blue-100 text-blue-800' : ''}
                                                                ${bill.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                                                            `}>{bill.status}</span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* GST Report */}
            {activeTab === 'gst' && (
                <div className="space-y-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-end gap-4 flex-wrap">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
                            <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
                            <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <button onClick={fetchSalesData} className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                            Apply Filter
                        </button>
                    </div>

                    {loading ? (
                        <div className="h-40 flex items-center justify-center text-gray-500">Loading GST data...</div>
                    ) : salesData && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-semibold text-gray-800">GST Collection Summary</h3>
                                <div className="text-sm">
                                    <span className="text-gray-500 mr-2">Total GST:</span>
                                    <span className="font-bold text-gray-900">₹{salesData.summary.totalGST.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-white">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill No</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Taxable Amt</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">CGST</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">SGST</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total GST</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {salesData.bills.length === 0 ? (
                                            <tr><td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">No records found.</td></tr>
                                        ) : (
                                            salesData.bills.map((bill) => (
                                                <tr key={bill._id} className="hover:bg-gray-50 text-sm">
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{format(new Date(bill.billDate), 'dd MMM yyyy')}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">{bill.billNumber}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{bill.customer?.name || bill.customerName || '-'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">₹{bill.taxableAmount.toFixed(2)}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500">₹{bill.cgst?.toFixed(2) || '0.00'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500">₹{bill.sgst?.toFixed(2) || '0.00'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">₹{bill.totalGST.toFixed(2)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Customers Report */}
            {activeTab === 'customers' && (
                <div className="space-y-6">
                    {loading ? (
                        <div className="h-40 flex items-center justify-center text-gray-500">Loading customer data...</div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-semibold text-gray-800">Customer Outstanding Balance Report</h3>
                                <div className="text-sm">
                                    <span className="text-gray-500 mr-2">Total Outstanding:</span>
                                    <span className="font-bold text-red-600">₹{customersData.reduce((acc, curr) => acc + (curr.outstanding || 0), 0).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-white">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Bills</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Billed</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Paid</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {customersData.length === 0 ? (
                                            <tr><td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">No customers found.</td></tr>
                                        ) : (
                                            customersData.map((customer) => (
                                                <tr key={customer._id} className="hover:bg-gray-50 text-sm">
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{customer.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{customer.phone}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500">{customer.billCount}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">₹{customer.totalBilled?.toLocaleString()}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-green-600">₹{customer.totalPaid?.toLocaleString()}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-red-600">₹{customer.outstanding?.toLocaleString()}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Stock Report */}
            {activeTab === 'stock' && (
                <div className="space-y-6">
                    {loading ? (
                        <div className="h-40 flex items-center justify-center text-gray-500">Loading stock data...</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Total Inventory Valuation</p>
                                        <p className="text-xs text-gray-400 mt-1">(Based on Selling Price)</p>
                                    </div>
                                    <p className="text-2xl font-bold text-primary">₹{productsData.reduce((acc, curr) => acc + ((curr.stock || 0) * (curr.sellingPrice || 0)), 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Low Stock Alert Items</p>
                                        <p className="text-xs text-amber-500 mt-1">Requires immediate attention</p>
                                    </div>
                                    <p className="text-2xl font-bold text-amber-500">{productsData.filter(p => p.stock <= p.minStockAlert).length}</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-gray-50">
                                    <h3 className="font-semibold text-gray-800">Current Stock Status</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-white">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Code</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Value</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {productsData.length === 0 ? (
                                                <tr><td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">No inventory found.</td></tr>
                                            ) : (
                                                productsData.map((product) => {
                                                    const isLowStock = product.stock <= product.minStockAlert;
                                                    return (
                                                        <tr key={product._id} className="hover:bg-gray-50 text-sm">
                                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">{product.code}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                                {product.name}
                                                                {isLowStock && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Low Stock</span>}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">{product.category || '-'}</td>
                                                            <td className={`px-6 py-4 whitespace-nowrap text-right font-medium ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>{product.stock} {product.unit}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right text-gray-700">₹{product.sellingPrice?.toLocaleString()}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">₹{((product.stock || 0) * (product.sellingPrice || 0)).toLocaleString()}</td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default Reports;
