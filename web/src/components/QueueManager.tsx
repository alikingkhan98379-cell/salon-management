import React, { useState } from 'react';
import { 
  Clock, 
  Volume2, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Filter, 
  Car, 
  Sparkles,
  Search
} from 'lucide-react';
import { salonStore } from '../lib/mockStore';
import { Token } from '../types';

interface QueueManagerProps {
  onSelectTokenForInvoice?: (token: Token) => void;
}

export const QueueManager: React.FC<QueueManagerProps> = () => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');

  const tokens = salonStore.getTokens();
  const staffMembers = salonStore.getStaff();
  const currentServing = salonStore.getCurrentlyServingToken();
  const waitingTokens = salonStore.getWaitingTokens();

  const handleCallNext = () => {
    salonStore.callNextCustomer();
  };

  const handleComplete = (token: Token) => {
    salonStore.completeToken(token.id);
  };

  const handleSkip = (token: Token) => {
    salonStore.skipToken(token.id);
  };

  // Filter logic
  const filteredTokens = tokens.filter(t => {
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesStaff = selectedStaff === 'all' || t.staff_name === selectedStaff;
    const matchesSearch = !searchQuery || 
      t.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.token_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.service_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesStaff && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header and Live Queue Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Live Realtime Queue</span>
          <h2 className="text-2xl font-bold font-serif text-white">Queue & Token Operations</h2>
          <p className="text-xs text-slate-400 mt-1">
            Realtime updates synced across Reception, Mobile, and Customer Tracker
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCallNext}
            disabled={waitingTokens.length === 0}
            className={`px-5 py-3 rounded-xl font-bold text-xs tracking-wide flex items-center space-x-2 transition shadow-lg ${
              waitingTokens.length > 0
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-95'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>CALL NEXT IN QUEUE</span>
          </button>
        </div>
      </div>

      {/* Currently Serving Hero Card */}
      {currentServing && (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/30 border-2 border-amber-500/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              <div className="w-20 h-20 rounded-2xl bg-amber-500 text-slate-950 flex flex-col items-center justify-center font-mono font-black shadow-lg">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-900">CHAIR #1</span>
                <span className="text-3xl font-extrabold">{currentServing.token_code}</span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-500/30">
                    Currently In Service
                  </span>
                  {currentServing.service_type === 'home_service' && (
                    <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Car className="w-3 h-3" /> Home Visit
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mt-1">{currentServing.customer_name}</h3>
                <p className="text-xs text-amber-300 font-medium">{currentServing.service_name}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Stylist: <span className="text-slate-200 font-semibold">{currentServing.staff_name || 'Assigned Stylist'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleComplete(currentServing)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-600/20 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Service Complete</span>
              </button>
              <button
                onClick={() => handleSkip(currentServing)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border border-slate-700"
              >
                <XCircle className="w-4 h-4 text-red-400" />
                <span>Customer Left / Skip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search token code, name, service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {['all', 'waiting', 'serving', 'completed', 'skipped'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                filterStatus === st
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Staff Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 font-semibold">Barber:</span>
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Barbers</option>
            {staffMembers.map(s => (
              <option key={s.id} value={s.full_name}>{s.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tokens List / Cards */}
      <div className="space-y-3">
        {filteredTokens.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-amber-500/40" />
            <p className="font-semibold text-sm">No tokens match the selected filters</p>
            <p className="text-xs mt-1">Try resetting the search or status filter.</p>
          </div>
        ) : (
          filteredTokens.map((token, index) => {
            const isWaiting = token.status === 'waiting';
            const isServing = token.status === 'serving';
            const isCompleted = token.status === 'completed';

            return (
              <div
                key={token.id}
                className={`bg-slate-900 border rounded-2xl p-5 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isServing
                    ? 'border-amber-500/60 bg-amber-950/10'
                    : isWaiting
                    ? 'border-slate-800 hover:border-slate-700'
                    : 'border-slate-800/60 opacity-70'
                }`}
              >
                {/* Left: Token Number & Customer Info */}
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-mono font-bold shadow-md ${
                    isServing
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : isWaiting
                      ? 'bg-slate-800 text-amber-400 border border-amber-500/20'
                      : 'bg-slate-800/80 text-slate-400'
                  }`}>
                    <span className="text-sm">#{token.token_code}</span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-base font-bold text-white">{token.customer_name}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isServing
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                          : isWaiting
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {token.status}
                      </span>
                      {token.service_type === 'home_service' && (
                        <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-purple-500/30">
                          <Car className="w-3 h-3" /> Home
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 font-medium">{token.service_name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Stylist: <span className="text-slate-200 font-semibold">{token.staff_name || 'Assigned Stylist'}</span>
                    </p>
                  </div>
                </div>

                {/* Center: Wait Time Estimation */}
                <div className="flex items-center space-x-4">
                  {isWaiting && (
                    <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2 flex items-center space-x-2.5">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <div>
                        <span className="text-xs font-mono font-bold text-white block">
                          ~{token.estimated_wait_minutes} mins
                        </span>
                        <span className="text-[10px] text-slate-400">Position in queue: #{index + 1}</span>
                      </div>
                    </div>
                  )}

                  {isServing && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2 text-center">
                      <span className="text-xs font-bold text-amber-400 block">In Chair</span>
                      <span className="text-[10px] text-amber-300/80">Started just now</span>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="w-4 h-4" /> Finished
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-2">
                  {isWaiting && (
                    <>
                      <button
                        onClick={() => {
                          salonStore.callNextCustomer();
                        }}
                        className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center space-x-1 transition"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </button>
                      <button
                        onClick={() => handleSkip(token)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition"
                        title="Skip / Customer No Show"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {isServing && (
                    <button
                      onClick={() => handleComplete(token)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete & Bill</span>
                    </button>
                  )}

                  {token.status === 'skipped' && (
                    <button
                      onClick={() => {
                        token.status = 'waiting';
                        salonStore.subscribe(() => {});
                      }}
                      className="px-3 py-1 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" /> Requeue
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
