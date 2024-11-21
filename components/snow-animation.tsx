"use client";

import { useEffect, useState } from 'react';

export const SnowAnimation = () => {
  const [snowflakes, setSnowflakes] = useState<Array<{ id: number; left: number; animationDuration: number }>>([]);

  useEffect(() => {
    const createSnowflake = () => {
      const id = Date.now();
      const left = Math.random() * 100;
      const animationDuration = 5 + Math.random() * 10;

      setSnowflakes(prev => [...prev, { id, left, animationDuration }]);

      setTimeout(() => {
        setSnowflakes(prev => prev.filter(flake => flake.id !== id));
      }, animationDuration * 1000);
    };

    const interval = setInterval(createSnowflake, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none">
      {snowflakes.map(({ id, left, animationDuration }) => (
        <div
          key={id}
          className="absolute top-0 text-white opacity-70"
          style={{
            left: `${left}%`,
            animation: `fall ${animationDuration}s linear`,
          }}
        >
          ❄
        </div>
      ))}
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-5vh) rotate(0deg);
          }
          100% {
            transform: translateY(105vh) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};