import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { BusinessContext } from '../../context/BusinessContext';
import { FiMenu, FiBell, FiLogOut } from 'react-icons/fi';

const Navbar = ({ toggleSidebar }) => {
    const { user, logout } = useContext(AuthContext);
    const { business } = useContext(BusinessContext);

    return (
        <nav className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm print:hidden">
            <div className="flex items-center">
                <button
                    onClick={toggleSidebar}
                    className="text-gray-500 hover:text-primary md:hidden p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <FiMenu className="h-6 w-6" />
                </button>
                <div className="hidden md:block">
                    <h1 className="text-xl font-bold text-primary">
                        {business ? business.name : 'BillEasy'}
                    </h1>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <button className="text-gray-500 hover:text-primary p-2">
                    <FiBell className="h-5 w-5" />
                </button>
                <div className="relative flex items-center space-x-3 cursor-pointer">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="hidden sm:block">
                        <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                        <span className="block text-xs text-gray-500 capitalize">{user?.role}</span>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="text-gray-500 hover:text-danger p-2 flex items-center space-x-1"
                    title="Logout"
                >
                    <FiLogOut className="h-5 w-5" />
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
