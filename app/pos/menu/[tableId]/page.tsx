'use client';

import { useState, useEffect, use } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { usePosStore, CartItem } from '@/store/use-pos-store';
import { useAuthStore } from '@/store/use-auth-store';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  order: number;
  color: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  available: boolean;
}

export default function PosMenu({ params }: { params: Promise<{ tableId: string }> }) {
  const resolvedParams = use(params);
  const tableId = resolvedParams.tableId;
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tableName, setTableName] = useState('');
  
  const router = useRouter();
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart } = usePosStore();
  const { staffUser } = useAuthStore();

  useEffect(() => {
    const fetchTable = async () => {
      const t = await getDoc(doc(db, 'tables', tableId));
      if (t.exists()) setTableName(t.data().number);
    };
    fetchTable();

    const unsubCat = onSnapshot(query(collection(db, 'categories'), orderBy('order')), (snapshot) => {
      const c = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
      setCategories(c);
      if (c.length > 0 && !selectedCategory) setSelectedCategory(c[0].id);
    });

    const unsubProd = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
    });

    return () => {
      unsubCat();
      unsubProd();
    };
  }, [tableId, selectedCategory]);

  const handleAddToCart = (p: Product) => {
    if (!p.available) return;
    addToCart({
      id: p.id,
      productId: p.id,
      name: p.name,
      price: p.price,
      quantity: 1,
    });
  };

  const handleSendOrder = async () => {
    if (cart.length === 0 || !staffUser) return;
    
    try {
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      const orderRef = await addDoc(collection(db, 'orders'), {
        tableId,
        status: 'open',
        total,
        serverId: staffUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: cart.map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          status: 'pending',
          notes: item.notes || '',
        }))
      });

      await updateDoc(doc(db, 'tables', tableId), { status: 'occupied' });
      
      toast.success('Comanda enviada a cocina');
      clearCart();
      router.push('/pos');
    } catch (error) {
      toast.error('Error al enviar comanda');
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="h-full flex bg-slate-100">
      {/* Categories Sidebar */}
      <div className="w-24 md:w-32 bg-white border-r border-slate-200 flex flex-col overflow-y-auto">
        <button
          onClick={() => router.push('/pos')}
          className="h-20 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border-b border-slate-100 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="text-xs font-medium">Volver</span>
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`h-24 flex flex-col items-center justify-center gap-2 border-b border-slate-100 transition-colors relative ${
              selectedCategory === c.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {selectedCategory === c.id && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />
            )}
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: c.color }} />
            <span className="text-xs font-bold text-center px-1 line-clamp-2">{c.name}</span>
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          {categories.find((c) => c.id === selectedCategory)?.name || 'Menú'}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products
            .filter((p) => p.categoryId === selectedCategory)
            .map((p) => (
              <button
                key={p.id}
                onClick={() => handleAddToCart(p)}
                disabled={!p.available}
                className={`flex flex-col text-left bg-white rounded-2xl overflow-hidden border transition-all active:scale-95 ${
                  p.available ? 'border-slate-200 hover:border-indigo-300 hover:shadow-md' : 'border-slate-200 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="h-32 w-full bg-slate-100 relative">
                  {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />}
                  {!p.available && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                      <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">Agotado</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-slate-900 line-clamp-2 mb-1">{p.name}</h3>
                  <span className="font-bold text-indigo-600 mt-auto">${p.price.toFixed(2)}</span>
                </div>
              </button>
            ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-80 lg:w-96 bg-white border-l border-slate-200 flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-600" />
              Comanda
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Mesa {tableName}</p>
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700 font-medium">
              Vaciar
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-medium">La comanda está vacía</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-slate-900 leading-tight pr-4">{item.name}</h4>
                  <span className="font-bold text-indigo-600">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 bg-slate-100 rounded-xl p-1">
                    <button
                      onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)}
                      className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-600 shadow-sm hover:text-indigo-600"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-slate-900 w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-600 shadow-sm hover:text-indigo-600"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-500 font-medium">Total a pagar</span>
            <span className="text-3xl font-bold text-slate-900">${cartTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={handleSendOrder}
            disabled={cart.length === 0}
            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-200"
          >
            <Send className="w-5 h-5" />
            Enviar a Cocina
          </button>
        </div>
      </div>
    </div>
  );
}
