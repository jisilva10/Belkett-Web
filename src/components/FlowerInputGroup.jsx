
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
        <div className={cn("rounded-3xl p-6 shadow-sm border border-white/60 backdrop-blur-md transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 h-full flex flex-col ring-1 ring-black/5", color)}>
            <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight border-b border-stone-100 pb-3">{title}</h3>

            <div className="space-y-4 flex-1">
                {/* Principal Input */}
                <div className="space-y-2">
                    <label className="block text-[11px] font-black text-stone-300 uppercase tracking-[0.2em] ml-1">
                        {prefix}
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={data.principal || ''}
                        onChange={handlePrincipalChange}
                        className="w-full bg-stone-50/50 border-0 border-b-2 border-stone-100 focus:border-rose-500 focus:ring-0 px-4 py-3 text-4xl font-black text-gray-900 outline-none transition-all placeholder:text-stone-100"
                        placeholder="0"
                    />
                </div>

                <AnimatePresence>
                    {mode === 'cierre' && (
                        <Motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                {/* Danado Input */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-black text-rose-500 uppercase tracking-widest ml-1">
                                        🥀 Dañado
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.danado || ''}
                                        onChange={handleDanadoChange}
                                        className="w-full bg-rose-50/50 border-2 border-rose-100 focus:border-rose-400 focus:ring-0 rounded-xl px-3 py-2 text-lg font-bold outline-none transition-all text-rose-700"
                                        placeholder="0"
                                    />
                                </div>

                                {/* Vendido Input */}
                                <div className="space-y-1">
                                    <label className="block text-xs font-black text-green-600 uppercase tracking-widest ml-1">
                                        💰 Vendí
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.vendido || ''}
                                        onChange={handleVendidoChange}
                                        className="w-full bg-green-50/50 border-2 border-green-100 focus:border-green-400 focus:ring-0 rounded-xl px-3 py-2 text-lg font-bold outline-none transition-all text-green-700"
                                        placeholder="0"
                                    />
                                </div>

                                {/* Seguidor Input */}
                                {hasSeguidor && (
                                    <div className="space-y-1 col-span-2">
                                        <label className="block text-xs font-black text-rose-600 uppercase tracking-widest ml-1">
                                            {categoryId === 'rosas_individuales' ? '🤝 Seguidor' : '🎁 Regalo'}
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={data.seguidor || ''}
                                            onChange={handleSeguidorChange}
                                            className="w-full bg-rose-50/50 border-2 border-rose-100 focus:border-rose-400 focus:ring-0 rounded-xl px-3 py-2 text-lg font-bold outline-none transition-all text-rose-700"
                                            placeholder="0"
                                        />
                                    </div>
                                )}
                            </div>
                        </Motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
