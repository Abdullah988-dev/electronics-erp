import React, { createContext, useContext, useReducer, useEffect, useState } from "react";
import { apiFetch } from "../services/api";

const LedgerContext = createContext(null);

const defaultState = {
  inventory: [],
  suppliers: [],
  customers: [],
  shopInRecords: [],
  shopOutRecords: [],
};

function mapInventoryItem(item) {
  return {
    id: Number(item.Id),
    name: item.Name,
    category: item.Category,
    qty: Number(item.Qty),
    purchasePrice: Number(item.PurchasePrice),
    salePrice: Number(item.SalePrice),
  };
}

function mapSupplier(s) {
  return {
    id: Number(s.Id),
    name: s.Name,
    phone: s.Phone,
    address: s.Address,
    totalPayable: Number(s.TotalPayable),
    totalAdvance: Number(s.TotalAdvance),
  };
}

function mapCustomer(c) {
  return {
    id: Number(c.Id),
    name: c.Name,
    phone: c.Phone,
    city: c.City,
    totalDue: Number(c.TotalDue),
    totalAdvance: Number(c.TotalAdvance),
  };
}

function mapShopInRecord(r) {
  return {
    id: Number(r.Id),
    invoiceNumber: r.InvoiceNumber,
    supplierId: Number(r.SupplierId),
    totalBill: Number(r.TotalBill),
    paid: Number(r.Paid),
    remaining: Number(r.Remaining),
    paymentMethod: r.PaymentMethod,
    notes: r.Notes,
    date: r.TransactionDate,
    items: (r.items || []).map((i) => ({
      id: Number(i.Id),
      inventoryId: Number(i.InventoryId),
      qty: Number(i.Qty),
      purchasePrice: Number(i.PurchasePrice),
    })),
  };
}

function mapShopOutRecord(r) {
  return {
    id: Number(r.Id),
    invoiceNumber: r.InvoiceNumber,
    customerId: Number(r.CustomerId),
    totalBill: Number(r.TotalBill),
    discount: Number(r.Discount),
    paid: Number(r.Paid),
    remaining: Number(r.Remaining),
    paymentMethod: r.PaymentMethod,
    notes: r.Notes,
    date: r.TransactionDate,
    items: (r.items || []).map((i) => ({
      id: Number(i.Id),
      inventoryId: Number(i.InventoryId),
      qty: Number(i.Qty),
      salePrice: Number(i.SalePrice),
    })),
  };
}

function ledgerReducer(state, action) {
  switch (action.type) {
    case "SET_INVENTORY": return { ...state, inventory: action.payload };
    case "SET_SUPPLIERS": return { ...state, suppliers: action.payload };
    case "SET_CUSTOMERS": return { ...state, customers: action.payload };
    case "SET_SHOP_IN_RECORDS": return { ...state, shopInRecords: action.payload };
    case "SET_SHOP_OUT_RECORDS": return { ...state, shopOutRecords: action.payload };

    case "ADD_INVENTORY_ITEM_LOCAL": return { ...state, inventory: [action.payload, ...state.inventory] };
    case "DELETE_INVENTORY_ITEM_LOCAL": return { ...state, inventory: state.inventory.filter((i) => i.id !== action.payload.id) };

    case "ADD_SUPPLIER_LOCAL": return { ...state, suppliers: [action.payload, ...state.suppliers] };
    case "DELETE_SUPPLIER_LOCAL": return { ...state, suppliers: state.suppliers.filter((s) => s.id !== action.payload.id) };

    case "ADD_CUSTOMER_LOCAL": return { ...state, customers: [action.payload, ...state.customers] };
    case "DELETE_CUSTOMER_LOCAL": return { ...state, customers: state.customers.filter((c) => c.id !== action.payload.id) };

    case "ADD_SHOP_IN_RECORD_LOCAL": return { ...state, shopInRecords: [action.payload, ...state.shopInRecords] };
    case "REMOVE_SHOP_IN_RECORD_LOCAL": return { ...state, shopInRecords: state.shopInRecords.filter((r) => r.id !== action.payload.id) };

    case "ADD_SHOP_OUT_RECORD_LOCAL": return { ...state, shopOutRecords: [action.payload, ...state.shopOutRecords] };
    case "REMOVE_SHOP_OUT_RECORD_LOCAL": return { ...state, shopOutRecords: state.shopOutRecords.filter((r) => r.id !== action.payload.id) };

    default: return state;
  }
}

