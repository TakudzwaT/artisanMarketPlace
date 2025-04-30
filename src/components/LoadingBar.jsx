/* ----- src/components/LoadingBar.js ----- */
import React, { useState, useEffect } from 'react';
import './LoadingBar.css';

export default function LoadingBar({ duration = 3000 }) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    let start = null;
    const step = timestamp => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      setPercent(Math.floor(progress * 100));
      if (elapsed < duration) {
        requestAnimationFrame(step);
      }
    };
    const anim = requestAnimationFrame(step);
    return () => cancelAnimationFrame(anim);
  }, [duration]);

  return (
    <section className="loading-bar" data-testid="loading-wrapper" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={percent}>
      <progress className="fill" value={percent} max="100" />
      <figure className="handle" style={{ left: `${percent}%` }}>
        <figcaption className="percent-label">{percent}%</figcaption>
        <output className="knob" />
      </figure>
    </section>
  );
}
