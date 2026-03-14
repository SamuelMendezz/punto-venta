'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Edit2, Trash2, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import { StaffUser, StaffRole } from '@/store/use-auth-store';

export default function UsersEditor() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('waiter');
  const [pin, setPin] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as StaffUser)));
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (pin.length !== 4) {
      toast.error('El PIN debe tener exactamente 4 dígitos');
      return;
    }

    try {
      const data = { name, role, pin, active };
      if (editingUser) {
        await updateDoc(doc(db, 'users', editingUser.id), data);
        toast.success('Usuario actualizado');
      } else {
        await addDoc(collection(db, 'users'), data);
        toast.success('Usuario creado');
      }
      setModalOpen(false);
      setEditingUser(null);
      setName('');
      setRole('waiter');
      setPin('');
      setActive(true);
    } catch (error) {
      toast.error('Error al guardar usuario');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este usuario?')) {
      await deleteDoc(doc(db, 'users', id));
      toast.success('Usuario eliminado');
    }
  };

  const openEdit = (u: StaffUser) => {
    setEditingUser(u);
    setName(u.name);
    setRole(u.role);
    setPin(u.pin);
    setActive(u.active);
    setModalOpen(true);
  };

  const generatePin = () => {
    setPin(Math.floor(1000 + Math.random() * 9000).toString());
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Usuarios y Permisos</h1>
        <button
          onClick={() => {
            setEditingUser(null);
            setName('');
            setRole('waiter');
            setPin('');
            setActive(true);
            setModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
              <th className="p-4 font-medium">Usuario</th>
              <th className="p-4 font-medium">Rol</th>
              <th className="p-4 font-medium">PIN</th>
              <th className="p-4 font-medium">Estado</th>
              <th className="p-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                      {u.name.charAt(0)}
                    </div>
                    <span className="font-medium text-slate-900">{u.name}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="capitalize px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
                    {u.role}
                  </span>
                </td>
                <td className="p-4 font-mono text-slate-500">
                  ••••
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-lg text-sm font-medium ${u.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {u.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => openEdit(u)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(u.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-6">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as StaffRole)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="admin">Administrador (Acceso Total)</option>
                  <option value="manager">Gerente (Reportes, Configuración)</option>
                  <option value="cashier">Cajero (Cobros, Cortes)</option>
                  <option value="waiter">Mesero (Órdenes, Mesas)</option>
                  <option value="kitchen">Cocina/Barra (Ver Comandas)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">PIN de Acceso (4 dígitos)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono tracking-widest text-lg"
                    placeholder="1234"
                  />
                  <button
                    onClick={generatePin}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                  >
                    Generar
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-slate-700">
                  Usuario Activo
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
