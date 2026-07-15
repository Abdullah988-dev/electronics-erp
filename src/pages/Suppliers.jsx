import React, { useState } from 'react';
import { Plus, Search, Truck, Phone, MapPin, DollarSign, Eye, Edit3, Trash2 } from 'lucide-react';
import { useLedger } from '../context/LedgerContext';

export default function Suppliers() {
  const { state, loading, addSupplier, deleteSupplier } = useLedger();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const suppliers = state.suppliers;

  const filteredSuppliers = suppliers.filter(sup =>
    sup.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sup.phone || '').includes(searchTerm)
  );

  const handleAddSupplier = async () => {
    const name = prompt("Supplier / Company name?");
    if (!name) return;
    const phone = prompt("Phone number?") || '';
    const address = prompt("Address?") || '';

    setIsSaving(true);
    try {
      await addSupplier({ name, phone, address });
    } catch (err) {
      alert("Failed to add supplier: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this supplier?")) return;
    try {
      await deleteSupplier(id);
    } catch (err) {
      alert("Failed to delete supplier: " + err.message);
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
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Suppliers Directory</h1>
            <p className="text-xs text-slate-400 mt-0.5">Manage distributor profiles, trace current net payables, and purchase frequency ledger tracks.</p>
          </div>
        </div>
        <button
          onClick={handleAddSupplier}
          disabled={isSaving}
          className="flex items-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Add New Supplier'}
        </button>
      </div>

      <div className="relative flex items-center max-w-md">
        <Search className="absolute left-4 text-slate-400 w-5 h-5 pointer-events-none" />
        <input
          type="text"
          placeholder="Search supplier by Company or Phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full py-3 pl-12 pr-4 bg-white border border-slate-200 focus:ring-indigo-100 focus:border-indigo-500 rounded-xl shadow-sm text-sm transition-all focus:outline-none focus:ring-4 placeholder:text-slate-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredSuppliers.length > 0 ? (
          filteredSuppliers.map((sup) => (
            <div key={sup.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all flex flex-col justify-between group">
              
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base group-hover:text-indigo-600 transition-colors">{sup.name}</h3>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sup.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{sup.address}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Net Ledger Balance</span>
                  <div className={`flex items-center font-mono font-bold text-sm mt-0.5 ${
                    (sup.totalPayable || 0) > 0 ? 'text-rose-600' : 'text-slate-400'
                  }`}>
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>
                      {(sup.totalPayable || 0) > 0
                        ? `Payable: PKR ${sup.totalPayable.toLocaleString()}`
                        : 'Clear (0)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button title="View Ledger Summary" className="p-2 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-colors"><Eye className="w-4 h-4" /></button>
                  <button title="Edit Profile" className="p-2 hover:bg-slate-50 text-slate-400 hover:text-amber-600 rounded-xl transition-colors"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(sup.id)} title="Delete Record" className="p-2 hover:bg-slate-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="md:col-span-2 p-8 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-100">
            No supplier profile matches your current search terms.
          </div>
        )}
      </div>

    </div>
  );
}