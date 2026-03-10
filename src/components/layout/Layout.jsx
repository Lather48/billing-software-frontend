import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="h-screen flex overflow-hidden bg-background print:overflow-visible print:bg-white print:h-auto">
            <Sidebar isOpen={sidebarOpen} setOpen={setSidebarOpen} />

            <div className="flex-1 flex flex-col w-0 overflow-hidden print:overflow-visible">
                <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 print:p-0 print:overflow-visible">
                    <div className="max-w-7xl mx-auto animate-fade-in print:max-w-none">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
