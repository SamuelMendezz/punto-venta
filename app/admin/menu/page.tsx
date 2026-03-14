'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Edit2, Trash2, Image as ImageIcon, MenuSquare } from 'lucide-react';
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
  prepTime: number;
}

export default function MenuEditor() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Modals state
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#4f46e5');
  
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodAvailable, setProdAvailable] = useState(true);
  const [prodPrepTime, setProdPrepTime] = useState('15');

  useEffect(() => {
    const qCategories = query(collection(db, 'categories'), orderBy('order'));
    const unsubCat = onSnapshot(qCategories, (snapshot) => {
      setCategories(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Category)));
    });

    const unsubProd = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
    });

    return () => {
      unsubCat();
      unsubProd();
    };
  }, []);

  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), {
          name: catName,
          color: catColor,
        });
        toast.success('Categoría actualizada');
      } else {
        await addDoc(collection(db, 'categories'), {
          name: catName,
          color: catColor,
          order: categories.length,
        });
        toast.success('Categoría creada');
      }
      setCategoryModalOpen(false);
      setEditingCategory(null);
      setCatName('');
    } catch (error) {
      toast.error('Error al guardar categoría');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('¿Eliminar esta categoría? Se perderán los productos asociados.')) {
      await deleteDoc(doc(db, 'categories', id));
      toast.success('Categoría eliminada');
    }
  };

  const handleSaveProduct = async () => {
    if (!selectedCategory) {
      toast.error('Selecciona una categoría primero');
      return;
    }
    try {
      const data = {
        name: prodName,
        description: prodDesc,
        price: parseFloat(prodPrice),
        imageUrl: prodImage || 'https://picsum.photos/seed/food/400/300',
        categoryId: selectedCategory,
        available: prodAvailable,
        prepTime: parseInt(prodPrepTime),
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), data);
        toast.success('Producto actualizado');
      } else {
        await addDoc(collection(db, 'products'), data);
        toast.success('Producto creado');
      }
      setProductModalOpen(false);
      setEditingProduct(null);
      resetProductForm();
    } catch (error) {
      toast.error('Error al guardar producto');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('¿Eliminar este producto?')) {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Producto eliminado');
    }
  };

  const resetProductForm = () => {
    setProdName('');
    setProdDesc('');
    setProdPrice('');
    setProdImage('');
    setProdAvailable(true);
    setProdPrepTime('15');
  };

  const openEditCategory = (c: Category) => {
    setEditingCategory(c);
    setCatName(c.name);
    setCatColor(c.color || '#4f46e5');
    setCategoryModalOpen(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdDesc(p.description);
    setProdPrice(p.price.toString());
    setProdImage(p.imageUrl);
    setProdAvailable(p.available);
    setProdPrepTime(p.prepTime?.toString() || '15');
    setProductModalOpen(true);
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Editor de Menú</h1>
        <button
          onClick={() => {
            setEditingCategory(null);
            setCatName('');
            setCategoryModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva Categoría
        </button>
      </div>

      <div className="flex flex-1 gap-8 min-h-0">
        {/* Categories Sidebar */}
        <div className="w-64 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 overflow-y-auto">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Categorías</h2>
          <div className="space-y-2">
            {categories.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                  selectedCategory === c.id ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className={`font-medium ${selectedCategory === c.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                    {c.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); openEditCategory(c); }} className="p-1 text-slate-400 hover:text-indigo-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(c.id); }} className="p-1 text-slate-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">No hay categorías. Crea una para empezar.</p>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 overflow-y-auto">
          {selectedCategory ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                  Productos en {categories.find((c) => c.id === selectedCategory)?.name}
                </h2>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    resetProductForm();
                    setProductModalOpen(true);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Nuevo Producto
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products
                  .filter((p) => p.categoryId === selectedCategory)
                  .map((p) => (
                    <div key={p.id} className={`border rounded-xl overflow-hidden transition-all ${p.available ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-75'}`}>
                      <div className="h-32 bg-slate-100 relative">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}
                        {!p.available && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                            Agotado
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-slate-900 line-clamp-1">{p.name}</h3>
                          <span className="font-bold text-indigo-600">${p.price.toFixed(2)}</span>
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{p.description}</p>
                        <div className="flex justify-end gap-2 border-t pt-3">
                          <button onClick={() => openEditProduct(p)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <MenuSquare className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Selecciona una categoría para ver sus productos</p>
            </div>
          )}
        </div>
      </div>

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: Entradas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                <input
                  type="color"
                  value={catColor}
                  onChange={(e) => setCatColor(e.target.value)}
                  className="w-full h-10 rounded-xl cursor-pointer"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setCategoryModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveCategory} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-6">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4 col-span-2 md:col-span-1">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej: Hamburguesa Clásica"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio ($)</label>
                  <input
                    type="number"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tiempo de Prep. (min)</label>
                  <input
                    type="number"
                    value={prodPrepTime}
                    onChange={(e) => setProdPrepTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="space-y-4 col-span-2 md:col-span-1">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                  <textarea
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                    placeholder="Ingredientes, detalles..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">URL de Imagen (Opcional)</label>
                  <input
                    type="text"
                    value={prodImage}
                    onChange={(e) => setProdImage(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="available"
                    checked={prodAvailable}
                    onChange={(e) => setProdAvailable(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="available" className="text-sm font-medium text-slate-700">
                    Disponible para venta
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
              <button onClick={() => setProductModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveProduct} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
