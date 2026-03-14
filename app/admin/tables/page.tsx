'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Trash2, Edit2, Move } from 'lucide-react';
import { toast } from 'sonner';
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

export default function TablesEditor() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  
  const [isZoneModalOpen, setZoneModalOpen] = useState(false);
  const [zoneName, setZoneName] = useState('');
  
  const [isTableModalOpen, setTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableNumber, setTableNumber] = useState('');
  const [tableCapacity, setTableCapacity] = useState('4');
  const [tableShape, setTableShape] = useState<'round' | 'square' | 'rectangle'>('square');

  const canvasRef = useRef<HTMLDivElement>(null);

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

  const handleSaveZone = async () => {
    try {
      await addDoc(collection(db, 'zones'), {
        name: zoneName,
        order: zones.length,
      });
      setZoneName('');
      setZoneModalOpen(false);
      toast.success('Zona creada');
    } catch (error) {
      toast.error('Error al crear zona');
    }
  };

  const handleSaveTable = async () => {
    if (!selectedZone) return;
    try {
      if (editingTable) {
        await updateDoc(doc(db, 'tables', editingTable.id), {
          number: tableNumber,
          capacity: parseInt(tableCapacity),
          shape: tableShape,
        });
        toast.success('Mesa actualizada');
      } else {
        await addDoc(collection(db, 'tables'), {
          zoneId: selectedZone,
          number: tableNumber,
          capacity: parseInt(tableCapacity),
          shape: tableShape,
          x: 50,
          y: 50,
          status: 'available',
        });
        toast.success('Mesa creada');
      }
      setTableModalOpen(false);
      setEditingTable(null);
      setTableNumber('');
      setTableCapacity('4');
    } catch (error) {
      toast.error('Error al guardar mesa');
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (confirm('¿Eliminar esta mesa?')) {
      await deleteDoc(doc(db, 'tables', id));
      toast.success('Mesa eliminada');
    }
  };

  const handleDragEnd = async (e: any, info: any, tableId: string) => {
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    // Calculate new percentage position
    const newX = Math.max(0, Math.min(100, ((info.point.x - canvasRect.left) / canvasRect.width) * 100));
    const newY = Math.max(0, Math.min(100, ((info.point.y - canvasRect.top) / canvasRect.height) * 100));

    try {
      await updateDoc(doc(db, 'tables', tableId), {
        x: newX,
        y: newY,
      });
    } catch (error) {
      console.error('Error updating position', error);
    }
  };

  const openEditTable = (t: Table) => {
    setEditingTable(t);
    setTableNumber(t.number);
    setTableCapacity(t.capacity.toString());
    setTableShape(t.shape);
    setTableModalOpen(true);
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Editor de Plano</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setZoneModalOpen(true)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Zona
          </button>
          <button
            onClick={() => {
              if (!selectedZone) return toast.error('Selecciona una zona primero');
              setEditingTable(null);
              setTableNumber('');
              setTableModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Agregar Mesa
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
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
        {zones.length === 0 && (
          <p className="text-slate-500 py-3">No hay zonas creadas.</p>
        )}
      </div>

      <div 
        ref={canvasRef}
        className="flex-1 bg-white rounded-2xl shadow-inner border-2 border-dashed border-slate-200 relative overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      >
        {selectedZone ? (
          tables
            .filter((t) => t.zoneId === selectedZone)
            .map((t) => (
              <motion.div
                key={t.id}
                drag
                dragMomentum={false}
                dragConstraints={canvasRef}
                onDragEnd={(e, info) => handleDragEnd(e, info, t.id)}
                initial={{ left: `${t.x}%`, top: `${t.y}%` }}
                className={`absolute cursor-grab active:cursor-grabbing flex flex-col items-center justify-center shadow-lg border-2 border-slate-300 bg-white text-slate-800 group
                  ${t.shape === 'round' ? 'rounded-full w-24 h-24' : ''}
                  ${t.shape === 'square' ? 'rounded-xl w-24 h-24' : ''}
                  ${t.shape === 'rectangle' ? 'rounded-xl w-32 h-20' : ''}
                `}
                style={{ transform: 'translate(-50%, -50%)' }}
              >
                <span className="font-bold text-lg">{t.number}</span>
                <span className="text-xs text-slate-500">{t.capacity} pax</span>
                
                {/* Actions overlay */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-lg px-2 py-1 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                  <button onClick={() => openEditTable(t)} className="p-1 hover:text-indigo-400"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteTable(t.id)} className="p-1 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </motion.div>
            ))
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            <p>Selecciona o crea una zona para empezar a diseñar</p>
          </div>
        )}
      </div>

      {/* Zone Modal */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Nueva Zona</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre (ej: Terraza)</label>
              <input
                type="text"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setZoneModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Cancelar</button>
              <button onClick={handleSaveZone} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Table Modal */}
      {isTableModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">{editingTable ? 'Editar Mesa' : 'Nueva Mesa'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Número / Nombre</label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: T1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Capacidad (Personas)</label>
                <input
                  type="number"
                  value={tableCapacity}
                  onChange={(e) => setTableCapacity(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Forma</label>
                <select
                  value={tableShape}
                  onChange={(e) => setTableShape(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="square">Cuadrada</option>
                  <option value="round">Redonda</option>
                  <option value="rectangle">Rectangular</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setTableModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">Cancelar</button>
              <button onClick={handleSaveTable} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
