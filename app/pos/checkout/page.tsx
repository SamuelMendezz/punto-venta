'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/use-auth-store';
import { ArrowLeft, Receipt, CreditCard, Banknote, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  status: string;
}

interface Order {
  id: string;
  tableId: string;
  tableName?: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

export default function CheckoutPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [amountGiven, setAmountGiven] = useState('');
  const { staffUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, 'orders'), where('status', '==', 'open'));
    const unsub = onSnapshot(q, async (snapshot) => {
      const ordersData = await Promise.all(
        snapshot.docs.map(async (d) => {
          const data = d.data();
          let tableName = 'Mesa';
          try {
            const tableSnap = await getDoc(doc(db, 'tables', data.tableId));
            if (tableSnap.exists()) {
              tableName = tableSnap.data().number;
            }
          } catch (e) {}
          
          return {
            id: d.id,
            ...data,
            tableName,
          } as Order;
        })
      );
      
      ordersData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(ordersData);
      
      // Update selected order if it changed
      if (selectedOrder) {
        const updated = ordersData.find(o => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
        else setSelectedOrder(null);
      }
    });

    return () => unsub();
  }, [selectedOrder]);

  const handlePayment = async () => {
    if (!selectedOrder) return;
    
    try {
      // Update order status
      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        status: 'paid',
        paymentMethod,
        paidAt: new Date().toISOString(),
        cashierId: staffUser?.id,
      });

      // Update table status to dirty
      await updateDoc(doc(db, 'tables', selectedOrder.tableId), {
        status: 'dirty',
      });

      toast.success('Pago procesado correctamente');
      setSelectedOrder(null);
      setAmountGiven('');
    } catch (error) {
      toast.error('Error al procesar el pago');
    }
  };

  const change = amountGiven ? parseFloat(amountGiven) - (selectedOrder?.total || 0) : 0;

  return (
    <div className="h-full flex bg-slate-100">
      {/* Orders List */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <button onClick={() => router.push('/pos')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-xl font-bold text-slate-900">Cuentas Abiertas</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                selectedOrder?.id === order.id
                  ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-900">Mesa {order.tableName}</h3>
                <span className="font-bold text-indigo-600">${order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-500">
                <span>{format(new Date(order.createdAt), 'HH:mm', { locale: es })}</span>
                <span>{order.items.length} items</span>
              </div>
            </button>
          ))}
          {orders.length === 0 && (
            <div className="text-center text-slate-500 py-8">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No hay cuentas abiertas</p>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Panel */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {selectedOrder ? (
          <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-8">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
              <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Cobrar Mesa {selectedOrder.tableName}</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Abierta a las {format(new Date(selectedOrder.createdAt), 'HH:mm')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm">Total a pagar</p>
                  <p className="text-4xl font-bold text-emerald-400">${selectedOrder.total.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                <h3 className="font-bold text-slate-900 mb-4">Detalle de Consumo</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                      <div className="flex items-center gap-4">
                        <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                          {item.quantity}
                        </span>
                        <span className="font-medium text-slate-900">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-700">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 bg-white">
                <h3 className="font-bold text-slate-900 mb-4">Método de Pago</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-colors ${
                      paymentMethod === 'cash' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-8 h-8" />
                    <span className="font-bold">Efectivo</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-colors ${
                      paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-8 h-8" />
                    <span className="font-bold">Tarjeta</span>
                  </button>
                </div>

                {paymentMethod === 'cash' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Efectivo Recibido</label>
                    <div className="flex gap-4 items-center">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                        <input
                          type="number"
                          value={amountGiven}
                          onChange={(e) => setAmountGiven(e.target.value)}
                          className="w-full pl-8 pr-4 py-4 text-2xl font-bold border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-600 focus:ring-0"
                          placeholder={selectedOrder.total.toFixed(2)}
                        />
                      </div>
                      {change >= 0 && amountGiven && (
                        <div className="text-right">
                          <p className="text-sm text-slate-500 font-medium">Cambio</p>
                          <p className="text-2xl font-bold text-emerald-600">${change.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={handlePayment}
                  disabled={paymentMethod === 'cash' && (parseFloat(amountGiven) < selectedOrder.total || !amountGiven)}
                  className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-indigo-200"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  Procesar Pago
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <Receipt className="w-20 h-20 mb-4 opacity-20" />
            <p className="text-xl font-medium">Selecciona una cuenta para cobrar</p>
          </div>
        )}
      </div>
    </div>
  );
}
