"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MutableRefObject, PointerEvent } from "react";

type GamePhase = "ready" | "playing" | "paused" | "crashed";
type HazardKind = "crow" | "rival";

type Hazard = {
  kind: HazardKind;
  x: number;
  y: number;
  speed: number;
  wobble: number;
  counted: boolean;
};

const WIDTH = 1000;
const HEIGHT = 560;
const PLAYER_X = 225;
const PLAYER_LIMITS = { top: 150, bottom: 425 };
const INITIAL_PLAYER_Y = 290;
const BEST_SCORE_EVENT = "ghuddi-best-score";
let cachedBestScore = 0;
let storageReadWarningShown = false;

function getBestScore() {
  try {
    const savedScore = Number(window.localStorage.getItem("ghuddi-best") || 0);
    if (Number.isFinite(savedScore)) {
      cachedBestScore = savedScore;
    }
  } catch (error) {
    if (!storageReadWarningShown) {
      console.warn("Could not load your best kite-flying score.", error);
      storageReadWarningShown = true;
    }
  }
  return cachedBestScore;
}

function subscribeToBestScore(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(BEST_SCORE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(BEST_SCORE_EVENT, onChange);
  };
}

function saveBestScore(score: number) {
  cachedBestScore = Math.max(cachedBestScore, score);
  try {
    window.localStorage.setItem("ghuddi-best", String(cachedBestScore));
  } catch (error) {
    console.warn("Could not save your best kite-flying score.", error);
  }
  window.dispatchEvent(new Event(BEST_SCORE_EVENT));
}

function drawCloud(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: string,
) {
  context.fillStyle = color;
  context.beginPath();
  context.ellipse(x, y, 35 * scale, 14 * scale, 0, 0, Math.PI * 2);
  context.ellipse(x - 17 * scale, y - 7 * scale, 17 * scale, 16 * scale, 0, 0, Math.PI * 2);
  context.ellipse(x + 3 * scale, y - 13 * scale, 22 * scale, 20 * scale, 0, 0, Math.PI * 2);
  context.ellipse(x + 24 * scale, y - 5 * scale, 18 * scale, 14 * scale, 0, 0, Math.PI * 2);
  context.fill();
}

