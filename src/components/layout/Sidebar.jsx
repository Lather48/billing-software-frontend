import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { BusinessContext } from '../../context/BusinessContext';
import {
    FiHome, FiFileText, FiPlusSquare,
    FiBox, FiUsers, FiPieChart, FiSettings
} from 'react-icons/fi';

const navItems = [
    { name: 'Dashboard', path: '/', icon: FiHome },
    { name: 'New Bill', path: '/bills/new', icon: FiPlusSquare },
    { name: 'Invoices', path: '/bills', icon: FiFileText },
    { name: 'Inventory', path: '/inventory', icon: FiBox },
    { name: 'Customers', path: '/customers', icon: FiUsers },
    { name: 'Reports', path: '/reports', icon: FiPieChart },
    { name: 'Settings', path: '/settings', icon: FiSettings },
];

const Sidebar = ({ isOpen, setOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { business } = useContext(BusinessContext);

    const currentPlan = business?.subscriptionPlan || 'free';
    const isExpired = business?.subscriptionExpiry && new Date() > new Date(business.subscriptionExpiry);

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity md:hidden print:hidden"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Sidebar sidebar */}
            <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-sidebar text-white transform transition duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 print:hidden
      `}>
                <div className="flex items-center justify-center h-16 border-b border-gray-700 md:hidden bg-sidebar">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-primary">
                        BillEasy
                    </h1>
                </div>

                <div className="hidden md:flex items-center justify-center h-16 border-b border-gray-700">
                    <h1 className="text-2xl font-bold tracking-wider">Bill<span className="text-primary">Easy</span></h1>
                </div>

                <nav className="mt-6 px-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                  ${isActive
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'}
                `}
                                onClick={() => setOpen(false)} // Close on mobile after click
                            >
                                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
                    <div className="bg-gray-800 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-400">Current Plan</p>
                        <p className={`font-semibold text-sm truncate ${isExpired ? 'text-red-400' : 'text-success'} capitalize`}>
                            {currentPlan === 'free' ? 'Free Tier' : `${currentPlan} Plan`}
                            {isExpired && ' (Expired)'}
                        </p>
                        <button
                            onClick={() => {
                                setOpen(false);
                                navigate('/subscription');
                            }}
                            className="mt-2 text-xs w-full bg-primary hover:bg-blue-600 text-white rounded px-2 py-1 transition-colors z-10 block pointer-events-auto cursor-pointer relative"
                        >
                            {currentPlan === 'free' || isExpired ? 'Upgrade Now' : 'Manage Plan'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