export function LedgerProvider({ children }) {
  const [state, dispatch] = useReducer(ledgerReducer, defaultState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function hydrateFromServer() {
      const token = localStorage.getItem("erp_token");
      if (!token) { setLoading(false); return; }

      try {
        const [inventoryData, suppliersData, customersData, shopInData, shopOutData] = await Promise.all([
          apiFetch("/inventory"),
          apiFetch("/suppliers"),
          apiFetch("/customers"),
          apiFetch("/shop-in"),
          apiFetch("/shop-out"),
        ]);

        dispatch({ type: "SET_INVENTORY", payload: inventoryData.map(mapInventoryItem) });
        dispatch({ type: "SET_SUPPLIERS", payload: suppliersData.map(mapSupplier) });
        dispatch({ type: "SET_CUSTOMERS", payload: customersData.map(mapCustomer) });
        dispatch({ type: "SET_SHOP_IN_RECORDS", payload: shopInData.map(mapShopInRecord) });
        dispatch({ type: "SET_SHOP_OUT_RECORDS", payload: shopOutData.map(mapShopOutRecord) });
      } catch (err) {
        console.error("Failed to load data from server:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    hydrateFromServer();
  }, []);

  async function refreshInventoryAndParty(partyType) {
    const inventoryData = await apiFetch("/inventory");
    dispatch({ type: "SET_INVENTORY", payload: inventoryData.map(mapInventoryItem) });

    if (partyType === "supplier") {
      const suppliersData = await apiFetch("/suppliers");
      dispatch({ type: "SET_SUPPLIERS", payload: suppliersData.map(mapSupplier) });
    } else {
      const customersData = await apiFetch("/customers");
      dispatch({ type: "SET_CUSTOMERS", payload: customersData.map(mapCustomer) });
    }
  }

  async function addInventoryItem(payload) {
    const created = await apiFetch("/inventory", { method: "POST", body: JSON.stringify(payload) });
    dispatch({ type: "ADD_INVENTORY_ITEM_LOCAL", payload: mapInventoryItem(created) });
  }

  async function deleteInventoryItem(id) {
    await apiFetch(`/inventory/${id}`, { method: "DELETE" });
    dispatch({ type: "DELETE_INVENTORY_ITEM_LOCAL", payload: { id } });
  }

  async function addSupplier(payload) {
    const created = await apiFetch("/suppliers", { method: "POST", body: JSON.stringify(payload) });
    const mapped = mapSupplier(created);
    dispatch({ type: "ADD_SUPPLIER_LOCAL", payload: mapped });
    return mapped;
  }

  async function deleteSupplier(id) {
    await apiFetch(`/suppliers/${id}`, { method: "DELETE" });
    dispatch({ type: "DELETE_SUPPLIER_LOCAL", payload: { id } });
  }

  async function addCustomer(payload) {
    const created = await apiFetch("/customers", { method: "POST", body: JSON.stringify(payload) });
    const mapped = mapCustomer(created);
    dispatch({ type: "ADD_CUSTOMER_LOCAL", payload: mapped });
    return mapped;
  }

  async function deleteCustomer(id) {
    await apiFetch(`/customers/${id}`, { method: "DELETE" });
    dispatch({ type: "DELETE_CUSTOMER_LOCAL", payload: { id } });
  }

  async function addShopIn(payload) {
    const created = await apiFetch("/shop-in", { method: "POST", body: JSON.stringify(payload) });
    dispatch({ type: "ADD_SHOP_IN_RECORD_LOCAL", payload: mapShopInRecord(created) });
    await refreshInventoryAndParty("supplier");
    return created;
  }

  async function deleteShopIn(id) {
    await apiFetch(`/shop-in/${id}`, { method: "DELETE" });
    dispatch({ type: "REMOVE_SHOP_IN_RECORD_LOCAL", payload: { id } });
    await refreshInventoryAndParty("supplier");
  }

  async function addShopOut(payload) {
    const created = await apiFetch("/shop-out", { method: "POST", body: JSON.stringify(payload) });
    dispatch({ type: "ADD_SHOP_OUT_RECORD_LOCAL", payload: mapShopOutRecord(created) });
    await refreshInventoryAndParty("customer");
    return created;
  }

  async function deleteShopOut(id) {
    await apiFetch(`/shop-out/${id}`, { method: "DELETE" });
    dispatch({ type: "REMOVE_SHOP_OUT_RECORD_LOCAL", payload: { id } });
    await refreshInventoryAndParty("customer");
  }

  return (
    <LedgerContext.Provider
      value={{
        state, loading, error,
        addInventoryItem, deleteInventoryItem,
        addSupplier, deleteSupplier,
        addCustomer, deleteCustomer,
        addShopIn, deleteShopIn,
        addShopOut, deleteShopOut,
      }}
    >
      {children}
    </LedgerContext.Provider>
  );
}

export function useLedger() {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error("useLedger must be used inside <LedgerProvider>");
  return ctx;
}