function drawCrow(context: CanvasRenderingContext2D, x: number, y: number, flap: number) {
  context.save();
  context.translate(x, y);
  context.fillStyle = "#293841";
  context.beginPath();
  context.ellipse(0, 0, 24, 11, -0.08, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.ellipse(16, -8, 8, 8, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#F2A64D";
  context.beginPath();
  context.moveTo(22, -9);
  context.lineTo(34, -6);
  context.lineTo(22, -3);
  context.closePath();
  context.fill();
  context.strokeStyle = "#293841";
  context.lineWidth = 6;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(-4, -2);
  context.quadraticCurveTo(-15, -20 - flap, -27, -16);
  context.moveTo(-3, 0);
  context.quadraticCurveTo(-16, 13 + flap, -28, 12);
  context.stroke();
  context.restore();
}

function drawKite(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 1,
  colors = ["#F36D4E", "#FFC94A", "#4487CD", "#32A998"],
) {
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.strokeStyle = "rgba(54, 65, 57, .72)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(0, -37);
  context.lineTo(0, 37);
  context.moveTo(-29, 0);
  context.lineTo(29, 0);
  context.stroke();

  context.fillStyle = colors[0];
  context.beginPath();
  context.moveTo(0, -37);
  context.lineTo(29, 0);
  context.lineTo(0, 0);
  context.closePath();
  context.fill();
  context.fillStyle = colors[1];
  context.beginPath();
  context.moveTo(0, -37);
  context.lineTo(0, 0);
  context.lineTo(-29, 0);
  context.closePath();
  context.fill();
  context.fillStyle = colors[2];
  context.beginPath();
  context.moveTo(-29, 0);
  context.lineTo(0, 0);
  context.lineTo(0, 37);
  context.closePath();
  context.fill();
  context.fillStyle = colors[3];
  context.beginPath();
  context.moveTo(29, 0);
  context.lineTo(0, 0);
  context.lineTo(0, 37);
  context.closePath();
  context.fill();

  context.strokeStyle = "#F36D4E";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(0, 37);
  context.quadraticCurveTo(13, 54, -3, 65);
  context.quadraticCurveTo(-18, 74, -5, 85);
  context.stroke();
  context.fillStyle = "#FFC94A";
  context.beginPath();
  context.moveTo(3, 53);
  context.lineTo(10, 59);
  context.lineTo(3, 65);
  context.lineTo(-4, 59);
  context.closePath();
  context.fill();
  context.restore();
}

function drawBackground(context: CanvasRenderingContext2D, elapsed: number) {
  const sky = context.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#9EDDD7");
  sky.addColorStop(0.58, "#D7EACF");
  sky.addColorStop(1, "#FFE0AA");
  context.fillStyle = sky;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  const glow = context.createRadialGradient(765, 113, 10, 765, 113, 125);
  glow.addColorStop(0, "rgba(255, 213, 106, .9)");
  glow.addColorStop(1, "rgba(255, 213, 106, 0)");
  context.fillStyle = glow;
  context.fillRect(620, 0, 290, 260);
  context.fillStyle = "#FFD36F";
  context.beginPath();
  context.arc(765, 112, 38, 0, Math.PI * 2);
  context.fill();

  drawCloud(context, 116 + ((elapsed * 8) % 1200), 107, 0.9, "rgba(255,255,255,.55)");
  drawCloud(context, 630 - ((elapsed * 5) % 1100), 197, 0.67, "rgba(255,255,255,.48)");
  drawCloud(context, 890 - ((elapsed * 7) % 1300), 270, 0.82, "rgba(255,255,255,.6)");

  context.strokeStyle = "rgba(255,255,255,.58)";
  context.lineWidth = 2;
  for (let index = 0; index < 3; index += 1) {
    const x = 340 + index * 190 + Math.sin(elapsed * 0.7 + index) * 13;
    const y = 93 + index * 66;
    context.beginPath();
    context.moveTo(x, y);
    context.bezierCurveTo(x + 22, y - 13, x + 47, y + 15, x + 69, y + 3);
    context.stroke();
  }

  context.fillStyle = "#A5B6A1";
  context.beginPath();
  context.moveTo(0, 444);
  context.lineTo(0, 378);
  context.lineTo(62, 378);
  context.lineTo(62, 397);
  context.lineTo(123, 397);
  context.lineTo(123, 359);
  context.lineTo(188, 359);
  context.lineTo(188, 421);
  context.lineTo(248, 421);
  context.lineTo(248, 385);
  context.lineTo(305, 385);
  context.lineTo(305, 431);
  context.lineTo(363, 431);
  context.lineTo(363, 386);
  context.lineTo(431, 386);
  context.lineTo(431, 438);
  context.lineTo(492, 438);
  context.lineTo(492, 368);
  context.lineTo(554, 368);
  context.lineTo(554, 415);
  context.lineTo(628, 415);
  context.lineTo(628, 379);
  context.lineTo(696, 379);
  context.lineTo(696, 436);
  context.lineTo(759, 436);
  context.lineTo(759, 391);
  context.lineTo(827, 391);
  context.lineTo(827, 424);
  context.lineTo(891, 424);
  context.lineTo(891, 367);
  context.lineTo(955, 367);
  context.lineTo(955, 409);
  context.lineTo(1000, 409);
  context.lineTo(1000, 450);
  context.closePath();
  context.fill();

  context.fillStyle = "rgba(255, 245, 207, .7)";
  for (let x = 24; x < WIDTH; x += 68) {
    for (let y = 390; y < 440; y += 22) {
      context.fillRect(x, y + ((x + y) % 4) * 2, 8, 10);
    }
  }

  context.fillStyle = "#D58C69";
  context.fillRect(0, 448, WIDTH, 112);
  context.fillStyle = "#F0B081";
  context.beginPath();
  context.moveTo(0, 448);
  context.lineTo(1000, 448);
  context.lineTo(1000, 465);
  context.lineTo(0, 465);
  context.closePath();
  context.fill();
  context.strokeStyle = "rgba(127, 79, 63, .22)";
  context.lineWidth = 2;
  for (let x = -50; x < WIDTH; x += 130) {
    context.beginPath();
    context.moveTo(x, 466);
    context.lineTo(x + 65, HEIGHT);
    context.stroke();
  }
  context.fillStyle = "#A96755";
  context.fillRect(0, 536, WIDTH, 24);
  context.fillStyle = "rgba(255,255,255,.23)";
  context.fillRect(0, 536, WIDTH, 4);
}

type GameCanvasProps = {
  onCrash: (score: number) => void;
  onScore: (score: number, seconds: number) => void;
  phase: GamePhase;
  resetKey: number;
  directionRef: MutableRefObject<number>;
};

function GameCanvas({ onCrash, onScore, phase, resetKey, directionRef }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(phase);
  const playerYRef = useRef(INITIAL_PLAYER_Y);
  const hazardsRef = useRef<Hazard[]>([]);
  const elapsedRef = useRef(0);
  const spawnTimerRef = useRef(0);

  useEffect(() => {
    phaseRef.current = phase;
    if (phase === "playing" && elapsedRef.current === 0) {
      playerYRef.current = INITIAL_PLAYER_Y;
    }
  }, [phase]);

  useEffect(() => {
    playerYRef.current = INITIAL_PLAYER_Y;
    hazardsRef.current = [];
    elapsedRef.current = 0;
    spawnTimerRef.current = 0;
  }, [resetKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas) {
      return;
    }
    if (!context) {
      console.error("Unable to start the kite game because canvas is unavailable.");
      return;
    }

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = WIDTH * pixelRatio;
    canvas.height = HEIGHT * pixelRatio;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    let frame = 0;
    let lastTimestamp = 0;
    let lastHudUpdate = 0;

    const draw = (timestamp: number) => {
      const delta = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.05) : 0;
      lastTimestamp = timestamp;

      if (phaseRef.current === "playing") {
        elapsedRef.current += delta;
        playerYRef.current = Math.max(
          PLAYER_LIMITS.top,
          Math.min(PLAYER_LIMITS.bottom, playerYRef.current + directionRef.current * 255 * delta),
        );

        spawnTimerRef.current += delta;
        const spawnInterval = Math.max(1.05, 1.8 - elapsedRef.current * 0.012);
        if (spawnTimerRef.current >= spawnInterval) {
          spawnTimerRef.current = 0;
          hazardsRef.current.push({
            kind: Math.random() > 0.46 ? "crow" : "rival",
            x: WIDTH + 50,
            y: 170 + Math.random() * 250,
            speed: 210 + Math.min(elapsedRef.current * 2.4, 95) + Math.random() * 32,
            wobble: Math.random() * Math.PI * 2,
            counted: false,
          });
        }

        hazardsRef.current.forEach((hazard) => {
          hazard.x -= hazard.speed * delta;
          hazard.wobble += delta * 4;
          if (!hazard.counted && hazard.x < PLAYER_X - 48) {
            hazard.counted = true;
          }
        });
        hazardsRef.current = hazardsRef.current.filter((hazard) => hazard.x > -100);

        const collision = hazardsRef.current.some((hazard) => {
          const hazardWidth = hazard.kind === "crow" ? 48 : 34;
          const hazardHeight = hazard.kind === "crow" ? 25 : 39;
          return (
            Math.abs(hazard.x - PLAYER_X) < hazardWidth + 18 &&
            Math.abs(hazard.y - playerYRef.current) < hazardHeight + 20
          );
        });
        if (collision) {
          phaseRef.current = "crashed";
          onCrash(Math.floor(elapsedRef.current * 10));
        }

        if (timestamp - lastHudUpdate > 150) {
          onScore(Math.floor(elapsedRef.current * 10), Math.floor(elapsedRef.current));
          lastHudUpdate = timestamp;
        }
      }

      drawBackground(context, elapsedRef.current);
      hazardsRef.current.forEach((hazard) => {
        const y = hazard.y + Math.sin(hazard.wobble) * 7;
        if (hazard.kind === "crow") {
          drawCrow(context, hazard.x, y, Math.sin(hazard.wobble * 2) * 5);
        } else {
          drawKite(context, hazard.x, y, 0.72, ["#674FA4", "#F28C63", "#43A89B", "#F3C65A"]);
        }
      });
      drawKite(context, PLAYER_X, playerYRef.current + Math.sin(timestamp / 300) * 3);

      frame = window.requestAnimationFrame(draw);
    };

    frame = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(frame);
  }, [directionRef, onCrash, onScore]);

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      role="img"
      aria-label="A colorful kite flying across a Dhaka rooftop sky. Avoid crows and rival kites."
    />
  );
}

