'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Save, Store, Palette, Receipt } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsEditor() {
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [taxRate, setTaxRate] = useState('16');
  const [currency, setCurrency] = useState('MXN');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'settings'), (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        setSettingsId(doc.id);
        setRestaurantName(data.restaurantName || '');
        setLogoUrl(data.logoUrl || '');
        setPrimaryColor(data.primaryColor || '#4f46e5');
        setTaxRate(data.taxRate?.toString() || '16');
        setCurrency(data.currency || 'MXN');
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    try {
      const data = {
        restaurantName,
        logoUrl,
        primaryColor,
        taxRate: parseFloat(taxRate),
        currency,
      };

      if (settingsId) {
        await setDoc(doc(db, 'settings', settingsId), data, { merge: true });
      } else {
        await setDoc(doc(collection(db, 'settings')), data);
      }
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      toast.error('Error al guardar configuración');
    }
  };

  return (
    <div className="p-8 h-full flex flex-col max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Configuración General</h1>
        <button
          onClick={handleSave}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-md shadow-indigo-200"
        >
          <Save className="w-5 h-5" />
          Guardar Cambios
        </button>
      </div>

      <div className="space-y-6">
        {/* Datos del Negocio */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <Store className="w-6 h-6 text-indigo-500" />
            <h2 className="text-xl font-bold text-slate-800">Datos del Negocio</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Restaurante</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ej: El Buen Sabor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">URL del Logo</label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Apariencia */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <Palette className="w-6 h-6 text-indigo-500" />
            <h2 className="text-xl font-bold text-slate-800">Apariencia</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Color Principal</label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0"
                />
                <span className="font-mono text-slate-500 uppercase">{primaryColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Facturación e Impuestos */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <Receipt className="w-6 h-6 text-indigo-500" />
            <h2 className="text-xl font-bold text-slate-800">Facturación e Impuestos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tasa de Impuesto (%)</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="16"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="MXN">Peso Mexicano (MXN)</option>
                <option value="USD">Dólar Estadounidense (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="COP">Peso Colombiano (COP)</option>
                <option value="ARS">Peso Argentino (ARS)</option>
                <option value="CLP">Peso Chileno (CLP)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
