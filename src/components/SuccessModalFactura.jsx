import { motion as Motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export function SuccessModalFactura({ isOpen, onClose, data }) {
    if (!data) return null;

    // Formatting the value to a currency format
    const formattedValor = new Intl.NumberFormat('es-EC', {
        style: 'currency',
        currency: 'USD'
    }).format(data.valor);

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
                                    Factura registrada correctamente.
                                </p>

                                <div className="w-full bg-gray-50 rounded-2xl p-5 mb-8 text-left border border-gray-100">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest text-center my-2 mb-4">Resumen de Datos</h4>
                                    
                                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                                        <span className="text-gray-400 font-bold uppercase tracking-wider">Fecha</span>
                                        <span className="font-bold text-gray-900 text-right">{data.fecha}</span>

                                        <span className="text-gray-400 font-bold uppercase tracking-wider">Entidad</span>
                                        <span className="font-bold text-gray-900 text-right">{data.entidad}</span>

                                        <span className="text-gray-400 font-bold uppercase tracking-wider">Responsable</span>
                                        <span className="font-bold text-gray-900 text-right">{data.responsable}</span>

                                        <span className="text-gray-400 font-bold uppercase tracking-wider">Consumidor</span>
                                        <span className="font-bold text-gray-900 text-right">{data.nombre}</span>

                                        <span className="text-gray-400 font-bold uppercase tracking-wider">Valor</span>
                                        <span className="font-black text-green-600 text-right text-lg">{formattedValor}</span>
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
