'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { usePosStore } from '@/store/use-pos-store';
import { motion } from 'motion/react';

interface Zone {
  id: string;
  name: string;
  order: number;
}

interface Table {
  id: string;
  zoneId: string;
  number: string;
  capacity: number;
  shape: 'round' | 'square' | 'rectangle';
  x: number;
  y: number;
  status: 'available' | 'occupied' | 'dirty';
}

export default function PosTables() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const router = useRouter();
  const { setSelectedTableId } = usePosStore();

  useEffect(() => {
    const unsubZones = onSnapshot(query(collection(db, 'zones'), orderBy('order')), (snapshot) => {
      const z = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Zone));
      setZones(z);
      if (z.length > 0 && !selectedZone) setSelectedZone(z[0].id);
    });

    const unsubTables = onSnapshot(collection(db, 'tables'), (snapshot) => {
      setTables(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Table)));
    });

    return () => {
      unsubZones();
      unsubTables();
    };
  }, [selectedZone]);

  const handleTableClick = async (t: Table) => {
    if (t.status === 'dirty') {
      if (confirm('¿Marcar mesa como limpia y disponible?')) {
        await updateDoc(doc(db, 'tables', t.id), { status: 'available' });
      }
      return;
    }
    setSelectedTableId(t.id);
    router.push(`/pos/menu/${t.id}`);
  };

  const statusColors = {
    available: 'bg-emerald-500 border-emerald-600 text-white',
    occupied: 'bg-red-500 border-red-600 text-white',
    dirty: 'bg-amber-500 border-amber-600 text-white',
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Seleccionar Mesa</h1>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {zones.map((z) => (
              <button
                key={z.id}
                onClick={() => setSelectedZone(z.id)}
                className={`px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-colors ${
                  selectedZone === z.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {z.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-4 text-sm font-medium">
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-emerald-500"></div> Disponible</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-500"></div> Ocupada</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-amber-500"></div> Por Limpiar</div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden"
           style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        {selectedZone ? (
          tables
            .filter((t) => t.zoneId === selectedZone)
            .map((t) => (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                key={t.id}
                onClick={() => handleTableClick(t)}
                className={`absolute flex flex-col items-center justify-center shadow-lg border-b-4 transition-colors
                  ${statusColors[t.status]}
                  ${t.shape === 'round' ? 'rounded-full w-24 h-24' : ''}
                  ${t.shape === 'square' ? 'rounded-2xl w-24 h-24' : ''}
                  ${t.shape === 'rectangle' ? 'rounded-2xl w-32 h-20' : ''}
                `}
                style={{ left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <span className="font-bold text-2xl">{t.number}</span>
                <span className="text-xs opacity-80 font-medium">{t.capacity} pax</span>
              </motion.button>
            ))
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            <p className="text-lg font-medium">Selecciona una zona para ver las mesas</p>
          </div>
        )}
      </div>
    </div>
  );
}
