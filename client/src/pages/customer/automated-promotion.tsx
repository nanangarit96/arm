import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Play, Clock, CheckCircle, ArrowRight } from "lucide-react";

export default function AutomatedPromotionPage() {
  const [, setLocation] = useLocation();
  const [state, setState] = useState<"idle" | "running" | "finished">("idle");
  const [timeLeft, setTimeLeft] = useState(300); // 5 menit = 300 detik
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const totalTime = 300;
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  const offset = circumference - (timeLeft / totalTime) * circumference;
  const isLowTime = timeLeft <= 60;
  
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  const startTimer = () => {
    setState("running");
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          setState("finished");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  const handleCheckCommission = () => {
    setLocation("/customer");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] pt-8 md:pt-10 pb-6 text-center relative overflow-hidden shadow-2xl">
          
          {/* Header */}
          <div className="mb-8 px-8">
            <h1 className="text-xl font-bold tracking-tight mb-2 text-white" data-testid="text-title">
              AUTOMATED TASK WORK SYSTEM
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed px-4">
              Sistem akan memproses secara otomatis hingga waktu yang ditentukan selesai.
            </p>
          </div>
          
          {/* Timer Circle */}
          <div className="relative flex justify-center items-center mb-10 px-8">
            <svg className="w-64 h-64" viewBox="0 0 256 256">
              {/* Background Circle */}
              <circle 
                className="text-slate-800" 
                strokeWidth="8" 
                stroke="currentColor" 
                fill="transparent" 
                r={radius} 
                cx="128" 
                cy="128"
              />
              {/* Progress Circle */}
              <circle 
                className={`transition-all duration-1000 ${
                  state === "finished" 
                    ? "text-slate-800" 
                    : isLowTime 
                      ? "text-red-500" 
                      : "text-cyan-400"
                }`}
                strokeWidth="8" 
                strokeLinecap="round"
                stroke="currentColor" 
                fill="transparent" 
                r={radius} 
                cx="128" 
                cy="128"
                style={{
                  strokeDasharray: `${circumference} ${circumference}`,
                  strokeDashoffset: state === "finished" ? circumference : offset,
                  transform: "rotate(-90deg)",
                  transformOrigin: "center",
                }}
                data-testid="progress-circle"
              />
            </svg>
            
            {/* Timer Content */}
            <div className="absolute flex flex-col items-center">
              <span 
                className={`text-6xl font-bold tracking-tighter font-mono ${
                  isLowTime && state === "running" ? "text-red-500" : "text-white"
                }`}
                data-testid="text-timer"
              >
                {timerDisplay}
              </span>
              <span className="text-xs tracking-[0.3em] text-slate-500 mt-2 uppercase font-semibold">
                Sisa Waktu
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-4 px-8 mb-8">
            {/* State: Idle - Start Button */}
            {state === "idle" && (
              <button 
                onClick={startTimer}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-cyan-500/25"
                data-testid="button-start"
              >
                <Play className="h-5 w-5" fill="currentColor" />
                MULAI
              </button>
            )}
            
            {/* State: Running - Progress */}
            {state === "running" && (
              <div 
                className="w-full bg-slate-800/50 border border-slate-700 text-amber-400 py-4 px-6 rounded-2xl flex items-center justify-center gap-3 animate-pulse"
                data-testid="status-progress"
              >
                <Clock className="h-5 w-5" />
                <span className="font-medium">Work in progress...</span>
              </div>
            )}
            
            {/* State: Finished */}
            {state === "finished" && (
              <div className="space-y-4">
                <div 
                  className="w-full bg-green-500/10 border border-green-500/30 text-green-400 py-4 px-6 rounded-2xl flex items-center justify-center gap-2"
                  data-testid="status-finished"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Waktu Selesai!</span>
                </div>
                
                <button 
                  onClick={handleCheckCommission}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/25"
                  data-testid="button-check-commission"
                >
                  Cek Komisi Sekarang
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
          
          {/* Marquee */}
          <div className="overflow-hidden mb-6">
            <div className="animate-marquee whitespace-nowrap text-xs font-medium uppercase tracking-widest text-cyan-400/60">
              • Sistem akan memproses secara otomatis hingga waktu yang ditentukan selesai • Sistem akan memproses secara otomatis hingga waktu yang ditentukan selesai •
            </div>
          </div>
          
          {/* Footer */}
          <div className="text-[10px] text-slate-500 uppercase tracking-widest opacity-60">
            Copyright © 2026 Giorgio Armani S.p.A.
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 15s linear infinite;
        }
      `}</style>
    </div>
  );
}
