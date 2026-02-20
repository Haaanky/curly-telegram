import { useState, useRef } from 'react';
import { Music } from 'lucide-react';

// Ambient drone frequencies — A minor pentatonic (A1–A3 range)
const DRONES: { freq: number; gainTarget: number; lfoRate: number }[] = [
  { freq: 55,  gainTarget: 0.18, lfoRate: 0.07 },  // A1 — djup bas
  { freq: 110, gainTarget: 0.13, lfoRate: 0.11 },  // A2
  { freq: 165, gainTarget: 0.09, lfoRate: 0.09 },  // E3
  { freq: 220, gainTarget: 0.07, lfoRate: 0.13 },  // A3
  { freq: 330, gainTarget: 0.04, lfoRate: 0.06 },  // E4 — luftig övertton
];

interface AudioState {
  ctx: AudioContext;
  master: GainNode;
}

export default function BackgroundMusic() {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const audioRef = useRef<AudioState | null>(null);

  function startAudio(vol: number) {
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = vol;
    master.connect(ctx.destination);

    DRONES.forEach(({ freq, gainTarget, lfoRate }, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      // Fade each drone in gradually for a soft swell
      gain.gain.linearRampToValueAtTime(gainTarget, ctx.currentTime + 3 + i * 0.8);

      // Slow tremolo LFO — each drone breathes at its own rate
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = lfoRate;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = gainTarget * 0.3;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      osc.connect(gain);
      gain.connect(master);
      osc.start();
      lfo.start();
    });

    audioRef.current = { ctx, master };
  }

  function stopAudio() {
    if (!audioRef.current) return;
    const { ctx, master } = audioRef.current;
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    setTimeout(() => ctx.close(), 2000);
    audioRef.current = null;
  }

  function toggle() {
    if (playing) {
      stopAudio();
      setPlaying(false);
    } else {
      startAudio(volume);
      setPlaying(true);
    }
  }

  function handleVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.master.gain.value = v;
    }
  }

  return (
    <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
      <button
        onClick={toggle}
        title={playing ? 'Stäng av stämningsmusik' : 'Spela stämningsmusik'}
        className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors
          ${playing
            ? 'text-green-400 bg-green-900/30 hover:bg-green-900/50'
            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
      >
        <Music size={13} />
        <span>Musik</span>
      </button>
      {playing && (
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={handleVolume}
          className="w-16 h-1 accent-green-400 cursor-pointer"
          title="Volym"
        />
      )}
    </div>
  );
}
