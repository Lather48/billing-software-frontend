import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSearch } from 'react-icons/fi';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        category: '',
        unit: 'pcs',
        purchasePrice: 0,
        sellingPrice: 0,
        gstRate: 0,
        stock: 0,
        minStockAlert: 10
    });

    const fetchProducts = async () => {
        try {
            const res = await axios.get('https://billing-software-backend-production-0456.up.railway.app/api/products');
            setProducts(res.data);
        } catch (err) {
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // ✅ FIX: Body scroll lock jab modal open ho
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen]);

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingId(product._id);
            setFormData({
                name: product.name,
                code: product.code,
                category: product.category,
                unit: product.unit,
                purchasePrice: product.purchasePrice,
                sellingPrice: product.sellingPrice,
                gstRate: product.gstRate,
                stock: product.stock,
                minStockAlert: product.minStockAlert
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '', code: '', category: '', unit: 'pcs',
                purchasePrice: 0, sellingPrice: 0, gstRate: 0, stock: 0, minStockAlert: 10
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    const handleChange = (e) => {
        // ✅ FIX: Empty string handle karo number fields mein
        const value = e.target.type === 'number'
            ? (e.target.value === '' ? '' : Number(e.target.value))
            : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`https://billing-software-backend-production-0456.up.railway.app/api/products/${editingId}`, formData);
                toast.success('Product updated successfully');
            } else {
                await axios.post('https://billing-software-backend-production-0456.up.railway.app/api/products', formData);
                toast.success('Product added successfully');
            }
            handleCloseModal();
            fetchProducts();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error saving product');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await axios.delete(`https://billing-software-backend-production-0456.up.railway.app/api/products/${id}`);
                toast.success('Product deleted');
                fetchProducts();
            } catch (err) {
                toast.error('Failed to delete product');
            }
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center"
                >
                    <FiPlus className="mr-2" /> Add Product
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
                <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiSearch className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder="Search by name, code or category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">Loading products...</td></tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">No products found.</td></tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.code}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${product.stock > product.minStockAlert
                                                    ? 'bg-green-100 text-green-800'
                                                    : product.stock > 0
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'}`}>
                                                {product.stock} {product.unit}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">₹{product.sellingPrice}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                            <button onClick={() => handleOpenModal(product)} className="text-primary hover:text-blue-900 mx-2" title="Edit">
                                                <FiEdit2 />
                                            </button>
                                            <button onClick={() => handleDelete(product._id)} className="text-red-500 hover:text-red-900 mx-2" title="Delete">
                                                <FiTrash2 />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ✅ FIXED MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-gray-500 bg-opacity-75"
                        onClick={handleCloseModal}
                    />

                    {/* Modal Box - z-10 so it stays above backdrop */}
                    <div className="relative bg-white rounded-lg text-left shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto z-10">
                        <form onSubmit={handleSubmit} className="w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="flex justify-between items-center mb-5">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        {editingId ? 'Edit Product' : 'Add New Product'}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <FiX className="h-6 w-6" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Product Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Product Code / SKU *</label>
                                        <input
                                            type="text"
                                            name="code"
                                            required
                                            value={formData.code}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Category</label>
                                        <input
                                            type="text"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Unit</label>
                                        <select
                                            name="unit"
                                            value={formData.unit}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        >
                                            <option value="pcs">Pieces (pcs)</option>
                                            <option value="kg">Kilograms (kg)</option>
                                            <option value="litre">Litres (L)</option>
                                            <option value="box">Box</option>
                                            <option value="gm">Grams (gm)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Purchase Price</label>
                                        <input
                                            type="number"
                                            name="purchasePrice"
                                            min="0"
                                            step="0.01"
                                            value={formData.purchasePrice}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Selling Price *</label>
                                        <input
                                            type="number"
                                            name="sellingPrice"
                                            min="0"
                                            step="0.01"
                                            required
                                            value={formData.sellingPrice}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">GST Rate (%)</label>
                                        <select
                                            name="gstRate"
                                            value={formData.gstRate}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        >
                                            <option value="0">0%</option>
                                            <option value="5">5%</option>
                                            <option value="12">12%</option>
                                            <option value="18">18%</option>
                                            <option value="28">28%</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Current Stock</label>
                                        <input
                                            type="number"
                                            name="stock"
                                            min="0"
                                            value={formData.stock}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Min Stock Alert Level</label>
                                        <input
                                            type="number"
                                            name="minStockAlert"
                                            min="0"
                                            value={formData.minStockAlert}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer Buttons */}
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    {editingId ? 'Update Product' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;