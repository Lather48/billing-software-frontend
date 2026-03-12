import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiSave, FiPrinter } from 'react-icons/fi';
import { BusinessContext } from '../context/BusinessContext';

const API = 'https://server.robinlather.in';

const NewBill = () => {
    const navigate = useNavigate();
    const { business } = useContext(BusinessContext);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [walkinName, setWalkinName] = useState('');
    const [walkinPhone, setWalkinPhone] = useState('');
    const [billDate, setBillDate] = useState(new Date().toISOString().substring(0, 10));
    const [dueDate, setDueDate] = useState('');

    const [items, setItems] = useState([]);
    const [searchProduct, setSearchProduct] = useState('');

    const [paymentMode, setPaymentMode] = useState('cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [custRes, prodRes] = await Promise.all([
                    axios.get(`${API}/api/customers`),
                    axios.get(`${API}/api/products`)
                ]);
                setCustomers(custRes.data);
                setProducts(prodRes.data);
            } catch (err) {
                toast.error('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const addProductToBill = (product) => {
        const existingItemIndex = items.findIndex(i => i.product === product._id);
        if (existingItemIndex >= 0) {
            const newItems = [...items];
            newItems[existingItemIndex].qty += 1;
            setItems(newItems);
        } else {
            setItems([...items, {
                product: product._id,
                name: product.name,
                code: product.code,
                qty: 1,
                unit: product.unit,
                price: product.sellingPrice,
                discount: 0,
                gstRate: product.gstRate,
                stock: product.stock
            }]);
        }
        setSearchProduct('');
    };

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const removeItem = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let totalDiscount = 0;
        let totalGST = 0;

        const enrichedItems = items.map(item => {
            const rawLineTotal = item.qty * item.price;
            const lineDiscount = (rawLineTotal * (item.discount || 0)) / 100;
            const taxableAmount = rawLineTotal - lineDiscount;
            const gstAmount = (taxableAmount * (item.gstRate || 0)) / 100;
            const lineTotal = taxableAmount + gstAmount;

            subtotal += rawLineTotal;
            totalDiscount += lineDiscount;
            totalGST += gstAmount;

            return { ...item, gstAmount, total: lineTotal, taxableAmount };
        });

        const taxableAmount = subtotal - totalDiscount;
        const cgst = totalGST / 2;
        const sgst = totalGST / 2;
        const grandTotal = Math.round(taxableAmount + totalGST);

        return { enrichedItems, subtotal, totalDiscount, taxableAmount, totalGST, cgst, sgst, grandTotal };
    };

    const totals = calculateTotals();
    const paidVal = Number(amountPaid) || 0;
    const balanceDue = totals.grandTotal - paidVal;

    const handleSaveBill = async (action = 'save', skipPaymentCheck = false) => {
        if (items.length === 0) return toast.error('Please add at least one item');

        let customerData = {};
        if (selectedCustomer) {
            customerData.customer = selectedCustomer;
        } else if (walkinName) {
            customerData.customerName = walkinName;
            customerData.customerPhone = walkinPhone;
        } else {
            return toast.error('Please select a customer or enter walk-in details');
        }

        if (paymentMode === 'upi' && !skipPaymentCheck && business?.upiId) {
            setPendingAction(action);
            setShowPaymentModal(true);
            return;
        }

        const billData = {
            ...customerData,
            items: totals.enrichedItems,
            subtotal: totals.subtotal,
            totalDiscount: totals.totalDiscount,
            taxableAmount: totals.taxableAmount,
            totalGST: totals.totalGST,
            cgst: totals.cgst,
            sgst: totals.sgst,
            grandTotal: totals.grandTotal,
            paymentMode,
            amountPaid: paidVal,
            balanceDue: balanceDue,
            status: balanceDue <= 0 ? 'paid' : (paidVal > 0 ? 'partial' : 'pending'),
            notes,
            billDate,
            dueDate
        };

        try {
            const res = await axios.post(`${API}/api/bills`, billData);
            toast.success('Bill generated successfully');
            if (action === 'pdf') {
                navigate(`/bills/preview/${res.data._id}`);
            } else {
                navigate('/bills');
            }
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.requiresUpgrade) {
                toast.error(err.response.data.message, { duration: 6000, icon: '🔒' });
                navigate('/subscription');
            } else {
                toast.error(err.response?.data?.message || 'Failed to save bill');
            }
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        p.code.toLowerCase().includes(searchProduct.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-7xl pb-12">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Create New Bill</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Billing Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Select Customer</label>
                                <select className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-primary sm:text-sm" value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)}>
                                    <option value="">-- Walk-in Customer --</option>
                                    {customers.map(c => (
                                        <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                                    ))}
                                </select>
                            </div>
                            {!selectedCustomer && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Walk-in Name</label>
                                        <input type="text" value={walkinName} onChange={e => setWalkinName(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-primary sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Walk-in Phone</label>
                                        <input type="text" value={walkinPhone} onChange={e => setWalkinPhone(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-primary sm:text-sm" />
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Bill Date</label>
                                <input type="date" value={billDate} onChange={e => setBillDate(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-primary sm:text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Due Date (Optional)</label>
                                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-primary sm:text-sm" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Add Items</h3>
                        <div className="relative mb-4">
                            <input type="text" value={searchProduct} onChange={(e) => setSearchProduct(e.target.value)} placeholder="🔍 Search product by name or code to add..." className="w-full border border-gray-300 rounded-md py-2 px-3 pl-10 focus:outline-none focus:ring-primary sm:text-sm" />
                            {searchProduct && (
                                <div className="absolute z-10 mt-1 w-full bg-white max-h-60 overflow-y-auto border border-gray-200 rounded-md shadow-lg">
                                    {filteredProducts.map(product => (
                                        <div key={product._id} className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between" onClick={() => addProductToBill(product)}>
                                            <span>{product.name} ({product.code})</span>
                                            <span className="text-gray-500 font-medium w-32 text-right">₹{product.sellingPrice} | Stock: {product.stock}</span>
                                        </div>
                                    ))}
                                    {filteredProducts.length === 0 && <div className="px-4 py-2 text-gray-500">No products found</div>}
                                </div>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50 border-y border-gray-200">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-20">Qty</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-24">Price</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-20">Disc(%)</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-20">GST(%)</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                                        <th className="px-3 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {items.length === 0 ? (
                                        <tr><td colSpan="7" className="py-8 text-center text-sm text-gray-500">No items added to the bill yet.</td></tr>
                                    ) : (
                                        totals.enrichedItems.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-3 py-2 text-sm text-gray-900 font-medium">{item.name} <span className="text-xs text-gray-500 block">{item.code}</span></td>
                                                <td className="px-3 py-2"><input type="number" min="1" value={item.qty} onChange={(e) => updateItem(index, 'qty', Number(e.target.value))} className="w-full border border-gray-300 rounded px-1 py-1 text-sm" /></td>
                                                <td className="px-3 py-2"><input type="number" min="0" value={item.price} onChange={(e) => updateItem(index, 'price', Number(e.target.value))} className="w-full border border-gray-300 rounded px-1 py-1 text-sm" /></td>
                                                <td className="px-3 py-2"><input type="number" min="0" max="100" value={item.discount} onChange={(e) => updateItem(index, 'discount', Number(e.target.value))} className="w-full border border-gray-300 rounded px-1 py-1 text-sm" /></td>
                                                <td className="px-3 py-2 text-sm text-gray-500">{item.gstRate}%</td>
                                                <td className="px-3 py-2 text-sm text-right font-medium">₹{item.total.toFixed(2)}</td>
                                                <td className="px-3 py-2 text-right"><button onClick={() => removeItem(index)} className="text-danger hover:text-red-700 p-1"><FiTrash2 size={16} /></button></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Bill Summary</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-gray-600">Subtotal:</span><span className="font-medium text-gray-900">₹{totals.subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between text-emerald-600"><span>Discount:</span><span>- ₹{totals.totalDiscount.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-600">Taxable Amount:</span><span className="font-medium text-gray-900">₹{totals.taxableAmount.toFixed(2)}</span></div>
                            <div className="flex justify-between text-gray-500 text-xs"><span>CGST:</span><span>₹{totals.cgst.toFixed(2)}</span></div>
                            <div className="flex justify-between text-gray-500 text-xs pb-3 border-b"><span>SGST:</span><span>₹{totals.sgst.toFixed(2)}</span></div>
                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <span className="text-lg font-bold text-gray-900">Total:</span>
                                <span className="text-2xl font-black text-primary">₹{totals.grandTotal.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['cash', 'upi', 'card', 'credit'].map(mode => (
                                    <button key={mode} type="button" onClick={() => setPaymentMode(mode)} className={`px-3 py-2 rounded text-sm font-medium capitalize border transition-all ${paymentMode === mode ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {paymentMode !== 'credit' && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">Amount Received (₹)</label>
                                <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder={`Amount eq. to ₹${totals.grandTotal}`} className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 text-lg font-medium focus:outline-none focus:ring-primary" />
                                {paidVal > totals.grandTotal && <p className="mt-2 text-sm text-green-600 font-medium">Change Due: ₹{(paidVal - totals.grandTotal).toLocaleString()}</p>}
                                {paidVal < totals.grandTotal && paidVal > 0 && <p className="mt-2 text-sm text-amber-600 font-medium">Balance Due: ₹{(totals.grandTotal - paidVal).toLocaleString()}</p>}
                            </div>
                        )}

                        <div className="mt-6 space-y-3">
                            <button onClick={() => handleSaveBill('save')} className="w-full bg-primary hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center transition shadow-md">
                                <FiSave className="mr-2 h-5 w-5" /> Save Bill
                            </button>
                            <button onClick={() => handleSaveBill('pdf')} className="w-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-medium py-2.5 px-4 rounded-lg flex items-center justify-center transition">
                                <FiPrinter className="mr-2 h-5 w-5 text-gray-500" /> Save & Print
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showPaymentModal && business?.upiId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Scan to Pay</h3>
                        <p className="text-gray-500 mb-6 font-medium tracking-wide">UPI ID: {business.upiId}</p>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 inline-block mb-6 shadow-inner">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${business.upiId}%26pn=${encodeURIComponent(business.name || 'Business')}%26am=${balanceDue > 0 ? balanceDue : totals.grandTotal}%26cu=INR`}
                                alt="UPI QR Code"
                                className="w-48 h-48 object-contain mx-auto"
                                crossOrigin="anonymous"
                            />
                            <div className="mt-3 text-lg font-bold text-primary">₹{(balanceDue > 0 ? balanceDue : totals.grandTotal).toLocaleString('en-IN')}</div>
                        </div>
                        <div className="space-y-3">
                            <button onClick={() => { setShowPaymentModal(false); handleSaveBill(pendingAction, true); }} className="w-full bg-primary hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center transition shadow-md">
                                Payment Received & Save
                            </button>
                            <button onClick={() => setShowPaymentModal(false)} className="w-full bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 font-medium py-2 px-4 rounded-lg transition">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewBill;
