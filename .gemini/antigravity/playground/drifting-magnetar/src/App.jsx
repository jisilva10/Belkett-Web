import { useState } from 'react';
import { ModeToggle } from './components/ModeToggle';
import { FlowerInputGroup } from './components/FlowerInputGroup';
import { SuccessModal } from './components/SuccessModal';
import { AdminModal } from './components/AdminModal';
import { Send, User, Settings } from 'lucide-react';
import { cn } from './lib/utils';

import logo from './assets/logo.png';

export default function App() {
  const [mode, setMode] = useState('recibo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [lastSubmission, setLastSubmission] = useState(null);

  // ... (formData state and handlers remain same)

  const [formData, setFormData] = useState({
    rosas_individuales: { principal: '', vendido: '', seguidor: '', danado: '' },
    paquetes_rosas: { principal: '', vendido: '', danado: '' },
    girasoles: { principal: '', vendido: '', danado: '' },
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
      flores_verano: { principal: '', vendido: '', danado: '' },
    }));
  };

  return (
    <div className="min-h-screen pb-20 bg-gray-50 selection:bg-pink-200 font-sans">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-gray-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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

            {/* Mode Selector */}
            <div className="w-full md:w-auto flex items-center gap-4">
              <ModeToggle currentMode={mode} onModeChange={setMode} />

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

      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Responsable & Observaciones Row */}
          <div className="w-full">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-2xl mx-auto">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">
                <User size={18} className="text-pink-500" />
                Responsable
              </label>
              <input
                type="text"
                name="responsable"
                value={formData.responsable}
                onChange={handleTextChange}
                placeholder="Nombre del encargado"
                className="w-full bg-gray-50 border-0 border-b-2 border-gray-200 focus:border-pink-500 focus:ring-0 px-4 py-3 text-lg outline-none transition-all placeholder:text-gray-400 font-medium"
              />
            </div>
          </div>

          {/* Dynamic Flower Inputs - HORIZONTAL GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              title="Flores Verano"
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
                "w-full max-w-md flex items-center justify-center gap-3 py-5 rounded-2xl text-white font-bold text-xl shadow-xl shadow-pink-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]",
                isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-gray-900 hover:bg-black"
              )}
            >
              {isSubmitting ? (
                <>Enviando registro...</>
              ) : (
                <>
                  <Send size={24} />
                  Enviar Inventario
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        data={lastSubmission}
      />

      <AdminModal
        isOpen={showAdmin}
        onClose={() => setShowAdmin(false)}
      />
    </div>
  );
}
