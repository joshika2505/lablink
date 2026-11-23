import React from 'react';
import type { Equipment } from '../../types/lablink';

interface ClayArtworkProps {
  theme: Equipment['clayTheme'];
  className?: string;
}

export const ClayEquipmentArtwork: React.FC<ClayArtworkProps> = ({ theme, className = '' }) => {
  switch (theme) {
    case 'microscope':
      return (
        <div
          className={`relative w-full h-full flex items-center justify-center bg-gradient-to-br from-[#e7f8f3] via-[#fef9ee] to-[#dff3fd] overflow-hidden ${className}`}
        >
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-[#a8e8d5]/40 blur-xl" />
          <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-[#b0e4fd]/45 blur-xl" />
          <svg viewBox="0 0 220 160" className="w-44 h-36 drop-shadow-md" aria-hidden="true">
            <defs>
              <linearGradient id="clayMint" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="55%" stopColor="#d9f5ec" />
                <stop offset="100%" stopColor="#94d3c1" />
              </linearGradient>
              <linearGradient id="clayDark" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3f4945" />
                <stop offset="100%" stopColor="#1d1c15" />
              </linearGradient>
            </defs>
            {/* Base */}
            <rect x="48" y="124" width="124" height="20" rx="10" fill="url(#clayMint)" stroke="#fff" strokeWidth="2" />
            <rect x="64" y="116" width="92" height="10" rx="5" fill="#b0e4fd" />
            {/* C-Arm */}
            <path
              d="M 136 118 C 164 118, 168 42, 126 36"
              fill="none"
              stroke="url(#clayMint)"
              strokeWidth="18"
              strokeLinecap="round"
            />
            <path
              d="M 136 118 C 164 118, 168 42, 126 36"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3"
              strokeOpacity="0.6"
              strokeLinecap="round"
            />
            {/* Stage */}
            <rect x="62" y="92" width="66" height="9" rx="4.5" fill="url(#clayDark)" />
            <rect x="78" y="88" width="32" height="5" rx="2.5" fill="#a8e8d5" />
            {/* Glowing Sample */}
            <ellipse cx="94" cy="87" rx="9" ry="2.5" fill="#a8e8d5" opacity="0.9" />
            {/* Optical Barrel */}
            <rect x="86" y="28" width="22" height="44" rx="8" fill="#ffffff" stroke="#d9f5ec" strokeWidth="2" />
            <rect x="82" y="20" width="30" height="12" rx="6" fill="#29695a" />
            <rect x="90" y="70" width="14" height="10" rx="4" fill="#b0e4fd" />
            {/* Eyepiece */}
            <rect
              x="66"
              y="18"
              width="24"
              height="10"
              rx="5"
              transform="rotate(-25 66 18)"
              fill="url(#clayDark)"
            />
            {/* Focus Knob */}
            <circle cx="148" cy="90" r="10" fill="#ffcfd9" stroke="#ffffff" strokeWidth="2" />
            <circle cx="148" cy="90" r="4" fill="#82505d" />
          </svg>
        </div>
      );

    case 'robot':
      return (
        <div
          className={`relative w-full h-full flex items-center justify-center bg-gradient-to-br from-[#dff3fd] via-[#fef9ee] to-[#e7f8f3] overflow-hidden ${className}`}
        >
          <div className="absolute -top-6 left-4 w-28 h-28 rounded-full bg-[#b0e4fd]/50 blur-xl" />
          <svg viewBox="0 0 220 160" className="w-44 h-36 drop-shadow-md" aria-hidden="true">
            {/* Workbench */}
            <rect x="38" y="128" width="144" height="16" rx="8" fill="#ffffff" stroke="#e7e2d7" strokeWidth="2" />
            <rect x="66" y="114" width="44" height="16" rx="8" fill="#b0e4fd" stroke="#ffffff" strokeWidth="2" />
            {/* Lower Arm */}
            <path d="M 88 114 L 116 74" stroke="#ffffff" strokeWidth="18" strokeLinecap="round" />
            <path d="M 88 114 L 116 74" stroke="#d4edf9" strokeWidth="10" strokeLinecap="round" />
            {/* Joint 1 */}
            <circle cx="88" cy="114" r="11" fill="#29695a" stroke="#ffffff" strokeWidth="2.5" />
            {/* Upper Arm */}
            <path d="M 116 74 L 154 54" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" />
            <circle cx="116" cy="74" r="10" fill="#a8e8d5" stroke="#ffffff" strokeWidth="2.5" />
            {/* Wrist & Gripper */}
            <circle cx="154" cy="54" r="8" fill="#ffcfd9" stroke="#ffffff" strokeWidth="2" />
            <path d="M 160 56 L 172 68 M 150 60 L 160 74" stroke="#2f6579" strokeWidth="4.5" strokeLinecap="round" />
            {/* Target Cube */}
            <rect x="150" y="96" width="22" height="22" rx="6" fill="#f8de91" stroke="#ffffff" strokeWidth="2" />
          </svg>
        </div>
      );

    case 'oscilloscope':
      return (
        <div
          className={`relative w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ffe8ee] via-[#fef9ee] to-[#dff3fd] overflow-hidden ${className}`}
        >
          <div className="absolute -bottom-6 right-4 w-28 h-28 rounded-full bg-[#ffcfd9]/45 blur-xl" />
          <svg viewBox="0 0 220 160" className="w-44 h-36 drop-shadow-md" aria-hidden="true">
            <rect x="34" y="28" width="152" height="104" rx="20" fill="#ffffff" stroke="#f2ede2" strokeWidth="3" />
            <rect x="46" y="42" width="90" height="74" rx="12" fill="#1d2b2a" />
            {/* Waveforms */}
            <path
              d="M 52 78 Q 64 52, 76 78 T 100 78 T 124 78"
              fill="none"
              stroke="#a8e8d5"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M 52 92 Q 68 106, 84 92 T 116 92 T 132 92"
              fill="none"
              stroke="#b0e4fd"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Knobs */}
            <circle cx="156" cy="54" r="9" fill="#b0e4fd" stroke="#ffffff" strokeWidth="2" />
            <circle cx="156" cy="80" r="9" fill="#a8e8d5" stroke="#ffffff" strokeWidth="2" />
            <circle cx="156" cy="106" r="7" fill="#ffcfd9" stroke="#ffffff" strokeWidth="2" />
            <rect x="148" y="118" width="24" height="6" rx="3" fill="#f8de91" />
          </svg>
        </div>
      );

    case 'printer':
      return (
        <div
          className={`relative w-full h-full flex items-center justify-center bg-gradient-to-br from-[#fff3d1] via-[#fef9ee] to-[#e7f8f3] overflow-hidden ${className}`}
        >
          <svg viewBox="0 0 220 160" className="w-44 h-36 drop-shadow-md" aria-hidden="true">
            <rect x="52" y="114" width="116" height="24" rx="10" fill="#ffffff" stroke="#e7e2d7" strokeWidth="2" />
            {/* Amber Cover */}
            <rect x="62" y="24" width="96" height="94" rx="16" fill="#f8de91" fillOpacity="0.6" stroke="#ffffff" strokeWidth="2.5" />
            {/* Build Platform */}
            <rect x="86" y="40" width="48" height="10" rx="4" fill="#2f6579" />
            <rect x="106" y="28" width="8" height="16" rx="3" fill="#3f4945" />
            {/* Printed Object */}
            <polygon points="110,64 128,98 92,98" fill="#a8e8d5" stroke="#ffffff" strokeWidth="2" />
            {/* Screen */}
            <rect x="92" y="121" width="36" height="10" rx="5" fill="#29695a" />
          </svg>
        </div>
      );

    case 'compute':
      return (
        <div
          className={`relative w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ede6fb] via-[#fef9ee] to-[#dff3fd] overflow-hidden ${className}`}
        >
          <svg viewBox="0 0 220 160" className="w-44 h-36 drop-shadow-md" aria-hidden="true">
            <rect x="54" y="22" width="112" height="116" rx="18" fill="#ffffff" stroke="#e7e2d7" strokeWidth="2.5" />
            <rect x="66" y="36" width="88" height="22" rx="8" fill="#1d1c15" />
            <rect x="66" y="66" width="88" height="22" rx="8" fill="#1d1c15" />
            <rect x="66" y="96" width="88" height="22" rx="8" fill="#1d1c15" />
            <circle cx="78" cy="47" r="4" fill="#a8e8d5" />
            <circle cx="78" cy="77" r="4" fill="#b0e4fd" />
            <circle cx="78" cy="107" r="4" fill="#d9c8f2" />
            <rect x="90" y="44" width="52" height="6" rx="3" fill="#3f4945" />
            <rect x="90" y="74" width="52" height="6" rx="3" fill="#3f4945" />
            <rect x="90" y="104" width="52" height="6" rx="3" fill="#3f4945" />
          </svg>
        </div>
      );

    case 'cnc':
      return (
        <div
          className={`relative w-full h-full flex items-center justify-center bg-gradient-to-br from-[#e7f8f3] via-[#fef9ee] to-[#f8de91]/35 overflow-hidden ${className}`}
        >
          <svg viewBox="0 0 220 160" className="w-44 h-36 drop-shadow-md" aria-hidden="true">
            <rect x="42" y="24" width="136" height="112" rx="18" fill="#ffffff" stroke="#e7e2d7" strokeWidth="2.5" />
            <rect x="56" y="38" width="108" height="68" rx="12" fill="#2f6579" fillOpacity="0.14" stroke="#b0e4fd" strokeWidth="2" />
            {/* Spindle */}
            <rect x="102" y="42" width="16" height="30" rx="5" fill="#29695a" />
            <rect x="107" y="72" width="6" height="14" rx="2" fill="#3f4945" />
            {/* Stock */}
            <rect x="84" y="88" width="52" height="14" rx="4" fill="#a8e8d5" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="70" cy="120" r="6" fill="#ffcfd9" />
            <circle cx="90" cy="120" r="6" fill="#a8e8d5" />
          </svg>
        </div>
      );

    case 'xrd':
    default:
      return (
        <div
          className={`relative w-full h-full flex items-center justify-center bg-gradient-to-br from-[#dff3fd] via-[#fef9ee] to-[#ede6fb] overflow-hidden ${className}`}
        >
          <svg viewBox="0 0 220 160" className="w-44 h-36 drop-shadow-md" aria-hidden="true">
            <rect x="40" y="28" width="140" height="104" rx="20" fill="#ffffff" stroke="#e7e2d7" strokeWidth="2.5" />
            <circle cx="110" cy="80" r="34" fill="#f8f3e8" stroke="#b0e4fd" strokeWidth="4" />
            <circle cx="110" cy="80" r="14" fill="#a8e8d5" stroke="#ffffff" strokeWidth="2" />
            <line x1="76" y1="80" x2="144" y2="80" stroke="#29695a" strokeWidth="3" strokeDasharray="4 4" />
            <circle cx="80" cy="60" r="6" fill="#ffcfd9" />
            <circle cx="140" cy="60" r="6" fill="#d9c8f2" />
          </svg>
        </div>
      );
  }
};
