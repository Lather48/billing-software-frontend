import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiEye, FiTrash2, FiSearch, FiFilter, FiCheckCircle, FiX } from 'react-icons/fi';
import { format } from 'date-fns';

const API = 'https://server.robinlather.in';

const BillsList = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('cash');
    const [paymentLoading, setPaymentLoading] = useState(false);

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

    const openPaymentModal = (bill) => {
        setSelectedBill(bill);
        setPaymentAmount(String(bill.balanceDue));
        setPaymentMode('cash');
        setShowPaymentModal(true);
    };

    const handleReceivePayment = async () => {
        const amount = Number(paymentAmount);
        if (!amount || amount <= 0) return toast.error('Valid amount daalo');
        if (amount > selectedBill.balanceDue) return toast.error(`Max ₹${selectedBill.balanceDue} receive kar sakte ho`);

        setPaymentLoading(true);
        try {
            const newAmountPaid = (selectedBill.amountPaid || 0) + amount;
            const newBalanceDue = selectedBill.grandTotal - newAmountPaid;
            const newStatus = newBalanceDue <= 0 ? 'paid' : 'partial';

            await axios.put(`${API}/api/bills/${selectedBill._id}`, {
                amountPaid: newAmountPaid,
                balanceDue: newBalanceDue,
                status: newStatus,
                paymentMode: paymentMode
            });

            toast.success(`₹${amount.toLocaleString()} payment received!`);
            setShowPaymentModal(false);
            setSelectedBill(null);
            fetchBills();
        } catch (err) {
            toast.error('Payment update failed');
        } finally {
            setPaymentLoading(false);
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill No & Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                                            {bill.balanceDue > 0 && <div className="text-xs text-red-500">Due: ₹{bill.balanceDue.toLocaleString()}</div>}
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <Link to={`/bills/preview/${bill._id}`} className="text-primary hover:text-blue-900" title="View/Print">
                                                    <FiEye className="h-5 w-5" />
                                                </Link>
                                                {(bill.status === 'pending' || bill.status === 'partial') && (
                                                    <button
                                                        onClick={() => openPaymentModal(bill)}
                                                        title="Receive Payment"
                                                        className="text-green-600 hover:text-green-800"
                                                    >
                                                        <FiCheckCircle className="h-5 w-5" />
                                                    </button>
                                                )}
                                                <button onClick={() => handleDelete(bill._id)} className="text-red-500 hover:text-red-900" title="Delete Bill">
                                                    <FiTrash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Receive Payment Modal */}
            {showPaymentModal && selectedBill && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Receive Payment</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                                <FiX size={20} />
                            </button>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Bill No:</span>
                                <span className="font-medium text-gray-900">{selectedBill.billNumber}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Customer:</span>
                                <span className="font-medium text-gray-900">{selectedBill.customer?.name || selectedBill.customerName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Bill Date:</span>
                                <span className="font-medium text-gray-900">{format(new Date(selectedBill.billDate), 'dd MMM yyyy')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Total Amount:</span>
                                <span className="font-medium text-gray-900">₹{selectedBill.grandTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Already Paid:</span>
                                <span className="font-medium text-green-600">₹{(selectedBill.amountPaid || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-1">
                                <span className="text-gray-700 font-semibold">Balance Due:</span>
                                <span className="font-bold text-red-600 text-base">₹{selectedBill.balanceDue.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Receiving (₹)</label>
                                <input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)}
                                    max={selectedBill.balanceDue}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                {Number(paymentAmount) > 0 && Number(paymentAmount) < selectedBill.balanceDue && (
                                    <p className="text-xs text-amber-600 mt-1">Partial payment — remaining ₹{(selectedBill.balanceDue - Number(paymentAmount)).toLocaleString()} baaki rahega</p>
                                )}
                                {Number(paymentAmount) >= selectedBill.balanceDue && (
                                    <p className="text-xs text-green-600 mt-1">✓ Full payment — bill paid ho jaayega</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['cash', 'upi', 'card'].map(mode => (
                                        <button key={mode} type="button" onClick={() => setPaymentMode(mode)}
                                            className={`py-2 rounded-lg text-sm font-medium capitalize border transition-all
                                                ${paymentMode === mode ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button onClick={() => setShowPaymentModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition">
                                Cancel
                            </button>
                            <button onClick={handleReceivePayment} disabled={paymentLoading}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50">
                                {paymentLoading ? 'Saving...' : 'Confirm Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillsList;