export default function KiteGame() {
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const directionRef = useRef(0);
  const best = useSyncExternalStore(subscribeToBestScore, getBestScore, () => 0);

  const updateScore = useCallback((nextScore: number, nextSeconds: number) => {
    setScore(nextScore);
    setSeconds(nextSeconds);
  }, []);

  const crash = useCallback((finalScore: number) => {
    setScore(finalScore);
    setPhase("crashed");
    directionRef.current = 0;
    saveBestScore(finalScore);
  }, []);

  const beginFlight = useCallback(() => {
    if (phase === "ready" || phase === "crashed") {
      setScore(0);
      setSeconds(0);
      setResetKey((current) => current + 1);
      directionRef.current = 0;
      setPhase("playing");
      return;
    }
    setPhase((current) => current === "playing" ? "paused" : "playing");
    directionRef.current = 0;
  }, [phase]);

  useEffect(() => {
    const onBlur = () => {
      directionRef.current = 0;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "arrowup" || key === "w") {
        event.preventDefault();
        directionRef.current = -1;
      } else if (key === "arrowdown" || key === "s") {
        event.preventDefault();
        directionRef.current = 1;
      } else if (key === " " && (phase === "ready" || phase === "paused" || phase === "crashed")) {
        event.preventDefault();
        beginFlight();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (["arrowup", "arrowdown", "w", "s"].includes(event.key.toLowerCase())) {
        directionRef.current = 0;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [beginFlight, phase]);

  const releaseDirection = () => {
    directionRef.current = 0;
  };

  const buttonLabel = phase === "playing" ? "Pause flight" : phase === "paused" ? "Keep flying" : phase === "crashed" ? "Fly again" : "Start flying";
  const statusText = phase === "crashed"
    ? "Tangled up! Give it another go."
    : phase === "paused"
      ? "Taking a breather?"
      : "Ready to take the sky?";

  return (
    <section className="game-section" aria-label="Kite flying game">
      <div className="game-card">
        <div className="game-toolbar">
          <div className="game-label">
            <span className="live-dot" />
            <span className="game-label-copy">
              <strong>ROOFTOP RUN</strong>
              <span>Keep your ghuddi in the air</span>
            </span>
          </div>
          <div className="game-stats" aria-live="polite">
            <div className="stat">
              <span>FLIGHT</span>
              <strong>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</strong>
            </div>
            <span className="stat-divider" />
            <div className="stat">
              <span>WIND POINTS</span>
              <strong>{String(score).padStart(3, "0")}</strong>
            </div>
            <span className="stat-divider best-divider" />
            <div className="stat best-stat">
              <span>BEST</span>
              <strong>{String(best).padStart(3, "0")}</strong>
            </div>
          </div>
          <button className="flight-button" type="button" onClick={beginFlight}>
            {phase === "playing" ? (
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9M11 3.5v9" /></svg>
            ) : (
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5 3.5 7 4.5-7 4.5z" /></svg>
            )}
            {buttonLabel}
          </button>
        </div>
        <div className={`scene-wrap ${phase === "crashed" ? "scene-crashed" : ""}`}>
          <GameCanvas
            onCrash={crash}
            onScore={updateScore}
            phase={phase}
            resetKey={resetKey}
            directionRef={directionRef}
          />
          {phase !== "playing" && (
            <div className="scene-message" aria-live="polite">
              <span className="scene-message-kicker">{phase === "crashed" ? "FLIGHT COMPLETE" : "THE SKY IS YOURS"}</span>
              <strong>{statusText}</strong>
              <span>{phase === "crashed" ? `You flew for ${seconds} seconds and scored ${score} points.` : "Press the button above when you’re ready."}</span>
            </div>
          )}
          <div className="sky-coordinate" aria-hidden="true">23° 43′ N &nbsp; 90° 24′ E</div>
          <div className="wind-indicator" aria-hidden="true">
            <span>WIND</span><strong>↗</strong><span>12 km/h</span>
          </div>
        </div>
        <div className="game-controls">
          <div className="controls-instruction">
            <span className="keyboard-hint" aria-hidden="true">
              <kbd>↑</kbd><kbd>↓</kbd>
            </span>
            <span><strong>Use your arrows</strong><small>or W / S to steer</small></span>
          </div>
          <span className="controls-divider" aria-hidden="true" />
          <div className="controls-instruction touch-instruction">
            <span className="touch-glyph" aria-hidden="true">☝</span>
            <span><strong>On a touchscreen?</strong><small>Hold a direction to fly</small></span>
          </div>
          <div className="touch-buttons" aria-label="Touch controls">
            <button type="button" aria-label="Fly up" onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              directionRef.current = -1;
            }} onPointerUp={releaseDirection} onPointerCancel={releaseDirection} onLostPointerCapture={releaseDirection}>
              <span aria-hidden="true">↑</span>
            </button>
            <button type="button" aria-label="Fly down" onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              directionRef.current = 1;
            }} onPointerUp={releaseDirection} onPointerCancel={releaseDirection} onLostPointerCapture={releaseDirection}>
              <span aria-hidden="true">↓</span>
            </button>
          </div>
        </div>
      </div>
      <p className="game-footnote"><span aria-hidden="true">✦</span> Dodge crows and rival kites. One tangle and it’s back to the rooftop!</p>
    </section>
  );
}
