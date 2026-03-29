"use client";
import { useState } from 'react';
import TripForm from '@/components/TripForm';
import AgentStatus from '@/components/AgentStatus';

export default function Home() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchContext, setSearchContext] = useState<any>(null);
  const [agentSlots, setAgentSlots] = useState<{ [key: number]: { logs: string[], screenshot: string | null, runId: string | null, streamingUrl: string | null } }>({
    1: { logs: [], screenshot: null, runId: null, streamingUrl: null },
    2: { logs: [], screenshot: null, runId: null, streamingUrl: null }
  });

  const handlePlanTrip = async (data: any) => {
    setLoading(true);
    setTasks([]);
    setTasks([]);
    setSearchContext(data);

    try {
      const response = await fetch('http://localhost:8000/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      setTasks(result.tasks);

      const planId = result.id;
      if (!planId) return;

      const ws = new WebSocket(`ws://localhost:8000/ws/${planId}`);

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'agent_log') {
          const slot = msg.agent_slot || 1;
          const event = msg.event;

          // Permissive log extraction
          const logMsg = event.message || event.purpose || event.description || (event.type === 'info' ? event.message : null);

          setAgentSlots(prev => ({
            ...prev,
            [slot]: {
              ...prev[slot],
              logs: logMsg
                ? [...prev[slot].logs, logMsg].slice(-15)
                : prev[slot].logs,
              screenshot: event.type === 'screenshot' || event.screenshot ? (event.screenshot || event.imageUrl) : prev[slot].screenshot,
              runId: (event.type === 'metadata' ? event.run_id : null) || event.runId || prev[slot].runId,
              streamingUrl: event.streamingUrl || (event.type === 'metadata' ? event.streamingUrl : null) || prev[slot].streamingUrl
            }
          }));

          if (msg.event.type === 'result' || msg.event.type === 'final_response' || msg.event.type === 'COMPLETE') {
            setTasks(prev => prev.map(t =>
              t.id === msg.task_id ? { ...t, status: 'completed', result_data: msg.event.resultJson || msg.event } : t
            ));
          }
        } else if (msg.type === 'task_update') {
          setTasks(prev => prev.map(t =>
            t.id === msg.task_id ? { ...t, status: msg.status } : t
          ));
        } else if (msg.type === 'plan_complete') {
          setAgentSlots(prev => ({
            ...prev,
            1: { ...prev[1], logs: [...prev[1].logs, "Analysis complete."] },
            2: { ...prev[2], logs: [...prev[2].logs, "Analysis complete."] }
          }));
          ws.close();
        }
      };
    } catch (error) {
      console.error("Failed to plan trip", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-24 space-y-12">
      <div className="text-center space-y-4 max-w-3xl">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white">
          TinyFish <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent underline decoration-blue-500/30">Travel Agent</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400">
          The ultimate autonomous agent for multi-site travel orchestration.
          Search flights, find hotels, and build itineraries in seconds.
        </p>
      </div>

      <TripForm onSubmit={handlePlanTrip} />

      <AgentStatus
        tasks={tasks}
        agentSlots={agentSlots}
        searchContext={searchContext}
        onApprove={() => alert("Proceeding to final booking site with your details...")}
      />

      <div className="fixed bottom-8 text-slate-500 text-sm flex gap-8">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          TinyFish Agent Active
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          Groq Intelligence Powered
        </div>
      </div>
    </main>
  );
}
