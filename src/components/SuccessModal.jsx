import { motion as Motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export function SuccessModal({ isOpen, onClose, data }) {

    // Helper to format category names nicely
    const formatCategory = (str) => {
        return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <Motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
                        <Motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl pointer-events-auto max-h-[85vh] overflow-y-auto"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600 shadow-sm">
                                    <CheckCircle size={40} strokeWidth={2.5} />
                                </div>

                                <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">¡Enviado!</h2>
                                <p className="text-lg text-gray-500 font-medium mb-8">
                                    Inventario registrado correctamente.
                                </p>

                                <div className="w-full bg-gray-50 rounded-2xl p-5 mb-8 text-left border border-gray-100">
                                    <div className="grid grid-cols-2 gap-y-2 mb-4 text-sm border-b border-gray-200 pb-4">
                                        <span className="text-gray-400 font-bold uppercase tracking-wider">Responsable</span>
                                        <span className="font-bold text-gray-900 text-right">{data?.responsable}</span>

                                        <span className="text-gray-400 font-bold uppercase tracking-wider">Modo</span>
                                        <span className="font-bold text-gray-900 capitalize text-right">{data?.modo}</span>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest text-center my-2">Resumen de Datos</h4>
                                        {data?.datos && Object.entries(data.datos).map(([category, values]) => {
                                            // Only show categories that have at least one non-zero value
                                            const hasValues = Object.values(values).some(val => val > 0);
                                            if (!hasValues) return null;

                                            return (
                                                <div key={category} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                                    <h5 className="font-bold text-gray-800 text-sm mb-2 border-b border-gray-50 pb-1">
                                                        {formatCategory(category)}
                                                    </h5>
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                                        {values.principal > 0 && (
                                                            <>
                                                                <span className="text-gray-500">Cantidad:</span>
                                                                <span className="font-bold text-right text-gray-900">{values.principal}</span>
                                                            </>
                                                        )}
                                                        {values.danado > 0 && (
                                                            <>
                                                                <span className="text-red-500 font-medium">Dañado:</span>
                                                                <span className="font-bold text-right text-red-600">{values.danado}</span>
                                                            </>
                                                        )}
                                                        {values.vendido > 0 && (
                                                            <>
                                                                <span className="text-green-600 font-medium">Vendido:</span>
                                                                <span className="font-bold text-right text-green-700">{values.vendido}</span>
                                                            </>
                                                        )}
                                                        {values.seguidor > 0 && (
                                                            <>
                                                                <span className="text-pink-500 font-medium">Regalo:</span>
                                                                <span className="font-bold text-right text-pink-600">{values.seguidor}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-full bg-gray-900 text-white rounded-2xl py-4 font-bold text-lg hover:bg-black transition-all shadow-lg shadow-gray-200"
                                >
                                    Entendido, cerrar
                                </button>
                            </div>
                        </Motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
