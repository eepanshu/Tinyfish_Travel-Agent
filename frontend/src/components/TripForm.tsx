"use client";
import { useState } from 'react';

export default function TripForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    origin: 'Delhi',
    destination: 'Dubai',
    start_date: '2026-04-12',
    end_date: '2026-04-15',
    budget: 800,
    user_profile: {
      name: '',
      email: '',
      phone: ''
    }
  });

  return (
    <div className="glass-card p-8 w-full max-w-2xl border border-white/10">
      <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        Plan Your Next Adventure
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-white/5">
        <div className="space-y-2">
          <label htmlFor="origin" className="text-sm text-slate-400 ml-1">Origin</label>
          <input
            id="origin"
            type="text"
            className="premium-input w-full p-3"
            value={formData.origin}
            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="destination" className="text-sm text-slate-400 ml-1">Destination</label>
          <input
            id="destination"
            type="text"
            className="premium-input w-full p-3"
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="start_date" className="text-sm text-slate-400 ml-1">Start Date</label>
          <input
            id="start_date"
            type="date"
            className="premium-input w-full p-3"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="end_date" className="text-sm text-slate-400 ml-1">End Date</label>
          <input
            id="end_date"
            type="date"
            className="premium-input w-full p-3"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>
        <div className="col-span-full space-y-2">
          <label htmlFor="budget" className="text-sm text-slate-400 ml-1">Budget ($)</label>
          <input
            id="budget"
            type="number"
            className="premium-input w-full p-3"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="pt-6 space-y-4">
        <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          Passenger Details (Optional)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="name" className="text-[10px] text-slate-500 uppercase ml-1">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="e.g. John Doe"
              className="premium-input w-full p-2.5 text-sm"
              value={formData.user_profile?.name || ''}
              onChange={(e) => setFormData({
                ...formData,
                user_profile: { ...(formData.user_profile || {}), name: e.target.value }
              })}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="email" className="text-[10px] text-slate-500 uppercase ml-1">Email</label>
            <input
              id="email"
              type="email"
              placeholder="john@example.com"
              className="premium-input w-full p-2.5 text-sm"
              value={formData.user_profile?.email || ''}
              onChange={(e) => setFormData({
                ...formData,
                user_profile: { ...(formData.user_profile || {}), email: e.target.value }
              })}
            />
          </div>
          <div className="col-span-full space-y-1">
            <label htmlFor="phone" className="text-[10px] text-slate-500 uppercase ml-1">Phone Number</label>
            <input
              id="phone"
              type="tel"
              placeholder="+1 234 567 890"
              className="premium-input w-full p-2.5 text-sm"
              value={formData.user_profile?.phone || ''}
              onChange={(e) => setFormData({
                ...formData,
                user_profile: { ...(formData.user_profile || {}), phone: e.target.value }
              })}
            />
          </div>
        </div>
      </div>

      <button
        onClick={() => onSubmit(formData)}
        className="premium-button w-full mt-8 py-4 rounded-xl font-semibold text-lg animate-glow"
      >
        Autonomous Plan Trip
      </button>
    </div>
  );
}
