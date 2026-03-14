'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/use-auth-store';
import { useRouter } from 'next/navigation';
import { ChefHat, CheckCircle2, Clock, LogOut } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  notes: string;
}

interface Order {
  id: string;
  tableId: string;
  tableName?: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export default function KdsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const { staffUser, logoutStaff, isAuthReady } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthReady && !staffUser) {
      router.push('/');
    }
  }, [isAuthReady, staffUser, router]);

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
      
      // Sort by oldest first
      ordersData.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setOrders(ordersData);
    });

    return () => unsub();
  }, []);

  const handleItemStatus = async (orderId: string, itemIndex: number, newStatus: OrderItem['status']) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const newItems = [...order.items];
    newItems[itemIndex].status = newStatus;

    await updateDoc(doc(db, 'orders', orderId), {
      items: newItems
    });
  };

  const handleOrderReady = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const newItems = order.items.map(item => ({ ...item, status: 'ready' as const }));
    await updateDoc(doc(db, 'orders', orderId), {
      items: newItems
    });
  };

  if (!staffUser) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col">
      <header className="bg-slate-950 px-6 py-4 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-amber-500" />
          <h1 className="text-2xl font-bold text-white tracking-tight">KDS - Cocina</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 font-medium">{staffUser.name}</span>
          <button
            onClick={() => {
              logoutStaff();
              router.push('/');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-x-auto">
        <div className="flex gap-6 h-full items-start">
          {orders.map((order) => {
            const allReady = order.items.every(i => i.status === 'ready' || i.status === 'served');
            if (allReady) return null; // Hide orders where all items are ready/served

            const timeAgo = formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: es });
            const isOld = new Date().getTime() - new Date(order.createdAt).getTime() > 15 * 60 * 1000; // 15 mins

            return (
              <div key={order.id} className="min-w-[320px] w-80 max-h-full bg-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-xl border border-slate-700 shrink-0">
                <div className={`p-4 flex justify-between items-center ${isOld ? 'bg-red-900/50' : 'bg-slate-800'} border-b border-slate-700`}>
                  <div>
                    <h2 className="text-xl font-bold text-white">Mesa {order.tableName}</h2>
                    <div className="flex items-center gap-1 text-sm text-slate-400 mt-1">
                      <Clock className="w-4 h-4" />
                      {timeAgo}
                    </div>
                  </div>
                  <button
                    onClick={() => handleOrderReady(order.id)}
                    className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors"
                    title="Marcar todo como listo"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {order.items.map((item, idx) => {
                    if (item.status === 'served') return null;
                    
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (item.status === 'pending') handleItemStatus(order.id, idx, 'preparing');
                          else if (item.status === 'preparing') handleItemStatus(order.id, idx, 'ready');
                        }}
                        className={`p-4 rounded-xl cursor-pointer transition-colors border ${
                          item.status === 'ready'
                            ? 'bg-emerald-900/20 border-emerald-800/50 opacity-50'
                            : item.status === 'preparing'
                            ? 'bg-amber-900/20 border-amber-800/50'
                            : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg shrink-0 ${
                            item.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600 text-white'
                          }`}>
                            {item.quantity}
                          </div>
                          <div>
                            <h3 className={`font-bold text-lg leading-tight ${item.status === 'ready' ? 'text-emerald-400 line-through' : 'text-white'}`}>
                              {item.name}
                            </h3>
                            {item.notes && (
                              <p className="text-amber-400 text-sm mt-1 font-medium">
                                Nota: {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          
          {orders.filter(o => !o.items.every(i => i.status === 'ready' || i.status === 'served')).length === 0 && (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
              <ChefHat className="w-24 h-24 mb-4 opacity-20" />
              <p className="text-2xl font-medium">No hay órdenes pendientes</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
