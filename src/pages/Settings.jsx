import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { BusinessContext } from '../context/BusinessContext';
import toast from 'react-hot-toast';
import { FiSave, FiUpload, FiSmartphone, FiRefreshCw } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';

const Settings = () => {
    const { user } = useContext(AuthContext);
    const { business, setBusiness } = useContext(BusinessContext);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [whatsappStatus, setWhatsappStatus] = useState('initializing');
    const [whatsappQR, setWhatsappQR] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        gstNumber: '',
        panNumber: '',
        businessType: 'Retail',
        invoicePrefix: 'BILL',
        invoiceCounter: 1,
        upiId: '',
        bankDetails: {
            accountName: '',
            accountNumber: '',
            ifscCode: '',
            bankName: '',
            branch: ''
        },
        socialLinks: {
            instagram: '',
            facebook: '',
            twitter: '',
            website: ''
        },
        termsConditions: '',
        logo: ''
    });

    useEffect(() => {
        if (business) {
            setFormData({
                name: business.name || '',
                phone: business.phone || '',
                email: business.email || '',
                address: business.address || '',
                gstNumber: business.gstNumber || '',
                panNumber: business.panNumber || '',
                businessType: business.businessType || 'Retail',
                invoicePrefix: business.invoicePrefix || 'BILL',
                invoiceCounter: business.invoiceCounter || 1,
                upiId: business.upiId || '',
                bankDetails: {
                    accountName: business.bankDetails?.accountName || '',
                    accountNumber: business.bankDetails?.accountNumber || '',
                    ifscCode: business.bankDetails?.ifscCode || '',
                    bankName: business.bankDetails?.bankName || '',
                    branch: business.bankDetails?.branch || ''
                },
                socialLinks: {
                    instagram: business.socialLinks?.instagram || '',
                    facebook: business.socialLinks?.facebook || '',
                    twitter: business.socialLinks?.twitter || '',
                    website: business.socialLinks?.website || ''
                },
                termsConditions: business.termsConditions || '1. Goods once sold will not be taken back.\n2. Interest @18% p.a. will be charged if payment is delayed.',
                logo: business.logo || ''
            });
        }
    }, [business]);

    useEffect(() => {
        let interval;
        if (activeTab === 'whatsapp' && whatsappStatus !== 'connected') {
            const fetchStatus = async () => {
                try {
                    const res = await axios.get('http://16.171.253.179:5000/api/business/whatsapp-status', {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    setWhatsappStatus(res.data.status);
                    setWhatsappQR(res.data.qrCode);
                } catch (err) {
                    console.error('Failed to fetch WhatsApp status');
                }
            };
            fetchStatus();
            interval = setInterval(fetchStatus, 30000);
        }
        return () => clearInterval(interval);
    }, [activeTab, whatsappStatus]);

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Image size should be less than 2MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, logo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('bank.')) {
            const bankField = name.split('.')[1];
            setFormData({
                ...formData,
                bankDetails: {
                    ...formData.bankDetails,
                    [bankField]: value
                }
            });
        } else if (name.startsWith('social.')) {
            const socialField = name.split('.')[1];
            setFormData({
                ...formData,
                socialLinks: {
                    ...formData.socialLinks,
                    [socialField]: value
                }
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.put('http://16.171.253.179:5000/api/business', formData);
            setBusiness(res.data);
            toast.success('Business settings updated successfully!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <h2 className="text-2xl font-bold text-gray-800">Settings</h2>

            <div className="flex space-x-1 border-b border-gray-200">
                {[
                    { id: 'profile', label: 'Business Profile' },
                    { id: 'invoice', label: 'Invoice Layout & Prefixes' },
                    { id: 'bank', label: 'Bank & UPI Details' },
                    { id: 'social', label: 'Social & Web Links' },
                    { id: 'whatsapp', label: 'WhatsApp Bot' },
                    { id: 'users', label: 'User Management' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-2 px-4 text-sm font-medium outline-none transition-colors border-b-2 rounded-t-lg
              ${activeTab === tab.id ? 'border-primary text-primary bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
            `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6">

                    {activeTab === 'profile' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex items-center space-x-6">
                                <div className="h-24 w-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                                    {formData.logo ? (
                                        <img src={formData.logo} alt="Logo Preview" className="h-full w-full object-contain bg-white" />
                                    ) : (
                                        <span className="text-gray-400 text-sm">Logo</span>
                                    )}
                                </div>
                                <div className="relative">
                                    <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleLogoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <button type="button" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center transition pointer-events-none">
                                        <FiUpload className="mr-2" /> Upload Logo
                                    </button>
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-xs text-gray-500">Recommended: Square image, max 2MB (PNG/JPG)</p>
                                    {formData.logo && (
                                        <button type="button" onClick={() => setFormData({ ...formData, logo: '' })} className="text-xs text-red-500 hover:text-red-700 mt-2 text-left">
                                            Remove Logo
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Business Name</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Business Type</label>
                                    <select name="businessType" value={formData.businessType} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm">
                                        <option value="Retail">Retail</option>
                                        <option value="Medical">Medical</option>
                                        <option value="Restaurant">Restaurant</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">GST Number</label>
                                    <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 uppercase focus:ring-primary focus:border-primary sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">PAN Number</label>
                                    <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 uppercase focus:ring-primary focus:border-primary sm:text-sm" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Address</label>
                                    <textarea name="address" rows="3" value={formData.address} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm"></textarea>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'invoice' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Invoice Prefix</label>
                                    <input type="text" name="invoicePrefix" value={formData.invoicePrefix} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 uppercase focus:ring-primary focus:border-primary sm:text-sm" placeholder="e.g., BILL, INV" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Next Invoice Number</label>
                                    <input type="number" name="invoiceCounter" value={formData.invoiceCounter} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" />
                                    <p className="mt-1 text-xs text-gray-500">Preview: {formData.invoicePrefix}-{new Date().getFullYear()}-{String(formData.invoiceCounter).padStart(4, '0')}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Terms & Conditions</label>
                                    <textarea name="termsConditions" rows="4" value={formData.termsConditions} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm"></textarea>
                                    <p className="mt-1 text-xs text-gray-500">These will be printed at the bottom of the invoice.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bank' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">UPI ID for Payment QR</label>
                                    <input type="text" name="upiId" value={formData.upiId} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" placeholder="yourbusiness@upi" />
                                    <p className="mt-1 text-xs text-gray-500">A QR code for this UPI ID will be generated on invoices.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Account Name</label>
                                    <input type="text" name="bank.accountName" value={formData.bankDetails.accountName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Account Number</label>
                                    <input type="text" name="bank.accountNumber" value={formData.bankDetails.accountNumber} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
                                    <input type="text" name="bank.ifscCode" value={formData.bankDetails.ifscCode} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 uppercase focus:ring-primary focus:border-primary sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                                    <input type="text" name="bank.bankName" value={formData.bankDetails.bankName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'social' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Instagram Handle / URL</label>
                                    <input type="text" name="social.instagram" value={formData.socialLinks.instagram} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" placeholder="@yourbusiness" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Facebook Page URL</label>
                                    <input type="text" name="social.facebook" value={formData.socialLinks.facebook} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" placeholder="facebook.com/yourbusiness" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Twitter (X) Profile</label>
                                    <input type="text" name="social.twitter" value={formData.socialLinks.twitter} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" placeholder="@yourhandle" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Business Website</label>
                                    <input type="url" name="social.website" value={formData.socialLinks.website} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary sm:text-sm" placeholder="https://www.yourdomain.com" />
                                </div>
                                <div className="md:col-span-2 mt-2">
                                    <p className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start">
                                        <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        These links will be elegantly attached to your automated WhatsApp messages to help grow your online presence.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'whatsapp' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl flex flex-col items-center justify-center text-center">
                                <FiSmartphone className="text-emerald-500 w-12 h-12 mb-4" />
                                <h3 className="text-lg font-bold text-emerald-900 mb-2">Automated WhatsApp Invoices</h3>
                                <p className="text-sm text-emerald-700 max-w-md mb-6">
                                    Link your WhatsApp account to automatically send PDF invoices to your customers when a new bill is created.
                                </p>
                                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center min-w-[280px]">
                                    {whatsappStatus === 'connected' ? (
                                        <div className="text-center space-y-3">
                                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                            </div>
                                            <h4 className="font-bold text-gray-900">Successfully Connected!</h4>
                                            <p className="text-sm text-gray-500">Your bot is active and ready to send invoices.</p>
                                        </div>
                                    ) : whatsappStatus === 'qr_ready' && whatsappQR ? (
                                        <div className="text-center">
                                            <h4 className="font-bold text-gray-800 mb-4">Scan QR to Link Device</h4>
                                            <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 mb-4 inline-block">
                                                <QRCodeSVG value={whatsappQR} size={200} />
                                            </div>
                                            <ol className="text-xs text-left text-gray-600 space-y-2 list-decimal list-inside max-w-xs mx-auto">
                                                <li>Open WhatsApp on your phone</li>
                                                <li>Tap Menu (<span className="font-bold px-1">⋮</span>) or Settings</li>
                                                <li>Select <span className="font-bold">Linked Devices</span></li>
                                                <li>Tap <span className="font-bold">Link a Device</span> and scan the code</li>
                                            </ol>
                                        </div>
                                    ) : (
                                        <div className="text-center space-y-4 py-8">
                                            <FiRefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
                                            <p className="text-sm text-gray-500 font-medium">Initializing WhatsApp Bot...</p>
                                            <p className="text-xs text-gray-400">This may take up to a minute when starting the server.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <div>
                                    <h4 className="font-bold text-blue-900">Multi User Management</h4>
                                    <p className="text-sm text-blue-800">Available on PRO Plan</p>
                                </div>
                                <button type="button" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600">
                                    Upgrade to PRO
                                </button>
                            </div>
                            <div className="mt-4">
                                <h4 className="font-medium text-gray-800 mb-3">Current Users</h4>
                                <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                                    <div className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-900">{user?.name}</p>
                                            <p className="text-sm text-gray-500">{user?.email}</p>
                                        </div>
                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-md capitalize">
                                            {user?.role || 'Admin'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading || activeTab === 'users'}
                            className="bg-primary hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition flex items-center shadow-sm"
                        >
                            <FiSave className="mr-2" />
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default Settings;
