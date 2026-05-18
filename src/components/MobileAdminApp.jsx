import { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, BarChart3, Truck, LogOut, Send, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import logo from '../assets/logo.png';

const ADMIN_PASSWORD = "Belkett2026";

const CARDS = [
  { id: 'paquetes_rosas', title: 'Paquetes Rosas', icon: '📦', color: 'text-rose-600', bg: 'bg-rose-50', focus: 'focus-within:ring-rose-500' },
  { id: 'rosas_individuales', title: 'Rosas Indiv.', icon: '🌹', color: 'text-red-600', bg: 'bg-red-50', focus: 'focus-within:ring-red-500' },
  { id: 'girasoles', title: 'Girasoles', icon: '🌻', color: 'text-yellow-600', bg: 'bg-yellow-50', focus: 'focus-within:ring-yellow-500' },
  { id: 'lilium', title: 'Lilium', icon: '🌸', color: 'text-pink-600', bg: 'bg-pink-50', focus: 'focus-within:ring-pink-500' },
  { id: 'flores_verano', title: 'Verano', icon: '🌺', color: 'text-orange-600', bg: 'bg-orange-50', focus: 'focus-within:ring-orange-500' }
];

export function MobileAdminApp() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('adminAuth') === 'true');
  const [balanceResponse, setBalanceResponse] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [inventoryData, setInventoryData] = useState({
    paquetes_rosas: '',
    rosas_individuales: '',
    girasoles: '',
    lilium: '',
    flores_verano: ''
  });

  const handleUnlock = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
    } else {
      alert("Contraseña incorrecta");
    }
  };

  const handleInventoryChange = (id, value) => {
    // Only allow non-negative numbers
    if (value < 0) return;
    setInventoryData(prev => ({ ...prev, [id]: value }));
  };

  const fetchBalance = async (producto) => {
    setBalanceResponse("Consultando...");
    try {
      const res = await fetch(import.meta.env.VITE_WEBHOOK_CONSULTA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ accion: 'consultar_saldo', producto })
      });
      const data = await res.json();
      setBalanceResponse(data);
    } catch (error) {
      setBalanceResponse({ title: "Error", mensaje: "Error al consultar saldo" });
      console.error(error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !balanceResponse) {
      fetchBalance('ambos');
    }
  }, [isAuthenticated]);

  const registerEntry = async () => {
    setIsSubmitting(true);
    const payload = {
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 19),
      modo: 'ingreso',
      responsable: 'Admin',
      datos: {
        paquetes_rosas: { principal: Number(inventoryData.paquetes_rosas) || 0 },
        rosas_individuales: { principal: Number(inventoryData.rosas_individuales) || 0 },
        girasoles: { principal: Number(inventoryData.girasoles) || 0 },
        lilium: { principal: Number(inventoryData.lilium) || 0 },
        flores_verano: { principal: Number(inventoryData.flores_verano) || 0 },
      }
    };

    try {
      const res = await fetch(import.meta.env.VITE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        // Success animation or alert
        setInventoryData({ paquetes_rosas: '', rosas_individuales: '', girasoles: '', lilium: '', flores_verano: '' });
        alert("Ingreso registrado correctamente 🎉");
        // Refetch balance to update view
        fetchBalance('ambos');
      } else {
        alert("Error al registrar ingreso");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    }
    setIsSubmitting(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuth');
    setPassword('');
    setBalanceResponse(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="h-[100dvh] w-full bg-white flex flex-col items-center justify-center px-6 selection:bg-rose-200">
        <Motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm flex flex-col items-center space-y-8"
        >
          <div className="bg-gray-50 p-6 rounded-full shadow-inner mb-4">
            <img src={logo} alt="Belkett" className="w-24 h-24 object-contain drop-shadow-md" />
          </div>
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin Portal</h1>
            <p className="text-gray-500 font-medium text-lg">Ingresa tu clave de acceso</p>
          </div>

          <form onSubmit={handleUnlock} className="w-full flex flex-col gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-6 w-6 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-xl font-bold focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all placeholder:font-medium placeholder:text-gray-400 text-center"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-black text-white rounded-2xl py-4 text-xl font-black shadow-xl shadow-black/20 active:scale-95 transition-all"
            >
              Desbloquear
            </button>
          </form>
        </Motion.div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-stone-50 flex flex-col overflow-hidden selection:bg-green-200">
      {/* Header */}
      <header className="flex-none bg-white border-b border-gray-100 px-6 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-xl">
            <Unlock className="text-green-600 h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-tight">Admin</h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Belkett</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.location.reload()} className="p-2 text-gray-400 hover:text-blue-500 bg-gray-50 rounded-xl transition-colors active:scale-95">
            <RefreshCw size={20} />
          </button>
          <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-xl transition-colors active:scale-95">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area - Scrollable with safe vertical centering */}
      <main className="flex-1 overflow-y-auto w-full hide-scrollbar flex flex-col">
        
        <div className="flex flex-col gap-8 pt-4 pb-6">
          {/* Balance Section */}
          <div className="flex-none px-6">
            <div className="flex items-center gap-2 mb-3 ml-1">
              <BarChart3 className="text-gray-900 h-5 w-5" />
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-wider">Saldos</h2>
            </div>
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100 ring-1 ring-black/5 min-h-[120px] flex items-center justify-center">
              {typeof balanceResponse === 'string' ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin" />
                  <p className="text-gray-500 font-bold text-sm uppercase tracking-widest animate-pulse">{balanceResponse}</p>
                </div>
              ) : balanceResponse ? (
                <div 
                  className="w-full text-center text-gray-800 font-bold text-lg leading-relaxed balance-content"
                  dangerouslySetInnerHTML={{ __html: balanceResponse.mensaje }}
                />
              ) : null}
            </div>
          </div>

          {/* Inventory Entry Section - Horizontal Scroll */}
          <div className="flex-none w-full">
            <div className="flex items-center gap-2 mb-4 px-6 ml-1">
              <Truck className="text-green-600 h-5 w-5" />
              <h2 className="text-lg font-black text-green-600 uppercase tracking-wider">Añadir Ingresos</h2>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="w-full overflow-x-auto snap-x snap-mandatory hide-scrollbar flex px-6 pb-6 pt-2">
              <div className="flex gap-5 min-h-[280px]">
                {CARDS.map((card) => (
                  <div 
                    key={card.id} 
                    className={cn(
                      "snap-center shrink-0 w-[80vw] max-w-[320px] bg-white rounded-3xl shadow-xl border-2 border-transparent transition-all flex flex-col relative overflow-hidden",
                      card.focus
                    )}
                  >
                    {/* Background decoration */}
                    <div className={cn("absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none", card.bg)} />
                    
                    <div className="p-6 flex flex-col h-full">
                      <div className="flex items-center gap-3 mb-auto">
                        <span className="text-4xl filter drop-shadow-sm">{card.icon}</span>
                        <h3 className={cn("font-black text-xl leading-tight", card.color)}>
                          {card.title.split(' ').map((word, i) => <div key={i}>{word}</div>)}
                        </h3>
                      </div>

                      <div className="mt-8 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-black text-2xl">+</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={inventoryData[card.id]}
                          onChange={(e) => handleInventoryChange(card.id, e.target.value)}
                          placeholder="0"
                          className="w-full bg-stone-50 border-0 rounded-2xl pl-12 pr-6 py-5 text-4xl font-black text-gray-900 focus:bg-white outline-none focus:ring-4 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {/* Spacer element to ensure the last card can be centered */}
                <div className="shrink-0 w-[10vw]"></div>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Fixed Bottom Button */}
      <div className="flex-none p-4 pb-4 bg-white border-t border-gray-100 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <button
          onClick={registerEntry}
          disabled={isSubmitting}
          className={cn(
            "w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-black text-xl shadow-xl transition-all active:scale-[0.98]",
            isSubmitting ? "bg-stone-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 shadow-green-600/30"
          )}
        >
          {isSubmitting ? (
             <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send size={24} />
              Registrar Ingreso
            </>
          )}
        </button>
      </div>
    </div>
  );
}
