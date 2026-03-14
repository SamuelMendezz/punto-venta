'use client';

import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore, StaffUser } from '@/store/use-auth-store';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Lock, Delete } from 'lucide-react';

export function PinPad() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { setStaffUser } = useAuthStore();

  const handleNumber = (num: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + num);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('pin', '==', pin), where('active', '==', true));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        toast.error('PIN incorrecto o usuario inactivo');
        setPin('');
      } else {
        const doc = snapshot.docs[0];
        const userData = doc.data() as Omit<StaffUser, 'id'>;
        setStaffUser({ id: doc.id, ...userData });
        toast.success(`Bienvenido, ${userData.name}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al verificar PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-500/20 p-4 rounded-full mb-4">
            <Lock className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-semibold">Ingresa tu PIN</h2>
          <p className="text-slate-400 text-sm mt-1">Sistema POS</p>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-colors ${
                pin.length > i ? 'bg-indigo-500' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={num}
              onClick={() => handleNumber(num.toString())}
              className="h-16 rounded-2xl bg-slate-700 hover:bg-slate-600 text-2xl font-medium flex items-center justify-center transition-colors"
            >
              {num}
            </motion.button>
          ))}
          <div />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNumber('0')}
            className="h-16 rounded-2xl bg-slate-700 hover:bg-slate-600 text-2xl font-medium flex items-center justify-center transition-colors"
          >
            0
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-slate-700 hover:bg-slate-600 text-2xl font-medium flex items-center justify-center transition-colors text-slate-400"
          >
            <Delete className="w-6 h-6" />
          </motion.button>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={pin.length !== 4 || loading}
          className="w-full mt-8 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold text-lg transition-colors flex items-center justify-center"
        >
          {loading ? 'Verificando...' : 'Ingresar'}
        </motion.button>
      </div>
    </div>
  );
}
