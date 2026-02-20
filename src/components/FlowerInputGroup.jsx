
import { cn } from '../lib/utils';
import { motion as Motion, AnimatePresence } from 'framer-motion';

export function FlowerInputGroup({
    title,
    categoryId,
    mode,
    data,
    onChange,
    hasSeguidor = false,
    color = "bg-white"
}) {

    const getLabelPrefix = () => {
        switch (mode) {
            case 'recibo': return 'Recibo';
            case 'produccion': return 'Usé';
            case 'cierre': return 'Dejo';
            default: return '';
        }
    };

    const prefix = getLabelPrefix();

    // Handlers for input changes
    const handlePrincipalChange = (e) => onChange(categoryId, 'principal', e.target.value);
    const handleVendidoChange = (e) => onChange(categoryId, 'vendido', e.target.value);
    const handleSeguidorChange = (e) => onChange(categoryId, 'seguidor', e.target.value);
    const handleDanadoChange = (e) => onChange(categoryId, 'danado', e.target.value);

    return (
        <div className={cn("rounded-2xl p-4 shadow-sm border border-white/60 backdrop-blur-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full flex flex-col", color)}>
            <h3 className="text-lg font-extrabold text-gray-800 mb-3 tracking-tight border-b border-black/5 pb-2">{title}</h3>

            <div className="space-y-3 flex-1">
                {/* Principal Input */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">
                        {prefix}
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={data.principal || ''}
                        onChange={handlePrincipalChange}
                        className="w-full bg-white/70 border-0 border-b-2 border-gray-200 focus:border-pink-500 focus:ring-0 rounded-t-lg px-3 py-2 text-2xl font-black text-gray-800 outline-none transition-all placeholder:text-gray-200"
                        placeholder="0"
                    />
                </div>

                <AnimatePresence>
                    {/* Danado Input - Visible in Production only as requested */}
                    {mode === 'produccion' && (
                        <Motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <label className="block text-xs font-bold text-red-500 uppercase tracking-widest mb-1 ml-1">
                                🥀 Dañado
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={data.danado || ''}
                                onChange={handleDanadoChange}
                                className="w-full bg-red-50/50 border border-red-100 focus:border-red-400 focus:ring-1 focus:ring-red-200 rounded-lg px-3 py-2 text-sm font-semibold outline-none transition-all text-red-700"
                                placeholder="0"
                            />
                        </Motion.div>
                    )}

                    {/* Vendido Input - Visible only in Closing */}
                    {mode === 'cierre' && (
                        <Motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <label className="block text-xs font-bold text-green-600 uppercase tracking-widest mb-1 ml-1">
                                💰 Vendí
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={data.vendido || ''}
                                onChange={handleVendidoChange}
                                className="w-full bg-green-50/50 border border-green-100 focus:border-green-400 focus:ring-1 focus:ring-green-200 rounded-lg px-3 py-2 text-sm font-semibold outline-none transition-all text-green-700"
                                placeholder="0"
                            />
                        </Motion.div>
                    )}

                    {/* Seguidor Input - Visible in Production (for Rosas) and Closing (for Rosas) */}
                    {hasSeguidor && (mode === 'produccion' || mode === 'cierre') && (
                        <Motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <label className="block text-xs font-bold text-pink-600 uppercase tracking-widest mb-1 ml-1">
                                🎁 Regalo
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={data.seguidor || ''}
                                onChange={handleSeguidorChange}
                                className="w-full bg-pink-50/50 border border-pink-100 focus:border-pink-400 focus:ring-1 focus:ring-pink-200 rounded-lg px-3 py-2 text-sm font-semibold outline-none transition-all text-pink-700"
                                placeholder="0"
                            />
                        </Motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
