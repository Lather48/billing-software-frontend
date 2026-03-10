import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { BusinessContext } from '../context/BusinessContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiCheck, FiStar } from 'react-icons/fi';

const Subscription = () => {
    const { business, setBusiness } = useContext(BusinessContext);
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);

    const currentPlan = business?.subscriptionPlan || 'free';

    // Check if subscription has expired
    const isExpired = business?.subscriptionExpiry && new Date() > new Date(business.subscriptionExpiry);
    const [planState, setPlanState] = useState(isExpired ? 'expired' : currentPlan);

    const handleUpgrade = async (plan) => {
        if (planState === plan && !isExpired) {
            toast.success(`You are already on the ${plan.toUpperCase()} plan!`);
            return;
        }

        setLoading(true);
        try {
            const res = await axios.put('https://billing-software-backend-production-0456.up.railway.app/api/business/upgrade', { plan }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setBusiness(res.data.business);
            setPlanState(plan);
            toast.success(`Successfully upgraded to ${plan.toUpperCase()} plan!`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upgrade failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const plans = [
        {
            id: 'monthly',
            name: 'Pro Monthly',
            price: '₹199',
            duration: '/mo',
            features: [
                'Unlimited Invoices',
                'Automated WhatsApp Bot',
                'Advanced Reports & Analytics',
                'Export to Excel',
                '24/7 Priority Support'
            ]
        },
        {
            id: 'biannual',
            name: 'Pro Half-Yearly',
            price: '₹999',
            duration: '/6 mo',
            popular: true,
            features: [
                'Unlimited Invoices',
                'Automated WhatsApp Bot',
                'Advanced Reports & Analytics',
                'Export to Excel',
                'Multi-user Management',
                'Priority Support'
            ]
        },
        {
            id: 'yearly',
            name: 'Pro Annually',
            price: '₹1999',
            duration: '/yr',
            features: [
                'Unlimited Invoices',
                'Automated WhatsApp Bot',
                'Advanced Reports & Analytics',
                'Export to Excel',
                'Multi-user Management',
                'Custom Invoice Layouts',
                'Dedicated Account Manager'
            ]
        }
    ];

    return (
        <div className="max-w-6xl mx-auto py-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                    Upgrade Your Business
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                    Unlock unlimited invoices, automated WhatsApp bots, and detailed reports.
                </p>

                <div className="mt-8 inline-block bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-left min-w-[300px]">
                    <p className="text-sm text-gray-500 font-medium">CURRENT SUBSCRIPTION</p>
                    <div className="mt-2 flex items-center justify-between">
                        <div>
                            <p className="text-2xl font-bold text-gray-900 capitalize">{planState === 'free' ? 'Free Tier' : `${planState} Plan`}</p>
                            {isExpired && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">Expired</span>}
                        </div>
                        {business?.subscriptionExpiry && !isExpired && (
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Valid Until</p>
                                <p className="text-sm font-semibold text-gray-800">{formatDate(business.subscriptionExpiry)}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Free Plan */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col opacity-80">
                    <h3 className="text-xl font-bold text-gray-900">Free Tier</h3>
                    <p className="mt-4 flex items-baseline text-gray-900">
                        <span className="text-4xl font-extrabold tracking-tight">₹0</span>
                        <span className="ml-1 text-xl font-semibold">/forever</span>
                    </p>
                    <p className="mt-6 text-gray-500">Perfect for trying out the platform.</p>

                    <ul className="mt-6 space-y-4 flex-1">
                        <li className="flex">
                            <FiCheck className="flex-shrink-0 w-5 h-5 text-gray-400" />
                            <span className="ml-3 text-gray-500">Up to 100 Invoices</span>
                        </li>
                        <li className="flex">
                            <FiCheck className="flex-shrink-0 w-5 h-5 text-gray-400" />
                            <span className="ml-3 text-gray-500">Basic PDF Generation</span>
                        </li>
                        <li className="flex">
                            <FiCheck className="flex-shrink-0 w-5 h-5 text-gray-400" />
                            <span className="ml-3 text-gray-500">Inventory Tracking</span>
                        </li>
                    </ul>

                    <button
                        disabled
                        className="mt-8 block w-full bg-gray-100 text-gray-500 rounded-lg px-4 py-3 text-sm font-semibold text-center border border-gray-200"
                    >
                        {planState === 'free' ? 'Current Plan' : 'Downgrade not available'}
                    </button>
                </div>

                {/* Paid Plans */}
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`bg-white rounded-2xl shadow-xl border ${plan.popular ? 'border-primary ring-2 ring-primary ring-opacity-50 relative' : 'border-gray-200'} p-8 flex flex-col transform transition hover:-translate-y-1`}
                    >
                        {plan.popular && (
                            <div className="absolute top-0 inset-x-0 -mt-4 flex justify-center">
                                <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide flex items-center shadow-md">
                                    <FiStar className="mr-1" /> Most Popular
                                </span>
                            </div>
                        )}
                        <h3 className={`text-xl font-bold ${plan.popular ? 'text-primary' : 'text-gray-900'}`}>{plan.name}</h3>
                        <p className="mt-4 flex items-baseline text-gray-900">
                            <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                            <span className="ml-1 text-xl font-semibold">{plan.duration}</span>
                        </p>

                        <ul className="mt-6 space-y-4 flex-1">
                            {plan.features.map((feature, idx) => (
                                <li key={idx} className="flex">
                                    <FiCheck className="flex-shrink-0 w-5 h-5 text-green-500" />
                                    <span className="ml-3 text-gray-700">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleUpgrade(plan.id)}
                            disabled={loading || (planState === plan.id && !isExpired)}
                            className={`mt-8 block w-full rounded-lg px-4 py-3 text-sm font-bold text-center transition shadow-sm
                                ${planState === plan.id && !isExpired
                                    ? 'bg-green-100 text-green-800 border-green-200 cursor-not-allowed'
                                    : plan.popular
                                        ? 'bg-primary text-white hover:bg-blue-600'
                                        : 'bg-blue-50 text-primary hover:bg-blue-100 border border-blue-200'
                                }
                            `}
                        >
                            {loading ? 'Processing...' : (planState === plan.id && !isExpired ? 'Active Plan' : (isExpired && planState === plan.id ? 'Renew Plan' : 'Upgrade Now'))}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Subscription;
