"use client";
import { useState } from 'react';

// Sub-component for structured itinerary display
const ItineraryView = ({ data }: { data: any }) => {
    if (!data) return <p className="text-slate-500 italic">No itinerary data available.</p>;

    // Handle string fallback
    if (typeof data === 'string') {
        return <p className="whitespace-pre-wrap text-slate-300">{data}</p>;
    }

    const title = data.title || "Your Custom Trip Itinerary";
    const days = data.days || [];
    const tips = data.tips || [];

    return (
        <div className="space-y-8 pb-8">
            <div className="border-l-2 border-blue-500/30 pl-4">
                <h5 className="text-lg font-black text-white mb-1 uppercase tracking-tight">{title}</h5>
                {data.source && <p className="text-[9px] font-black text-blue-400/60 uppercase tracking-widest">Source: {data.source}</p>}
            </div>

            <div className="space-y-10">
                {days.map((day: any, dIdx: number) => (
                    <div key={dIdx} className="relative pl-8">
                        {/* Day Marker */}
                        <div className="absolute left-0 top-0 w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                            <span className="text-[10px] font-black text-white">{day.day}</span>
                        </div>

                        <div className="space-y-4">
                            <h6 className="text-sm font-black text-white uppercase tracking-wider">{day.theme || `Day ${day.day}`}</h6>
                            <div className="grid gap-4">
                                {(day.activities || day.schedule)?.map((act: any, aIdx: number) => (
                                    <div key={aIdx} className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/[0.08] transition-all">
                                        <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-1 flex items-center justify-between">
                                            <span>{act.name || act.activity}</span>
                                            {act.time && <span className="text-[8px] text-slate-500 bg-black/40 px-2 py-0.5 rounded ml-2">{act.time}</span>}
                                        </p>
                                        <p className="text-[11px] leading-relaxed text-slate-400">{act.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {tips.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6">
                    <h6 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4">Pro Travel Tips</h6>
                    <div className="space-y-3">
                        {tips.map((tip: any, tIdx: number) => (
                            <div key={tIdx} className="flex gap-3 text-[11px]">
                                <span className="font-black text-blue-400 text-[9px] uppercase">[{tip.category || 'Tip'}]</span>
                                <p className="text-slate-300">{tip.text || tip}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function AgentStatus({ tasks, agentSlots, searchContext, onApprove }: {
    tasks: any[],
    agentSlots: { [key: number]: { logs: string[], screenshot: string | null, runId: string | null, streamingUrl: string | null } },
    searchContext: any,
    onApprove: () => void
}) {
    const [activeSlot, setActiveSlot] = useState<number>(1);

    if (tasks.length === 0) return null;

    const isComplete = tasks.length > 0 && tasks.every(t => t.status === 'completed');

    // Robust Price Parser
    const parsePrice = (priceVal: any) => {
        if (typeof priceVal === 'number') return priceVal;
        if (!priceVal) return 0;
        const str = String(priceVal);
        const matches = str.match(/\d+(?:,\d+)*(?:\.\d+)?/);
        if (matches) {
            return parseFloat(matches[0].replace(/,/g, ''));
        }
        return 0;
    };

    const summaryData = tasks.reduce((acc, task) => {
        if (task.result_data) {
            let data = task.result_data;
            // Attempt to parse if it's a string, TinyFish sometimes returns stringified JSON
            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch (e) {
                    // keep as string if not parseable
                }
            }

            const taskLabel = task.task.toLowerCase();

            // Handle common wrapper keys: output, resultJson, result, data
            const payload = (typeof data === 'object' && data !== null)
                ? (data.output || data.resultJson || data.result || data.data || data)
                : data;

            // Extract mission-wide notes if they exist in the wrapper or payload
            const rawNote = data.note || (data.output?.note) || (data.result?.note) || (data.data?.note);
            if (rawNote) acc.notes.push(rawNote);

            // Helper to find the first array in an object
            const extractItems = (d: any) => {
                if (Array.isArray(d)) return d;
                if (typeof d === 'object' && d !== null) {
                    // Look for common array keys first
                    if (d.top_flights && Array.isArray(d.top_flights)) return d.top_flights;
                    if (d.flights && Array.isArray(d.flights)) return d.flights;
                    if (d.hotels && Array.isArray(d.hotels)) return d.hotels;
                    if (d.accommodation && Array.isArray(d.accommodation)) return d.accommodation;
                    
                    for (const key of Object.keys(d)) {
                        if (Array.isArray(d[key])) return d[key];
                    }
                }
                return [d];
            };

            if (taskLabel.includes('flight')) {
                acc.flights = [...acc.flights, ...extractItems(payload)];
            } else if (taskLabel.includes('hotel') || taskLabel.includes('accommodation')) {
                acc.hotels = [...acc.hotels, ...extractItems(payload)];
            } else if (taskLabel.includes('itinerary') || taskLabel.includes('plan')) {
                acc.itinerary = payload.days ? payload : (payload.itinerary || payload.message || payload.output || (typeof payload === 'string' ? payload : null));
            }
        }
        return acc;
    }, { flights: [], hotels: [], itinerary: null, notes: [] as string[] });

    const totalBudget = searchContext?.budget || 800;
    const travelers = 2;

    const totalConfirmedCost = [...summaryData.flights, ...summaryData.hotels].reduce((sum: number, item: any) => {
        const p = parsePrice(item.price);
        // If it looks like a "per night" hotel price, we could multiply by duration but let's keep it simple for now as per-listing
        return sum + p;
    }, 0);

    return (
        <div className="w-full max-w-7xl h-[85vh] overflow-hidden flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Mission Control Header */}
            <div className="glass-card p-4 border border-white/10 flex items-center justify-between bg-slate-900/40 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${isComplete ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-blue-500 animate-pulse'}`}></div>
                        <h3 className="text-sm font-black text-white tracking-[0.2em] uppercase italic">
                            {isComplete ? "Operation Success" : "Active Intelligence Search"}
                        </h3>
                    </div>

                    {!isComplete && (
                        <div className="flex items-center gap-3">
                            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                                <button
                                    onClick={() => setActiveSlot(1)}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSlot === 1 ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Agent 01
                                </button>
                                <button
                                    onClick={() => setActiveSlot(2)}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeSlot === 2 ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Agent 02
                                </button>
                            </div>

                            {agentSlots[activeSlot]?.runId && (
                                <a
                                    href={`https://agent.tinyfish.ai/runs/${agentSlots[activeSlot].runId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-[9px] font-black text-blue-400 uppercase tracking-widest transition-all flex items-center gap-2"
                                >
                                    Portal ↗
                                </a>
                            )}
                        </div>
                    )}
                </div>

                {isComplete && (
                    <button
                        onClick={onApprove}
                        className="premium-button px-8 py-3 rounded-2xl text-sm font-black shadow-2xl active:scale-95 transition-all"
                    >
                        CONFIRM RESERVATION
                    </button>
                )}
            </div>

            {/* Stage Canvas */}
            <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
                {isComplete ? (
                    <div className="w-full h-full grid grid-cols-12 gap-4 animate-in zoom-in-95 duration-1000 overflow-hidden">
                        {/* Summary Column */}
                        <div className="col-span-12 lg:col-span-7 flex flex-col gap-4 overflow-hidden h-full">
                            {/* Detailed Inventory Table */}
                            <div className="flex-[1.5] bg-slate-900/60 rounded-[40px] border border-white/5 overflow-hidden flex flex-col shadow-2xl backdrop-blur-xl min-h-0">
                                <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Verified Travel Inventory</h4>
                                    <div className="flex gap-2">
                                        <div className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[8px] font-black text-blue-400 uppercase tracking-widest">Live Verified</div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr>
                                                <th className="py-4 px-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Service Item</th>
                                                <th className="py-4 px-6 text-[9px] font-black text-slate-500 uppercase tracking-widest">Details</th>
                                                <th className="py-4 px-6 text-right text-[9px] font-black text-slate-500 uppercase tracking-widest">Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {[...summaryData.flights, ...summaryData.hotels].map((opt: any, i: number) => {
                                                if (typeof opt !== 'object' || opt === null) return null;
                                                const name = opt.name || opt.airline || opt.hotel || opt.flight || opt.carrier || opt.title || 'Package Item';
                                                const details = opt.details || opt.time || opt.rating || opt.duration || opt.description || (opt.class ? `${opt.class} Class` : null) || (opt.price_per_night ? 'Premium Accommodation' : 'Standard Package');
                                                const price = opt.price || opt.price_per_night || opt.cost || opt.total || opt.total_price || "Contact Agent";

                                                const priceDisplay = price === "Contact Agent" ? "Contact Agent" :
                                                    (typeof price === 'number' ? `$${price}` : (String(price).includes('$') ? price : `$${price}`));

                                                return (
                                                    <tr key={i} className="group hover:bg-white/[0.03] transition-colors">
                                                        <td className="py-5 px-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-2 h-2 rounded-full ${i < summaryData.flights.length ? 'bg-blue-500' : 'bg-purple-500'} shadow-lg`}></div>
                                                                <span className="text-sm font-bold text-white tracking-tight">{name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-5 px-6">
                                                            <span className="text-[11px] font-medium text-slate-400 italic line-clamp-2 max-w-[200px]">{details}</span>
                                                        </td>
                                                        <td className="py-5 px-6 text-right">
                                                            <span className={`text-lg font-black ${priceDisplay === "Contact Agent" ? "text-slate-500 text-sm" : "text-white"}`}>{priceDisplay}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {([...summaryData.flights, ...summaryData.hotels].length === 0 || [...summaryData.flights, ...summaryData.hotels].every(opt => typeof opt !== 'object')) && (
                                                <tr>
                                                    <td colSpan={3} className="py-20 text-center">
                                                        <p className="text-xs font-black text-slate-600 uppercase tracking-widest italic">Gathering specific pricing details from agents...</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Structured Itinerary */}
                            <div className="flex-1 min-h-0 bg-slate-900/60 rounded-[40px] border border-white/5 p-6 shadow-2xl backdrop-blur-xl flex flex-col gap-4 overflow-hidden">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] shrink-0">Strategic Itinerary</h4>
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                    <ItineraryView data={summaryData.itinerary} />
                                </div>
                            </div>
                        </div>

                        {/* Budget & Strategy Column */}
                        <div className="col-span-12 lg:col-span-5 flex flex-col min-h-0 overflow-hidden">
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-[40px] p-6 border border-white/10 shadow-2xl backdrop-blur-2xl flex flex-col shrink-0">
                                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-6">Financial Strategy Summary</h4>

                                <div className="space-y-6 flex-1">
                                    <div className="flex justify-between items-center group">
                                        <div>
                                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Target Budget</p>
                                            <p className="text-[10px] text-slate-400 font-bold italic">User Definition</p>
                                        </div>
                                        <p className="text-2xl font-black text-white tracking-tighter">${totalBudget}</p>
                                    </div>

                                    <div className="flex justify-between items-center group">
                                        <div>
                                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Confirmed Cost</p>
                                            <p className="text-[10px] text-slate-400 font-bold italic">Agent Optimized</p>
                                        </div>
                                        <p className="text-2xl font-black text-blue-400 tracking-tighter">${totalConfirmedCost}</p>
                                    </div>

                                    <div className="h-px bg-white/10"></div>

                                    <div className="bg-black/40 p-5 rounded-[24px] border border-white/5 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Travelers</p>
                                            <p className="text-lg font-black text-white">{travelers}</p>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-white/5 pt-3">
                                            <p className="text-[9px] text-blue-400 font-black uppercase tracking-[0.3em]">Total Value</p>
                                            <p className="text-3xl font-black text-blue-400 tracking-tight">${totalConfirmedCost}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-white/5 text-center shrink-0">
                                    {summaryData.notes.length > 0 && (
                                        <div className="mb-4 p-4 bg-black/40 rounded-2xl border border-blue-500/20 text-left">
                                            <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-2">Strategy Note</p>
                                            <p className="text-[10px] text-slate-400 leading-relaxed italic line-clamp-4">{summaryData.notes[0]}</p>
                                        </div>
                                    )}
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1 italic">Operation Status</p>
                                    <p className="text-[10px] font-black text-green-400 uppercase tracking-widest">Ready for Deployment</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Live Visualizer with Browser Frame */}
                        <div className="flex-[2.5] bg-slate-900 rounded-[40px] border border-white/10 overflow-hidden flex flex-col shadow-2xl group relative backdrop-blur-3xl">
                            {/* Browser Header */}
                            <div className="h-10 bg-slate-800/80 border-b border-white/5 flex items-center px-4 gap-4 shrink-0 justify-between">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/30"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/30"></div>
                                </div>
                                <div className="flex-1 max-w-lg mx-auto bg-black/40 h-6 rounded-lg border border-white/5 flex items-center px-3 gap-2 overflow-hidden">
                                    <div className="w-2.5 h-2.5 rounded bg-blue-500/40 shrink-0"></div>
                                    <span className="text-[9px] font-bold text-slate-500 truncate grayscale">https://secure.investigation.tinyfish.ai/agent_{activeSlot}</span>
                                </div>
                                <div className="w-16"></div>
                            </div>

                            <div className="flex-1 bg-white relative overflow-hidden flex items-center justify-center border-t border-black/10">
                                {agentSlots[activeSlot]?.streamingUrl ? (
                                    <iframe
                                        src={agentSlots[activeSlot].streamingUrl!}
                                        allow="clipboard-read; clipboard-write; display-capture"
                                        className="w-full h-full border-none animate-in fade-in zoom-in-110 duration-1000"
                                    />
                                ) : agentSlots[activeSlot]?.screenshot ? (
                                    <img
                                        src={agentSlots[activeSlot].screenshot!}
                                        alt="Current Site"
                                        className="w-full h-full object-contain animate-in fade-in zoom-in-110 duration-1000"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8 bg-slate-50">
                                        <div className="relative">
                                            <div className="w-20 h-20 border-[3px] border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                            </div>
                                        </div>
                                        <div className="text-center space-y-3">
                                            <p className="text-[12px] font-black uppercase tracking-[0.6em] text-slate-400">Synchronizing Viewport</p>
                                            <div className="flex items-center justify-center gap-4">
                                                <div className="px-3 py-1 bg-slate-200/50 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                                    Agent A0{activeSlot}
                                                </div>
                                                <div className="px-3 py-1 bg-blue-500/10 rounded-lg text-[8px] font-black text-blue-500 uppercase tracking-widest animate-pulse">
                                                    Live Uplink Active
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Live Overlay Badge */}
                                <div className="absolute bottom-6 right-6 px-4 py-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                    <span className="text-[10px] text-white font-black uppercase tracking-widest">1080P SOURCE FEED</span>
                                </div>
                            </div>
                        </div>

                        {/* Neural Feed Sidebar (Checklist Style) */}
                        <div className="flex-1 bg-slate-900/40 border border-white/5 rounded-[40px] p-8 flex flex-col shadow-2xl backdrop-blur-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Step Activity</h4>
                                <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[8px] font-black text-blue-400 uppercase">Live Trace</div>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                                {agentSlots[activeSlot]?.logs.slice().reverse().map((log, idx) => {
                                    const isLatest = idx === 0;
                                    return (
                                        <div key={idx} className={`flex gap-4 group transition-all duration-500 ${isLatest ? 'opacity-100 scale-100' : 'opacity-30 scale-95 blur-[0.5px] hover:blur-0 hover:opacity-100'}`}>
                                            <div className="flex flex-col items-center shrink-0">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isLatest ? 'border-blue-500 bg-blue-500/20' : 'border-slate-800'}`}>
                                                    {isLatest ? (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                                    ) : (
                                                        <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                                                    )}
                                                </div>
                                                <div className="flex-1 w-0.5 bg-slate-800/50 mt-2"></div>
                                            </div>
                                            <div className="pt-0.5">
                                                <p className={`text-xs font-bold leading-relaxed transition-all ${isLatest ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
                                                    {log}
                                                </p>
                                                {isLatest && <p className="text-[7px] font-black text-blue-400/60 uppercase tracking-widest mt-1">Processed in 1.4s</p>}
                                            </div>
                                        </div>
                                    );
                                })}

                                {agentSlots[activeSlot]?.logs.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                                        <div className="w-8 h-8 rounded-xl border-2 border-slate-700 border-dashed"></div>
                                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Interpreting Neural Weights...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Bottom Orchestration Bar */}
            {!isComplete && (
                <div className="flex gap-3 shrink-0 py-2 overflow-x-auto no-scrollbar">
                    {tasks.map((task, i) => (
                        <div key={i} className={`flex items-center gap-2 group px-4 py-2 rounded-2xl border transition-all duration-500 ${task.status === 'running'
                            ? 'bg-blue-600/20 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                            : task.status === 'completed'
                                ? 'bg-green-500/10 border-green-500/30'
                                : 'bg-black/20 border-white/5 opacity-40'
                            }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${task.status === 'running' ? 'bg-blue-400 animate-ping' :
                                task.status === 'completed' ? 'bg-green-400' : 'bg-slate-700'
                                }`}></div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${task.status === 'running' ? 'text-white' :
                                task.status === 'completed' ? 'text-green-400' : 'text-slate-600'
                                }`}>
                                Task {i + 1}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
