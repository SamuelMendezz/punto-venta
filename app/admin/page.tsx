'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, ShoppingBag, DollarSign, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0,
    productsCount: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ordersSnap, usersSnap, productsSnap] = await Promise.all([
          getDocs(collection(db, 'orders')),
          getDocs(query(collection(db, 'users'), where('active', '==', true))),
          getDocs(collection(db, 'products')),
        ]);

        let revenue = 0;
        ordersSnap.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'paid') {
            revenue += data.total || 0;
          }
        });

        setStats({
          totalOrders: ordersSnap.size,
          totalRevenue: revenue,
          activeUsers: usersSnap.size,
          productsCount: productsSnap.size,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Ventas Totales',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
    },
    {
      title: 'Órdenes',
      value: stats.totalOrders.toString(),
      icon: ShoppingBag,
      color: 'bg-blue-500',
    },
    {
      title: 'Productos',
      value: stats.productsCount.toString(),
      icon: Activity,
      color: 'bg-indigo-500',
    },
    {
      title: 'Usuarios Activos',
      value: stats.activeUsers.toString(),
      icon: Users,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`${stat.color} w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-lg`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">{stat.title}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Bienvenido al Panel de Administración</h2>
        <p className="text-slate-600">
          Desde aquí puedes configurar todo tu restaurante sin necesidad de tocar código.
          Usa el menú lateral para navegar entre las diferentes secciones:
        </p>
        <ul className="mt-4 space-y-2 text-slate-600 list-disc list-inside">
          <li><strong>Menú:</strong> Crea categorías y productos, ajusta precios e imágenes.</li>
          <li><strong>Mesas y Zonas:</strong> Diseña el plano de tu restaurante arrastrando mesas.</li>
          <li><strong>Usuarios:</strong> Administra los accesos y PINs de tu personal.</li>
          <li><strong>Configuración:</strong> Ajusta los colores, logo y datos generales del negocio.</li>
        </ul>
      </div>
    </div>
  );
}
