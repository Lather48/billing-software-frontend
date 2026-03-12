import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiEye, FiPrinter, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi';
import { format } from 'date-fns';

const API = 'https://server.robinlather.in';

const BillsList = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const fetchBills = async () => {
        try {
            let url = `${API}/api/bills?`;
            if (statusFilter) url += `status=${statusFilter}&`;
            if (dateRange.start && dateRange.end) url += `startDate=${dateRange.start}&endDate=${dateRange.end}&`;
            if (searchTerm) url += `search=${searchTerm}&`;

            const res = await axios.get(url);
            setBills(res.data);
        } catch (err) {
            toast.error('Failed to load bills');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBills();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, dateRange, searchTerm]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to cancel and delete this bill? Stock will be reverted.')) {
            try {
                await axios.delete(`${API}/api/bills/${id}`);
                toast.success('Bill cancelled and deleted');
                fetchBills();
            } catch (err) {
                toast.error('Failed to delete bill');
            }
        }
    };

    return (
        <div className="space-y-6 max-w-7xl pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Invoices & Bills</h2>
                <Link to="/bills/new" className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center">
                    <span>+ Create New Bill</span>
                </Link>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiSearch className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary sm:text-sm"
                            placeholder="Bill No. / Customer Name"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="w-full md:w-1/4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiFilter className="text-gray-400" />
                        </div>
                        <select
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary sm:text-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                            <option value="partial">Partial</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                <div className="w-full md:w-auto flex gap-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                        <input type="date" className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary sm:text-sm" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                        <input type="date" className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary sm:text-sm" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} />
                    </div>
                </div>

                {(searchTerm || statusFilter || dateRange.start || dateRange.end) && (
                    <button onClick={() => { setSearchTerm(''); setStatusFilter(''); setDateRange({ start: '', end: '' }); }} className="text-sm text-gray-500 hover:text-gray-700 underline pb-2">
                        Clear Filters
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill No & Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Loading bills...</td></tr>
                            ) : bills.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No bills found matching filters.</td></tr>
                            ) : (
                                bills.map((bill) => (
                                    <tr key={bill._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">{bill.billNumber}</div>
                                            <div className="text-xs text-gray-500">{format(new Date(bill.billDate), 'dd MMM yyyy')}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-medium">{bill.customer?.name || bill.customerName}</div>
                                            <div className="text-xs text-gray-500">{bill.customer?.phone || bill.customerPhone || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">₹{bill.grandTotal.toLocaleString()}</div>
                                            {bill.balanceDue > 0 && <div className="text-xs text-danger">Due: ₹{bill.balanceDue.toLocaleString()}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{bill.paymentMode}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${bill.status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                                                ${bill.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                ${bill.status === 'partial' ? 'bg-blue-100 text-blue-800' : ''}
                                                ${bill.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                                            `}>
                                                {bill.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right space-x-3">
                                            <Link to={`/bills/preview/${bill._id}`} className="text-primary hover:text-blue-900" title="View/Print Preview">
                                                <FiEye className="inline h-5 w-5" />
                                            </Link>
                                            <button onClick={() => handleDelete(bill._id)} className="text-danger hover:text-red-900" title="Delete Bill">
                                                <FiTrash2 className="inline h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BillsList;
