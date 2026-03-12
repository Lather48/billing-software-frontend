import { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiPrinter, FiArrowLeft, FiDownload } from 'react-icons/fi';
import { format } from 'date-fns';
import { BusinessContext } from '../context/BusinessContext';

const API = 'https://server.robinlather.in';

const BillPreview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { business } = useContext(BusinessContext);

    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBill = async () => {
            try {
                const res = await axios.get(`${API}/api/bills/${id}`);
                setBill(res.data);
            } catch (err) {
                toast.error('Failed to load bill details');
                navigate('/bills');
            } finally {
                setLoading(false);
            }
        };
        fetchBill();
    }, [id, navigate]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading invoice...</div>;
    if (!bill) return <div className="p-8 text-center text-red-500">Invoice not found</div>;

    return (
        <div className="max-w-4xl mx-auto pb-12 print:p-0">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 print:hidden">
                <button onClick={() => navigate('/bills')} className="text-gray-600 hover:text-primary flex items-center mb-4 sm:mb-0 transition font-medium">
                    <FiArrowLeft className="mr-2" /> Back to Bills
                </button>
                <div className="flex space-x-3">
                    <button onClick={handlePrint} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center">
                        <FiDownload className="mr-2" /> Save PDF
                    </button>
                    <button onClick={handlePrint} className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center shadow-sm">
                        <FiPrinter className="mr-2" /> Print Invoice
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-2xl overflow-hidden print:shadow-none min-h-[1056px] relative text-gray-800 font-sans">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-bl-full z-0 opacity-70"></div>
                {bill.status === 'paid' && <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-45 text-[8rem] text-green-500/10 font-black whitespace-nowrap z-0 pointer-events-none uppercase tracking-widest">PAID IN FULL</div>}

                <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white px-8 sm:px-12 py-10 relative overflow-hidden shadow-md">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
                    <div className="absolute right-20 bottom-0 w-32 h-32 bg-white opacity-10 rounded-full -mb-10"></div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center relative z-10 w-full mb-4">
                        <div className="flex items-center gap-6 mb-6 sm:mb-0">
                            {business?.logo && (
                                <div className="bg-white p-2 rounded-xl shadow-lg">
                                    <img src={business.logo} alt="Business Logo" className="w-20 h-20 object-contain rounded-lg" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-3xl font-black tracking-tight mb-1 text-white">{business?.name || 'Your Business Name'}</h1>
                                <p className="text-blue-100 text-sm opacity-90">{business?.address || 'City, State, ZIP'}</p>
                                <div className="mt-2 text-xs text-blue-100 flex flex-wrap gap-4 opacity-90 font-medium">
                                    <span>📞 {business?.phone || 'N/A'}</span>
                                    {business?.email && <span>✉️ {business?.email}</span>}
                                </div>
                                {business?.gstNumber && <div className="mt-1 bg-white/20 inline-block px-2 py-0.5 rounded text-xs font-bold text-white tracking-wider">GSTIN: {business.gstNumber}</div>}
                            </div>
                        </div>
                        <div className="sm:text-right">
                            <h2 className="text-5xl font-black tracking-tighter text-white/90 uppercase drop-shadow-md">INVOICE</h2>
                        </div>
                    </div>
                </div>

                <div className="px-8 sm:px-12 py-10 relative z-10">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-10 pb-8 border-b border-gray-100">
                        <div className="w-full sm:w-1/2 pr-0 sm:pr-4 mb-6 sm:mb-0">
                            <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-3">Invoice To</h3>
                            <div className="bg-gray-50 border border-gray-100/50 rounded-xl p-5 shadow-sm">
                                <p className="font-bold text-gray-900 text-xl tracking-tight">{bill.customer?.name || bill.customerName || 'Walk-in Customer'}</p>
                                <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                    {bill.customer?.phone || bill.customerPhone || 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="w-full sm:w-1/2 sm:pl-8 text-left sm:text-right flex flex-col sm:items-end">
                            <div className="space-y-3 mt-4 w-full sm:w-auto">
                                <div className="flex justify-between sm:justify-end gap-10 items-center">
                                    <span className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Invoice No</span>
                                    <span className="text-base font-bold text-gray-900 bg-blue-50/80 px-3 py-1 rounded-md border border-blue-100 shadow-sm">{bill.billNumber}</span>
                                </div>
                                <div className="flex justify-between sm:justify-end gap-10 items-center">
                                    <span className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Issue Date</span>
                                    <span className="text-base font-semibold text-gray-800">{format(new Date(bill.billDate), 'dd MMM yyyy')}</span>
                                </div>
                                {bill.dueDate && (
                                    <div className="flex justify-between sm:justify-end gap-10 items-center">
                                        <span className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Due Date</span>
                                        <span className="text-base font-semibold text-red-600">{format(new Date(bill.dueDate), 'dd MMM yyyy')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mb-8 rounded-xl overflow-x-auto overflow-y-hidden border border-gray-200 shadow-sm">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-gray-100 border-b border-gray-200">
                                    <th className="py-4 px-5 font-bold text-xs text-gray-600 tracking-wider uppercase w-2/5">Item Description</th>
                                    <th className="py-4 px-3 text-center font-bold text-xs text-gray-600 tracking-wider uppercase">Qty</th>
                                    <th className="py-4 px-3 text-right font-bold text-xs text-gray-600 tracking-wider uppercase">Rate</th>
                                    <th className="py-4 px-3 text-right font-bold text-xs text-gray-600 tracking-wider uppercase">Dis.</th>
                                    <th className="py-4 px-3 text-right font-bold text-xs text-gray-600 tracking-wider uppercase">Tax</th>
                                    <th className="py-4 px-5 text-right font-bold text-xs text-gray-600 tracking-wider uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {bill.items.map((item, index) => (
                                    <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/30 transition-colors`}>
                                        <td className="py-4 px-5">
                                            <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                                            {item.code && <p className="text-[11px] text-gray-400 mt-0.5 tracking-wider uppercase">{item.code}</p>}
                                        </td>
                                        <td className="py-4 px-3 text-sm text-center font-medium text-gray-700">{item.qty} <span className="text-xs text-gray-400">{item.unit || 'pcs'}</span></td>
                                        <td className="py-4 px-3 text-sm text-right text-gray-700">₹{item.price.toFixed(2)}</td>
                                        <td className={`py-4 px-3 text-sm text-right ${item.discount > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}`}>{item.discount > 0 ? `${item.discount}%` : '-'}</td>
                                        <td className="py-4 px-3 text-sm text-right text-gray-500">{item.gstRate || 0}%</td>
                                        <td className="py-4 px-5 text-sm text-right font-bold text-gray-900">₹{item.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start pt-4 gap-8">
                        <div className="w-full sm:w-1/2 flex flex-col gap-6">
                            {business?.bankDetails?.accountNumber ? (
                                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
                                    <h4 className="font-bold text-blue-900 text-xs mb-3 flex items-center gap-2 tracking-widest uppercase">
                                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                                        Payment Details
                                    </h4>
                                    <div className="space-y-1.5">
                                        <p className="text-sm flex justify-between"><span className="text-gray-500">Bank:</span> <span className="font-bold text-gray-800">{business.bankDetails.bankName}</span></p>
                                        <p className="text-sm flex justify-between"><span className="text-gray-500">A/C Name:</span> <span className="font-bold text-gray-800">{business.bankDetails.accountName}</span></p>
                                        <p className="text-sm flex justify-between"><span className="text-gray-500">A/C No:</span> <span className="font-bold text-gray-800">{business.bankDetails.accountNumber}</span></p>
                                        <p className="text-sm flex justify-between"><span className="text-gray-500">IFSC:</span> <span className="font-bold text-gray-800 tracking-wider">{business.bankDetails.ifscCode}</span></p>
                                        {business.upiId && <p className="text-sm flex justify-between mt-2 pt-2 border-t border-blue-200/50"><span className="text-blue-600 font-medium tracking-wide">UPI:</span> <span className="font-bold text-blue-800">{business.upiId}</span></p>}
                                    </div>
                                </div>
                            ) : business?.upiId && (
                                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
                                    <h4 className="font-bold text-blue-900 text-xs mb-3 flex items-center gap-2 tracking-widest uppercase">UPI Payment</h4>
                                    <p className="text-lg font-bold text-blue-800">{business.upiId}</p>
                                </div>
                            )}
                            <div className="pt-2">
                                <h4 className="font-bold text-gray-400 text-xs mb-2 tracking-widest uppercase">Terms & Conditions</h4>
                                <div className="text-[11px] text-gray-500 leading-relaxed whitespace-pre-line bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    {business?.termsConditions || "1. Goods once sold will not be taken back.\n2. Interest @18% p.a. will be charged if payment is delayed."}
                                </div>
                            </div>
                        </div>

                        <div className="w-full sm:w-1/2">
                            <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-100 shadow-sm">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm items-center"><span className="text-gray-500 font-medium">Subtotal</span><span className="font-bold text-gray-900">₹{bill.subtotal?.toFixed(2) || '0.00'}</span></div>
                                    {bill.totalDiscount > 0 && <div className="flex justify-between text-sm items-center"><span className="text-gray-500 font-medium">Discount</span><span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">- ₹{bill.totalDiscount.toFixed(2)}</span></div>}
                                    {bill.totalGST > 0 && <div className="flex justify-between text-sm items-center"><span className="text-gray-500 font-medium">Tax & GST</span><span className="font-bold text-gray-900">+ ₹{bill.totalGST.toFixed(2)}</span></div>}
                                    <div className="my-4 border-t-2 border-dashed border-gray-200"></div>
                                    <div className="flex justify-between items-center bg-blue-600 rounded-xl p-4 shadow-md mt-4 transform sm:scale-105 transition-transform origin-right">
                                        <span className="font-bold text-blue-100 uppercase tracking-wider text-sm">Total Due</span>
                                        <span className="font-black text-white text-2xl tracking-tight">₹{bill.grandTotal?.toLocaleString('en-IN') || '0'}</span>
                                    </div>
                                    {bill.amountPaid > 0 && (
                                        <>
                                            <div className="flex justify-between text-sm items-center mt-6 pt-4 border-t border-gray-200"><span className="text-gray-500 font-medium">Amount Received</span><span className="font-bold text-gray-900">₹{bill.amountPaid.toLocaleString('en-IN')}</span></div>
                                            <div className="flex justify-between text-sm items-center mt-2"><span className="text-gray-500 font-medium">Balance</span><span className={`font-bold ${bill.balanceDue > 0 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'} px-2 py-0.5 rounded`}>₹{bill.balanceDue > 0 ? bill.balanceDue.toLocaleString('en-IN') : '0'}</span></div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col items-center pb-8">
                        <div className="flex items-center gap-3 text-gray-400 mb-2">
                            <div className="w-12 h-px bg-gray-200"></div>
                            <span className="text-lg">✨</span>
                            <div className="w-12 h-px bg-gray-200"></div>
                        </div>
                        <p className="text-gray-500 font-medium tracking-wide">Thank you for your business!</p>
                        {business?.socialLinks && (
                            <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-gray-400 tracking-wider w-full justify-center">
                                {business.socialLinks.website && <span>🌐 {business.socialLinks.website.replace('https://', '')}</span>}
                                {business.socialLinks.instagram && <span className="text-pink-600/70">IG: {business.socialLinks.instagram}</span>}
                                {business.socialLinks.facebook && <span className="text-blue-600/70">FB: {business.socialLinks.facebook}</span>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillPreview;
