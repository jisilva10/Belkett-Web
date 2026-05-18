import { useState } from 'react';
import { ModeToggle } from './components/ModeToggle';
import { FlowerInputGroup } from './components/FlowerInputGroup';
import { SuccessModal } from './components/SuccessModal';
import { SuccessModalFactura } from './components/SuccessModalFactura';
import { InvoiceForm } from './components/InvoiceForm';
import { AdminModal } from './components/AdminModal';
import { Send, User, Settings, FileText, Package } from 'lucide-react';
import { cn } from './lib/utils';

import logo from './assets/logo.png';

export default function App() {
  const [mode, setMode] = useState('recibo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [lastSubmission, setLastSubmission] = useState(null);

  const [currentView, setCurrentView] = useState('inventario');
  const [showFacturaSuccess, setShowFacturaSuccess] = useState(false);
  const [lastFacturaSubmission, setLastFacturaSubmission] = useState(null);

  // ... (formData state and handlers remain same)

  const [formData, setFormData] = useState({
    rosas_individuales: { principal: '', vendido: '', seguidor: '', danado: '' },
    paquetes_rosas: { principal: '', vendido: '', danado: '' },
    girasoles: { principal: '', vendido: '', danado: '' },
    lilium: { principal: '', vendido: '', danado: '' },
    flores_verano: { principal: '', vendido: '', danado: '' },
    responsable: ''
  });

  const handleInputChange = (category, field, value) => {
    // Prevent negative numbers
    if (value < 0) return;

    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.responsable.trim()) {
      alert("Por favor ingresa el nombre del Responsable");
      return;
    }

    setIsSubmitting(true);

    // Construct JSON Payload
    // Send 0 if field is empty or not visible in current mode
    const getNumber = (val) => val === '' ? 0 : Number(val);

    const payload = {
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 19), // YYYY-MM-DD HH:mm:ss approx
      responsable: formData.responsable,
      modo: (() => {
        let modeStr = mode;
        const allData = [
          formData.rosas_individuales,
          formData.paquetes_rosas,
          formData.girasoles,
          formData.lilium,
          formData.flores_verano
        ];

        // Check if any category has these values > 0
        const hasVenta = allData.some(d => getNumber(d.vendido) > 0);
        const hasRegalo = allData.some(d => getNumber(d.seguidor) > 0);
        const hasDano = allData.some(d => getNumber(d.danado) > 0);

        if (hasVenta) modeStr += ', venta';
        if (hasRegalo) modeStr += ', regalo';
        if (hasDano) modeStr += ', daño';

        return modeStr;
      })(),
      datos: {
        rosas_individuales: {
          principal: getNumber(formData.rosas_individuales.principal),
          danado: getNumber(formData.rosas_individuales.danado),
          seguidor: getNumber(formData.rosas_individuales.seguidor),
          vendido: getNumber(formData.rosas_individuales.vendido)
        },
        paquetes_rosas: {
          principal: getNumber(formData.paquetes_rosas.principal),
          danado: getNumber(formData.paquetes_rosas.danado),
          vendido: getNumber(formData.paquetes_rosas.vendido)
        },
        girasoles: {
          principal: getNumber(formData.girasoles.principal),
          danado: getNumber(formData.girasoles.danado),
          vendido: getNumber(formData.girasoles.vendido)
        },
        lilium: {
          principal: getNumber(formData.lilium.principal),
          danado: getNumber(formData.lilium.danado),
          vendido: getNumber(formData.lilium.vendido)
        },
        flores_verano: {
          principal: getNumber(formData.flores_verano.principal),
          danado: getNumber(formData.flores_verano.danado),
          vendido: getNumber(formData.flores_verano.vendido)
        }
      }
    };

    console.log("Payload:", payload);

    try {
      await fetch(import.meta.env.VITE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error("Webhook error:", error);
    }

    // Reset Form (optional, maybe keep responsible?)
    setLastSubmission(payload);
    setShowSuccess(true);
    setIsSubmitting(false);

    // Reset numeric inputs
    setFormData(prev => ({
      ...prev,
      rosas_individuales: { principal: '', vendido: '', seguidor: '', danado: '' },
      paquetes_rosas: { principal: '', vendido: '', danado: '' },
      girasoles: { principal: '', vendido: '', danado: '' },
      lilium: { principal: '', vendido: '', danado: '' },
      flores_verano: { principal: '', vendido: '', danado: '' }
    }));
  };

  return (
    <div className="h-screen flex flex-col bg-background selection:bg-rose-200 font-sans text-gray-900 overflow-hidden">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-gray-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
            <div className="flex items-center justify-between w-full md:w-auto">
              <img src={logo} alt="Belkett Logo" className="h-16 w-auto object-contain" />

              {/* Mobile Admin Button - visible only on small screens if needed, otherwise keep in main flow */}
              <button
                onClick={() => setShowAdmin(true)}
                className="md:hidden p-2 text-gray-500 hover:text-gray-900 bg-gray-100 rounded-lg"
              >
                <Settings size={20} />
              </button>
            </div>

            {/* View Selector (Center) */}
            <div className="flex justify-center flex-1 order-3 md:order-2 md:absolute md:left-1/2 md:-translate-x-1/2 w-full md:w-auto">
              <div className="flex items-center bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200/50 shadow-inner">
                <button
                  onClick={() => setCurrentView('inventario')}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                    currentView === 'inventario' 
                      ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5 scale-[1.02]" 
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
                  )}
                >
                  <Package size={16} />
                  Inventario
                </button>
                <button
                  onClick={() => setCurrentView('facturas')}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                    currentView === 'facturas' 
                      ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5 scale-[1.02]" 
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
                  )}
                >
                  <FileText size={16} />
                  Facturas
                </button>
              </div>
            </div>

            {/* Mode & Admin (Right) */}
            <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-4 order-2 md:order-3">
              {currentView === 'inventario' ? (
                <ModeToggle currentMode={mode} onModeChange={setMode} />
              ) : (
                <div className="w-[200px] hidden md:block"></div> /* Placeholder to keep header balanced */
              )}

              {/* Desktop Admin Button */}
              <button
                onClick={() => setShowAdmin(true)}
                className="hidden md:flex flex-col items-center gap-1 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors px-3"
              >
                <Settings size={20} />
                <span>Admin</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pt-6 pb-20 space-y-6">
        {currentView === 'inventario' ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Responsable Row - BALANCED PREMIUM */}
            <div className="w-full">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 max-w-2xl mx-auto ring-1 ring-black/5">
                <label className="flex items-center gap-2 text-xs font-black text-rose-600 uppercase tracking-[0.2em] mb-3 ml-1">
                  <User size={16} />
                  Responsable
                </label>
                <input
                  type="text"
                  name="responsable"
                  value={formData.responsable}
                  onChange={handleTextChange}
                  placeholder="Ingresar nombre..."
                  className="w-full bg-stone-50/30 border-0 border-b-2 border-stone-100 focus:border-rose-500 focus:ring-0 px-4 py-3 text-2xl outline-none transition-all placeholder:text-stone-200 font-bold"
                />
              </div>
            </div>

            {/* Dynamic Flower Inputs - HORIZONTAL GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FlowerInputGroup
                title="Rosas Individuales"
                categoryId="rosas_individuales"
                mode={mode}
                data={formData.rosas_individuales}
                onChange={handleInputChange}
                hasSeguidor={true}
                color="bg-white"
              />

              <FlowerInputGroup
                title="Paquetes Rosas"
                categoryId="paquetes_rosas"
                mode={mode}
                data={formData.paquetes_rosas}
                onChange={handleInputChange}
                color="bg-white"
              />

              <FlowerInputGroup
                title="Girasoles"
                categoryId="girasoles"
                mode={mode}
                data={formData.girasoles}
                onChange={handleInputChange}
                color="bg-white"
              />

              <FlowerInputGroup
                title="Lilium"
                categoryId="lilium"
                mode={mode}
                data={formData.lilium}
                onChange={handleInputChange}
                color="bg-white"
              />

              <FlowerInputGroup
                title="Flores de Verano"
                categoryId="flores_verano"
                mode={mode}
                data={formData.flores_verano}
                onChange={handleInputChange}
                color="bg-white"
              />

            </div>

            {/* Submit Button */}
            <div className="pt-6 pb-12 flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "w-full max-w-md flex items-center justify-center gap-3 py-5 rounded-2xl text-white font-black text-2xl shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]",
                  isSubmitting ? "bg-stone-300 cursor-not-allowed" : "bg-gray-900 hover:bg-black shadow-gray-900/20"
                )}
              >
                {isSubmitting ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Send size={28} />
                    Enviar Inventario
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <InvoiceForm 
            onSuccess={(data) => {
              setLastFacturaSubmission(data);
              setShowFacturaSuccess(true);
            }} 
          />
        )}
      </main>

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        data={lastSubmission}
      />

      <SuccessModalFactura
        isOpen={showFacturaSuccess}
        onClose={() => setShowFacturaSuccess(false)}
        data={lastFacturaSubmission}
      />

      <AdminModal
        isOpen={showAdmin}
        onClose={() => setShowAdmin(false)}
      />
    </div>
  );
}
