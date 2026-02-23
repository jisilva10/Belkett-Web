import { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, X, BarChart3, Truck, Flower } from 'lucide-react';
import { cn } from '../lib/utils';

const ADMIN_PASSWORD = "Belkett2026";

export function AdminModal({ isOpen, onClose }) {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [balanceResponse, setBalanceResponse] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [inventoryData, setInventoryData] = useState({
        paquetes_rosas: '',
        rosas_individuales: '',
        girasoles: '',
    });

    const handleUnlock = () => {
        if (password === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            fetchBalance('ambos');
        } else {
            alert("Contraseña incorrecta");
        }
    };

    const handleInventoryChange = (e) => {
        const { name, value } = e.target;
        setInventoryData(prev => ({ ...prev, [name]: value }));
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
            }
        };

        try {
            const res = await fetch(import.meta.env.VITE_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert("Ingreso registrado correctamente");
                setInventoryData({ paquetes_rosas: '', rosas_individuales: '', girasoles: '' });
            } else {
                alert("Error al registrar ingreso");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        }
        setIsSubmitting(false);
    };

    // Reset state when closed
    const handleClose = () => {
        setPassword('');
        setIsAuthenticated(false);
        setBalanceResponse(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <Motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
                        <Motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-3xl">
                                <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                                    {isAuthenticated ? <Unlock size={20} className="text-green-500" /> : <Lock size={20} className="text-gray-400" />}
                                    {isAuthenticated ? "Panel de Administrador" : "Acceso Restringido"}
                                </h2>
                                <button onClick={handleClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="p-8">
                                {!isAuthenticated ? (
                                    <div className="flex flex-col items-center py-8">
                                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
                                            <Lock size={32} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Ingresa la clave"
                                            className="w-full max-w-xs bg-gray-50 border-2 border-gray-200 focus:border-black rounded-xl px-4 py-3 text-center text-lg outline-none mb-4 transition-all"
                                        />
                                        <button
                                            onClick={handleUnlock}
                                            className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all"
                                        >
                                            Desbloquear
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-10">
                                        {/* Section 1: Balances */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-rose-600 mb-2">
                                                <BarChart3 size={24} />
                                                <h3 className="font-extrabold text-2xl tracking-tight">Saldos Actuales</h3>
                                            </div>

                                            <div className="bg-rose-50/30 border border-rose-100 p-6 rounded-2xl min-h-[100px] shadow-sm">
                                                {typeof balanceResponse === 'string' ? (
                                                    <div className="flex flex-col items-center justify-center space-y-3 py-4">
                                                        <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
                                                        <p className="text-rose-600 text-center font-bold text-lg">{balanceResponse}</p>
                                                    </div>
                                                ) : balanceResponse ? (
                                                    <div className="text-center space-y-4">
                                                        {balanceResponse.mensaje && (
                                                            <div
                                                                className="text-gray-800 text-xl font-medium leading-relaxed"
                                                                dangerouslySetInnerHTML={{ __html: balanceResponse.mensaje }}
                                                            />
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-400 text-center py-4 text-lg italic">Cargando saldos...</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="h-px bg-gray-100" />

                                        {/* Section 2: Incoming Inventory */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-green-600 mb-2">
                                                <Truck size={24} />
                                                <h3 className="font-extrabold text-2xl tracking-tight">Registrar Nueva Compra</h3>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">📦 Paquetes Rosas</label>
                                                    <input
                                                        type="number"
                                                        name="paquetes_rosas"
                                                        value={inventoryData.paquetes_rosas}
                                                        onChange={handleInventoryChange}
                                                        className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-green-500 transition-all text-lg font-bold"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">🌹 Rosas Indiv.</label>
                                                    <input
                                                        type="number"
                                                        name="rosas_individuales"
                                                        value={inventoryData.rosas_individuales}
                                                        onChange={handleInventoryChange}
                                                        className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-green-500 transition-all text-lg font-bold"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">🌻 Girasoles</label>
                                                    <input
                                                        type="number"
                                                        name="girasoles"
                                                        value={inventoryData.girasoles}
                                                        onChange={handleInventoryChange}
                                                        className="w-full bg-white border-2 border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-green-500 transition-all text-lg font-bold"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={registerEntry}
                                                disabled={isSubmitting}
                                                className={cn(
                                                    "w-full py-4 rounded-2xl font-black text-white transition-all shadow-xl mt-4 text-lg",
                                                    isSubmitting ? "bg-stone-300" : "bg-green-600 hover:bg-green-700 shadow-green-600/20 active:scale-[0.98]"
                                                )}
                                            >
                                                {isSubmitting ? "REGISTRANDO..." : "REGISTRAR INGRESO"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
