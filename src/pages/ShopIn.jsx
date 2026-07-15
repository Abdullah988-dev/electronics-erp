import React, { useState, useMemo } from 'react';
import { Plus, Search, ArrowDownCircle, Package, Edit3, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLedger } from '../context/LedgerContext';
import Modal from '../components/UI/Modal';

const CATEGORIES = [
  'Ceiling Fan', 'Pedestal Fan', 'Exhaust Fan', 'Room Cooler',
  'Washing Machine', 'Air Cooler', 'Electric Motor', 'Spare Parts', 'Used Items'
];

const GENERAL_SUPPLIER_NAME = 'Walk-in / General Supplier';

export default function ShopIn() {
  const { state, addSupplier, addShopIn, deleteShopIn } = useLedger();

  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    productName: '', category: CATEGORIES[0], quantity: '', startingPrice: '', supplier: '', remarks: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const totalAmount = (Number(formData.quantity) || 0) * (Number(formData.startingPrice) || 0);

  const rows = useMemo(() => {
    return state.shopInRecords.map((rec) => {
      const firstItem = rec.items?.[0];
      const invItem = state.inventory.find((i) => Number(i.id) === Number(firstItem?.inventoryId));
      const supplier = state.suppliers.find((s) => Number(s.id) === Number(rec.supplierId));
      return {
        id: rec.id,
        productName: invItem?.name || firstItem?.name || '—',
        category: invItem?.category || '',
        qty: firstItem?.qty || 0,
        purchasePrice: firstItem?.purchasePrice || 0,
        amount: rec.totalBill,
        supplierName: supplier?.name || '—',
        date: rec.date,
        raw: rec,
      };
    });
  }, [state.shopInRecords, state.inventory, state.suppliers]);

  const filteredRows = rows.filter((r) => {
    const matchesSearch = r.productName.toLowerCase().includes(searchTerm.toLowerCase()) || r.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const rowDate = new Date(r.date);
    const matchesFrom = !fromDate || rowDate >= new Date(fromDate);
    const matchesTo = !toDate || rowDate <= new Date(toDate + 'T23:59:59');
    return matchesSearch && matchesFrom && matchesTo;
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errors = {};
    if (!formData.productName.trim()) errors.productName = 'Product name required hai.';
    if (!formData.quantity || Number(formData.quantity) <= 0) errors.quantity = 'Quantity positive number honi chahiye.';
    if (!formData.startingPrice || Number(formData.startingPrice) <= 0) errors.startingPrice = 'Starting price positive amount honi chahiye.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({ productName: '', category: CATEGORIES[0], quantity: '', startingPrice: '', supplier: '', remarks: '' });
    setFormErrors({});
    setEditingId(null);
  };

  const openEditModal = (row) => {
    setFormData({
      productName: row.productName === '—' ? '' : row.productName,
      category: row.category || CATEGORIES[0],
      quantity: String(row.qty),
      startingPrice: String(row.purchasePrice),
      supplier: row.supplierName === '—' ? '' : row.supplierName,
      remarks: row.raw.notes || '',
    });
    setEditingId(row.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Ye record delete karna hai? Stock aur balance automatically reverse ho jayenge.')) return;
    try {
      await deleteShopIn(id);
      toast.success('Record deleted successfully.');
    } catch (err) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const supplierName = formData.supplier.trim() || GENERAL_SUPPLIER_NAME;
      let supplierRecord = state.suppliers.find((s) => s.name.toLowerCase() === supplierName.toLowerCase());
      let supplierId = supplierRecord?.id;
      if (!supplierRecord) {
        const created = await addSupplier({ name: supplierName, phone: '', address: '' });
        supplierId = created.id;
      }

      const invItem = state.inventory.find((i) => i.name.toLowerCase() === formData.productName.trim().toLowerCase());

      // Agar edit mode mein hain, pehle purana record delete karo (reverse effects), phir naya banao
      if (editingId) {
        await deleteShopIn(editingId);
      }

      await addShopIn({
        supplierId,
        items: [{
          inventoryId: invItem?.id || null,
          name: formData.productName.trim(),
          category: formData.category,
          qty: Number(formData.quantity),
          purchasePrice: Number(formData.startingPrice),
          salePrice: invItem?.salePrice || 0,
        }],
        totalBill: totalAmount,
        paid: totalAmount,
        paymentMethod: 'Cash',
        notes: formData.remarks,
      });

      toast.success(editingId ? 'Record updated successfully!' : 'Stock incoming saved successfully!', {
        icon: '📥',
        style: { borderRadius: '12px', background: '#0f172a', color: '#fff' },
      });

      resetForm();
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ArrowDownCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Shop — Incoming Stock</h1>
            <p className="text-xs text-slate-400 mt-0.5">Record new stock purchases and track supplier deliveries.</p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Incoming
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative flex items-center">
          <Search className="absolute left-4 text-slate-400 w-5 h-5 pointer-events-none" />
          <input type="text" placeholder="Search product, supplier..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-3 pl-12 pr-4 bg-white border border-slate-200 focus:ring-indigo-100 focus:border-indigo-500 rounded-xl shadow-sm text-sm transition-all focus:outline-none focus:ring-4 placeholder:text-slate-400" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">From</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
            className="w-full py-2.5 px-4 bg-white border border-slate-200 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">To</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
            className="w-full py-2.5 px-4 bg-white border border-slate-200 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-white text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="p-4">Product</th>
                <th className="p-4 text-center">Qty</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4">Supplier</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 text-sm">
              {filteredRows.length > 0 ? (
                filteredRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4 font-semibold text-slate-800">{r.productName}</td>
                    <td className="p-4 text-center font-mono font-bold">{r.qty}</td>
                    <td className="p-4 text-right font-mono font-semibold text-slate-800">PKR {Number(r.amount).toLocaleString()}</td>
                    <td className="p-4 text-slate-500">{r.supplierName}</td>
                    <td className="p-4 text-slate-400 text-xs font-mono">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(r)} title="Edit" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-amber-600 transition-colors"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(r.id)} title="Delete" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-slate-400 font-medium bg-slate-50/30">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="w-8 h-8 text-slate-300" />
                      <span>No incoming stock records</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }} title={editingId ? 'Edit Incoming Stock' : 'Add Incoming Stock'}>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="text-xs font-semibold text-slate-500 tracking-wider uppercase block mb-1.5">Product Name</label>
            <input type="text" name="productName" value={formData.productName} onChange={handleChange} placeholder="e.g., Ceiling Fan 56 GFC"
              className={`w-full py-2.5 px-4 bg-white border rounded-xl shadow-sm text-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-100 ${formErrors.productName ? 'border-rose-300' : 'border-slate-200 focus:border-indigo-500'}`} />
            {formErrors.productName && <p className="text-xs text-rose-500 mt-1">{formErrors.productName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 tracking-wider uppercase block mb-1.5">Category</label>
              <select name="category" value={formData.category} onChange={handleChange}
                className="w-full py-2.5 px-4 bg-white border border-slate-200 focus:ring-indigo-100 focus:border-indigo-500 rounded-xl shadow-sm text-sm transition-all focus:outline-none focus:ring-4 cursor-pointer">
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 tracking-wider uppercase block mb-1.5">Quantity</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="0" min="1"
                className={`w-full py-2.5 px-4 bg-white border rounded-xl shadow-sm text-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-100 ${formErrors.quantity ? 'border-rose-300' : 'border-slate-200 focus:border-indigo-500'}`} />
              {formErrors.quantity && <p className="text-xs text-rose-500 mt-1">{formErrors.quantity}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 tracking-wider uppercase block mb-1.5">Starting Price (Per Unit)</label>
              <input type="number" name="startingPrice" value={formData.startingPrice} onChange={handleChange} placeholder="PKR 0.00" min="1"
                className={`w-full py-2.5 px-4 bg-white border rounded-xl shadow-sm text-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-100 ${formErrors.startingPrice ? 'border-rose-300' : 'border-slate-200 focus:border-indigo-500'}`} />
              {formErrors.startingPrice && <p className="text-xs text-rose-500 mt-1">{formErrors.startingPrice}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 tracking-wider uppercase block mb-1.5">Total Amount</label>
              <div className="py-2.5 px-4 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-mono font-bold text-sm">PKR {totalAmount.toLocaleString()}</div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 tracking-wider uppercase block mb-1.5">Supplier <span className="normal-case font-normal text-slate-400">(optional)</span></label>
            <input type="text" name="supplier" value={formData.supplier} onChange={handleChange} placeholder="e.g., GFC Fans Distribution"
              className="w-full py-2.5 px-4 bg-white border border-slate-200 focus:ring-indigo-100 focus:border-indigo-500 rounded-xl shadow-sm text-sm transition-all focus:outline-none focus:ring-4" />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 tracking-wider uppercase block mb-1.5">Remarks / Notes <span className="normal-case font-normal text-slate-400">(optional)</span></label>
            <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows="2" placeholder="Any additional details..."
              className="w-full py-2.5 px-4 bg-white border border-slate-200 focus:ring-indigo-100 focus:border-indigo-500 rounded-xl shadow-sm text-sm transition-all focus:outline-none focus:ring-4" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm rounded-xl transition-all">Cancel</button>
            <button type="submit" disabled={isSaving} className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition-all">
              {isSaving ? 'Saving...' : editingId ? 'Update' : 'Save'}
            </button>
          </div>

        </form>
      </Modal>

    </div>
  );
}