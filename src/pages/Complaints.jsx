import React, { useState, useEffect } from 'react';
import { Plus, Search, MessageSquareWarning, Phone, Package, Trash2, MessageCircle, Send } from 'lucide-react';
import { apiFetch } from '../services/api';
import Modal from '../components/UI/Modal';
import { COMPLAINT_HANDLERS, DEFAULT_COMPLAINT_HANDLER } from '../config/whatsappConfig';

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedHandlerId, setSelectedHandlerId] = useState(DEFAULT_COMPLAINT_HANDLER.id);

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    product: '',
    complaintDetails: '',
    priority: 'Medium',
  });

  useEffect(() => {
    loadComplaints();
  }, []);

  async function loadComplaints() {
    setLoading(true);
    try {
      const data = await apiFetch('/complaints');
      setComplaints(data);
    } catch (err) {
      console.error('Failed to load complaints:', err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredComplaints = complaints.filter((c) =>
    c.CustomerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.Phone || '').includes(searchTerm) ||
    (c.Product || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.phone || !formData.complaintDetails) {
      alert('Customer name, phone, aur complaint details zaroori hain.');
      return;
    }

    setIsSaving(true);
    try {
      const created = await apiFetch('/complaints', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setComplaints([created, ...complaints]);
      setFormData({ customerName: '', phone: '', product: '', complaintDetails: '', priority: 'Medium' });
      setIsModalOpen(false);
    } catch (err) {
      alert('Failed to save complaint: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this complaint?')) return;
    try {
      await apiFetch(`/complaints/${id}`, { method: 'DELETE' });
      setComplaints(complaints.filter((c) => c.Id !== id));
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const updated = await apiFetch(`/complaints/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      setComplaints(complaints.map((c) => (c.Id === id ? updated : c)));
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  // Format any phone number to WhatsApp-ready format (92XXXXXXXXXX, no + sign)
  const formatPhoneForWhatsApp = (phone) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return cleanPhone.startsWith('92') ? cleanPhone : `92${cleanPhone.replace(/^0/, '')}`;
  };

  // Customer ko confirmation message bhejna
  const sendToCustomer = (complaint) => {
    const customerPhone = formatPhoneForWhatsApp(complaint.Phone);

    const message = `Assalam-o-Alaikum ${complaint.CustomerName},\n\nAap ki complaint regarding "${complaint.Product || 'product'}" hum ne receive kar li hai.\n\nComplaint Details: ${complaint.ComplaintDetails}\n\nAap ki complaint 24 se 48 hours mein hal ho jayegi.\n\nHum jald hi is par action lenge. Shukriya.`;

    const url = `https://wa.me/${customerPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Complaint handler ko customer ki detail forward karna
  const forwardToHandler = (complaint) => {
    const handler = COMPLAINT_HANDLERS.find((h) => h.id === selectedHandlerId) || DEFAULT_COMPLAINT_HANDLER;

    const message = `Naya Complaint Forward Ho Raha Hai:\n\nCustomer Name: ${complaint.CustomerName}\nContact Number: ${complaint.Phone}\nProduct: ${complaint.Product || 'N/A'}\nPriority: ${complaint.Priority}\n\nComplaint Details:\n${complaint.ComplaintDetails}\n\nBaraye meherbani is masle ko resolve karein.`;

    const url = `https://wa.me/${handler.phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const getStatusColor = (status) => {
    if (status === 'Resolved') return 'bg-emerald-50 text-emerald-600';
    if (status === 'In Progress') return 'bg-amber-50 text-amber-600';
    return 'bg-rose-50 text-rose-600';
  };

  const getPriorityColor = (priority) => {
    if (priority === 'High') return 'bg-rose-100 text-rose-700';
    if (priority === 'Low') return 'bg-slate-100 text-slate-600';
    return 'bg-amber-100 text-amber-700';
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
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <MessageSquareWarning className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Complaint Register</h1>
            <p className="text-xs text-slate-400 mt-0.5">Track customer complaints aur unhe WhatsApp par directly respond karein.</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> New Complaint
        </button>
      </div>

      {/* Complaint Handler Selector — future mein zyada handlers add hone par yahan dropdown se select hoga */}
      {COMPLAINT_HANDLERS.length > 1 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Forward complaints to:</span>
          <select
            value={selectedHandlerId}
            onChange={(e) => setSelectedHandlerId(e.target.value)}
            className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            {COMPLAINT_HANDLERS.map((handler) => (
              <option key={handler.id} value={handler.id}>{handler.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="relative flex items-center max-w-md">
        <Search className="absolute left-4 text-slate-400 w-5 h-5 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by customer, phone, or product..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full py-3 pl-12 pr-4 bg-white border border-slate-200 focus:ring-indigo-100 focus:border-indigo-500 rounded-xl shadow-sm text-sm transition-all focus:outline-none focus:ring-4 placeholder:text-slate-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredComplaints.length > 0 ? (
          filteredComplaints.map((c) => (
            <div key={c.Id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all flex flex-col justify-between">
              
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{c.CustomerName}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-1">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{c.Phone}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${getPriorityColor(c.Priority)}`}>
                    {c.Priority}
                  </span>
                </div>

                {c.Product && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-3">
                    <Package className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.Product}</span>
                  </div>
                )}

                <p className="text-sm text-slate-600 mt-3 leading-relaxed">{c.ComplaintDetails}</p>

                <span className="text-[10px] text-slate-400 font-mono mt-2 block">
                  {new Date(c.ComplaintDate).toLocaleString()}
                </span>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-50 flex flex-col gap-3">
                <select
                  value={c.Status}
                  onChange={(e) => handleStatusChange(c.Id, e.target.value)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border-none outline-none cursor-pointer w-fit ${getStatusColor(c.Status)}`}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => sendToCustomer(c)}
                    title="Send confirmation to customer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> Message Customer
                  </button>
                  <button
                    onClick={() => forwardToHandler(c)}
                    title="Forward complaint to handler"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Send className="w-4 h-4" /> Forward Complaint
                  </button>
                  <button
                    onClick={() => handleDelete(c.Id)}
                    title="Delete complaint"
                    className="p-2 hover:bg-slate-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="md:col-span-2 p-8 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-100">
            Koi complaint record nahi mila.
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Complaint">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="text-xs font-semibold text-slate-500 tracking-wider uppercase block mb-1.5">Customer Name</label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="e.g., Muhammad Ali"
              className="w-full py-2.5 px-4 bg-white border border-slate-200 focus:ring-indigo-100 focus:border-indigo-500 rounded-xl shadow-sm text-sm transition-all focus:outline-none focus:ring-4"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 tracking-wider uppercase block mb-1.5">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g., 03001234567"
              className="w-full py-2.5 px-4 bg-white border border-slate-200 focus:ring-indigo-100 focus:border-indigo-500 rounded-xl shadow-sm text-sm transition-all focus:outline-none focus:ring-4"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 tracking-wider uppercase block mb-1.5">Product (optional)</label>
            <input
              type="text"
              name="product"
              value={formData.product}
              onChange={handleChange}
              placeholder="e.g., Washing Machine 12KG"
              className="w-full py-2.5 px-4 bg-white border border-slate-200 focus:ring-indigo-100 focus:border-indigo-500 rounded-xl shadow-sm text-sm transition-all focus:outline-none focus:ring-4"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 tracking-wider uppercase block mb-1.5">Priority</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full py-2.5 px-4 bg-white border border-slate-200 focus:ring-indigo-100 focus:border-indigo-500 rounded-xl shadow-sm text-sm transition-all focus:outline-none focus:ring-4 cursor-pointer"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 tracking-wider uppercase block mb-1.5">Complaint Details</label>
            <textarea
              name="complaintDetails"
              value={formData.complaintDetails}
              onChange={handleChange}
              rows="4"
              placeholder="Describe the issue in detail..."
              className="w-full py-2.5 px-4 bg-white border border-slate-200 focus:ring-indigo-100 focus:border-indigo-500 rounded-xl shadow-sm text-sm transition-all focus:outline-none focus:ring-4"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
            >
              {isSaving ? 'Saving...' : 'Register Complaint'}
            </button>
          </div>

        </form>
      </Modal>

    </div>
  );
}