import { Truck, Flower, Moon } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion as Motion } from 'framer-motion';

const modes = [
    { id: 'recibo', label: 'Recibo', icon: Truck, color: 'bg-blue-500' },
    { id: 'produccion', label: 'Producción', icon: Flower, color: 'bg-yellow-500' },
    { id: 'cierre', label: 'Cierre', icon: Moon, color: 'bg-purple-600' },
];

export function ModeToggle({ currentMode, onModeChange }) {
    return (
        <div className="flex p-1 bg-white/40 backdrop-blur-md rounded-2xl border border-white/40 shadow-sm mx-auto max-w-md mt-0">
            {modes.map((mode) => {
                const isActive = currentMode === mode.id;
                const Icon = mode.icon;

                return (
                    <button
                        key={mode.id}
                        onClick={() => onModeChange(mode.id)}
                        className={cn(
                            "relative flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-sm font-bold transition-all duration-300",
                            isActive ? "text-white shadow-lg shadow-pink-500/20" : "text-gray-500 hover:text-gray-800 hover:bg-white/40"
                        )}
                    >
                        {isActive && (
                            <Motion.div
                                layoutId="activeMode"
                                className={cn("absolute inset-0 rounded-xl", mode.color)}
                                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <Icon size={18} strokeWidth={2.5} />
                            <span className="hidden sm:inline tracking-tight">{mode.label}</span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
