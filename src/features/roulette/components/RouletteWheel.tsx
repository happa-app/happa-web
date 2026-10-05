"use client";
// La rueda: un trozo por persona, la flecha arriba (fija) y la rueda que gira hasta "rotation".
// Es solo para verlo: el resultado se dice también con texto (y lo decide la base de datos).
import { slicePath, polar, segmentAngle } from "../wheel";
import styles from "./Roulette.module.css";

// Colores de los trozos (con el texto que se lee bien encima)
const COLORS = [
  { fill: "#69ae7e", text: "#ffffff" },
  { fill: "#a1d1cd", text: "#1f3b4d" },
  { fill: "#e3a75f", text: "#1f3b4d" },
  { fill: "#3e7d55", text: "#ffffff" },
  { fill: "#e6f2ea", text: "#1f3b4d" },
  { fill: "#7fbfba", text: "#1f3b4d" },
];

const SIZE = 300;
const C = SIZE / 2;
const R = 140;

function colorFor(index: number, count: number) {
  let i = index % COLORS.length;
  // Que el último no sea del mismo color que el primero (están juntos)
  if (count > 1 && index === count - 1 && i === 0) i = 1 + (index % (COLORS.length - 1));
  return COLORS[i];
}

function shortName(name: string, count: number): string {
  const max = count > 10 ? 7 : count > 6 ? 9 : 12;
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

type Props = {
  // Nombres de los trozos, en orden (vacío: la rueda en gris)
  names: string[];
  rotation: number;
  spinning: boolean;
  label: string;
};

export function RouletteWheel({ names, rotation, spinning, label }: Props) {
  const count = names.length;
  const seg = segmentAngle(count);
  const fontSize = count > 12 ? 10 : count > 8 ? 12 : 14;

  return (
    <div className={styles.wheelBox} role="img" aria-label={label}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={styles.wheel} aria-hidden="true">
        <g
          className={spinning ? styles.rotorSpinning : styles.rotor}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {count === 0 ? (
            <circle cx={C} cy={C} r={R} fill="var(--color-border)" />
          ) : (
            names.map((name, i) => {
              const start = i * seg;
              const mid = start + seg / 2;
              const color = colorFor(i, count);
              const at = polar(C, C, R * 0.6, mid);
              // El nombre, a lo largo del radio: hacia fuera en la mitad derecha y hacia dentro en la
              // izquierda (así nunca queda boca abajo)
              const turn = mid < 180 ? mid - 90 : mid + 90;
              return (
                <g key={`${i}-${name}`}>
                  <path d={slicePath(C, C, R, start, start + seg)} fill={color.fill} stroke="#ffffff" strokeWidth={2} />
                  <text
                    x={at.x}
                    y={at.y}
                    fill={color.text}
                    fontSize={fontSize}
                    fontWeight={700}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${turn} ${at.x} ${at.y})`}
                  >
                    {shortName(name, count)}
                  </text>
                </g>
              );
            })
          )}
        </g>
        {/* Centro y borde */}
        <circle cx={C} cy={C} r={R} fill="none" stroke="var(--color-surface)" strokeWidth={4} />
        <circle cx={C} cy={C} r={22} fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth={2} />
        <circle cx={C} cy={C} r={7} fill="var(--color-brand-strong)" />
        {/* La flecha, arriba */}
        <path d={`M ${C - 14} 4 L ${C + 14} 4 L ${C} 32 Z`} fill="var(--color-text)" stroke="var(--color-surface)" strokeWidth={3} strokeLinejoin="round" />
      </svg>
    </div>
  );
}
