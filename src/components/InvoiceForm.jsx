import React, { useState, useRef, useEffect } from 'react';
import { Send, Building2, User, DollarSign, ChevronDown, BadgeCheck } from 'lucide-react';
import { cn } from '../lib/utils';

const ENTITIES = [
  { id: 'banco_pacifico', name: 'Banco Pacífico', color: 'bg-blue-600', hoverColor: 'hover:bg-blue-700', textColor: 'text-blue-600' },
  { id: 'de_una', name: 'De Una', color: 'bg-purple-600', hoverColor: 'hover:bg-purple-700', textColor: 'text-purple-600' },
  { id: 'pichincha', name: 'Pichincha', color: 'bg-yellow-500', hoverColor: 'hover:bg-yellow-600', textColor: 'text-yellow-600' },
  { id: 'produbanco', name: 'Produbanco', color: 'bg-green-600', hoverColor: 'hover:bg-green-700', textColor: 'text-green-600' },
];

export function InvoiceForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    entidad: '',
    nombre: '',
    responsable: '',
    valor: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEntityOpen, setIsEntityOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsEntityOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNumpadClick = (num) => {
    setFormData(prev => {
      let currentVal = prev.valor;
      // Handle comma conversion if we change button to comma
      if (num === ',' || num === '.') num = '.';
      
      // If pressing dot on empty, prepend 0
      if (num === '.' && currentVal === '') {
        return { ...prev, valor: '0.' };
      }

      // Prevent multiple decimals
      if (num === '.' && currentVal.includes('.')) return prev;
      
      // Limit decimal places to 2 if there's a decimal
      if (currentVal.includes('.')) {
        const [, decimalPart] = currentVal.split('.');
        if (decimalPart && decimalPart.length >= 2) return prev;
      }
      return { ...prev, valor: currentVal + num };
    });
  };

  const handleBackspace = () => {
    setFormData(prev => ({ ...prev, valor: prev.valor.slice(0, -1) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.entidad) {
      alert("Por favor selecciona una Entidad");
      return;
    }
    if (!formData.nombre.trim()) {
      alert("Por favor ingresa el Cliente");
      return;
    }
    if (!formData.responsable.trim()) {
      alert("Por favor ingresa el Responsable");
      return;
    }
    if (!formData.valor || isNaN(Number(formData.valor))) {
      alert("Por favor ingresa un Valor válido");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 19),
      entidad: ENTITIES.find(e => e.id === formData.entidad)?.name || formData.entidad,
      nombre: formData.nombre,
      responsable: formData.responsable,
      valor: Number(formData.valor)
    };

    try {
      await fetch('https://1.jisn8n.work/webhook/ingresar-facturas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      onSuccess(payload);
      
      // Reset Form
      setFormData({
        entidad: '',
        nombre: '',
        responsable: '',
        valor: ''
      });
    } catch (error) {
      console.error("Webhook error:", error);
      alert("Hubo un error al enviar la factura. Por favor, revisa tu conexión o la URL del webhook.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEntity = ENTITIES.find(e => e.id === formData.entidad);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-5xl mx-auto flex flex-col h-full justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Entidad & Nombre */}
        <div className="flex flex-col gap-6">
          {/* Entidad Selector */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 ring-1 ring-black/5 relative" ref={dropdownRef}>
            <label className="flex items-center gap-2 text-xs font-black text-rose-600 uppercase tracking-[0.2em] mb-3 ml-1">
              <Building2 size={16} />
              Entidad
            </label>
            
            <button
              type="button"
              onClick={() => setIsEntityOpen(!isEntityOpen)}
              className={cn(
                "w-full flex items-center justify-between bg-stone-50/50 border-2 rounded-2xl px-4 py-4 text-xl font-bold transition-all",
                isEntityOpen ? "border-rose-500 ring-4 ring-rose-500/10" : "border-stone-100 hover:border-stone-200",
                selectedEntity ? selectedEntity.textColor : "text-stone-400"
              )}
            >
              <span>{selectedEntity ? selectedEntity.name : 'Seleccionar Entidad...'}</span>
              <ChevronDown size={24} className={cn("transition-transform", isEntityOpen && "rotate-180")} />
            </button>

            {isEntityOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white rounded-2xl shadow-xl border border-stone-100 z-50 flex flex-col gap-1">
                {ENTITIES.map((entity) => (
                  <button
                    key={entity.id}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, entidad: entity.id }));
                      setIsEntityOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-4 rounded-xl font-bold text-lg transition-all text-white",
                      entity.color,
                      entity.hoverColor
                    )}
                  >
                    {entity.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nombre */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 ring-1 ring-black/5 flex-1 flex flex-col justify-center">
            <label className="flex items-center gap-2 text-xs font-black text-rose-600 uppercase tracking-[0.2em] mb-3 ml-1">
              <User size={16} />
              Cliente
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Nombre del cliente..."
              className="w-full bg-stone-50/30 border-0 border-b-2 border-stone-100 focus:border-rose-500 focus:ring-0 px-4 py-3 text-2xl outline-none transition-all placeholder:text-stone-200 font-bold"
            />
          </div>

          {/* Responsable */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 ring-1 ring-black/5 flex-1 flex flex-col justify-center">
            <label className="flex items-center gap-2 text-xs font-black text-rose-600 uppercase tracking-[0.2em] mb-3 ml-1">
              <BadgeCheck size={16} />
              Responsable
            </label>
            <input
              type="text"
              value={formData.responsable}
              onChange={(e) => setFormData(prev => ({ ...prev, responsable: e.target.value }))}
              placeholder="Nombre del responsable..."
              className="w-full bg-stone-50/30 border-0 border-b-2 border-stone-100 focus:border-rose-500 focus:ring-0 px-4 py-3 text-2xl outline-none transition-all placeholder:text-stone-200 font-bold"
            />
          </div>
        </div>

        {/* Right Column: Valor & Numpad */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 ring-1 ring-black/5 flex flex-col justify-between">
          <div>
            <label className="flex items-center gap-2 text-xs font-black text-rose-600 uppercase tracking-[0.2em] mb-3 ml-1">
              <DollarSign size={16} />
              Valor
            </label>
            <div className="flex items-center gap-2 mb-6 border-b-2 border-stone-100 focus-within:border-rose-500 transition-colors pb-2">
              <span className="text-3xl font-black text-stone-300">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={formData.valor}
                onChange={(e) => {
                  let val = e.target.value.replace(',', '.');
                  // Allow empty, or valid numbers with up to 2 decimal places
                  if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                    setFormData(prev => ({ ...prev, valor: val }));
                  }
                }}
                placeholder="0.00"
                className="w-full bg-transparent border-0 focus:ring-0 px-2 py-2 text-4xl outline-none transition-all placeholder:text-stone-200 font-black"
              />
            </div>
          </div>
          
          {/* Custom Numpad */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumpadClick(num.toString())}
                className="py-4 text-2xl font-bold bg-stone-50 hover:bg-stone-100 rounded-2xl transition-colors active:scale-95 text-stone-700"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleNumpadClick('.')}
              className="py-4 text-2xl font-bold bg-stone-50 hover:bg-stone-100 rounded-2xl transition-colors active:scale-95 text-stone-700"
            >
              ,
            </button>
            <button
              type="button"
              onClick={() => handleNumpadClick('0')}
              className="py-4 text-2xl font-bold bg-stone-50 hover:bg-stone-100 rounded-2xl transition-colors active:scale-95 text-stone-700"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-4 text-xl font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl transition-colors active:scale-95 flex items-center justify-center"
            >
              ⌫
            </button>
          </div>
        </div>

      </div>

      {/* Submit Button */}
      <div className="pt-6 pb-2 flex justify-center">
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
              Enviar Factura
            </>
          )}
        </button>
      </div>
    </form>
  );
}
