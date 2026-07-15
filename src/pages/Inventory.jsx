import React, { useState } from 'react';
import { Plus, Search, SlidersHorizontal, Package, Edit3, Trash2, Copy } from 'lucide-react';
import { useLedger } from "../context/LedgerContext";

export default function Inventory() {
  const { state, loading, addInventoryItem, deleteInventoryItem } = useLedger();
  const inventory = state.inventory;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isSaving, setIsSaving] = useState(false);

  const categories = [
    'All', 'Ceiling Fan', 'Pedestal Fan', 'Exhaust Fan', 'Room Cooler', 
    'Washing Machine', 'Air Cooler', 'Electric Motor', 'Spare Parts', 'Used Items'
  ];

  const getStatus = (qty) => {
    if (qty === 0) return 'Out of Stock';
    if (qty <= 5) return 'Low Stock';
    return 'In Stock';
  };

  const filteredProducts = inventory.filter((prd) => {
    const matchesSearch = prd.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || prd.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddProduct = async () => {
    const name = prompt("Product name?");
    if (!name) return;
    const category = prompt(`Category? (${categories.filter(c => c !== 'All').join(', ')})`) || 'Spare Parts';
    const qty = Number(prompt("Opening quantity?") || 0);
    const purchasePrice = Number(prompt("Purchase price?") || 0);
    const salePrice = Number(prompt("Sale price?") || 0);

    setIsSaving(true);
    try {
      await addInventoryItem({ name, category, qty, purchasePrice, salePrice });
    } catch (err) {
      alert("Failed to add product: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteInventoryItem(id);
    } catch (err) {
      alert("Failed to delete product: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Master Inventory Control</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage stock items, duplicate variants, evaluate pricing models instantly.</p>
        </div>
        <button
          onClick={handleAddProduct}
          disabled={isSaving}
          className="flex items-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Add New Product'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative flex items-center">
          <Search className="absolute left-4 text-slate-400 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            placeholder="Instant search by Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-3 pl-12 pr-4 bg-white border border-slate-200 focus:ring-indigo-100 focus:border-indigo-500 rounded-xl shadow-sm text-sm transition-all focus:outline-none focus:ring-4 placeholder:text-slate-400"
          />
        </div>
        
        <div className="relative flex items-center">
          <SlidersHorizontal className="absolute left-4 text-slate-400 w-4 h-4 pointer-events-none" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full py-3 pl-11 pr-4 bg-white border border-slate-200 focus:ring-indigo-100 focus:border-indigo-500 rounded-xl shadow-sm text-sm transition-all focus:outline-none focus:ring-4 text-slate-600 appearance-none font-medium cursor-pointer"
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-white text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="p-4">Product Details</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-right">Purchase Price</th>
                <th className="p-4 text-right">Sale Price</th>
                <th className="p-4 text-center">Qty</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 text-sm">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((prd) => {
                  const status = getStatus(prd.qty);
                  return (
                    <tr key={prd.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{prd.name}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-lg">{prd.category}</span>
                      </td>
                      <td className="p-4 text-right font-mono font-medium text-slate-500">PKR {Number(prd.purchasePrice || 0).toLocaleString()}</td>
                      <td className="p-4 text-right font-mono font-semibold text-slate-800">PKR {Number(prd.salePrice || 0).toLocaleString()}</td>
                      <td className="p-4 text-center font-mono font-bold text-slate-700">{prd.qty}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-lg ${
                          status === 'In Stock' ? 'bg-emerald-50 text-emerald-600' :
                          status === 'Low Stock' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button title="Duplicate product" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"><Copy className="w-4 h-4" /></button>
                          <button title="Edit item" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-amber-600 transition-colors"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(prd.id)} title="Delete record" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 font-medium bg-slate-50/30">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="w-8 h-8 text-slate-300 animate-bounce" />
                      <span>No matched items found in storage tracks.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}