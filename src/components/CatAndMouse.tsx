'use client';

import { FC, useRef, useState, useMemo, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useAnimation } from 'framer-motion';
import Image from 'next/image';
import ReactDOM from 'react-dom';
import Matter, { Engine, Render, World, Bodies, Body, Events, Composite } from 'matter-js';

function getCatTarget(
  mouse: { x: number; y: number },
  cat: { x: number; y: number },
  distance: number
) {
  const dx = mouse.x - cat.x;
  const dy = mouse.y - cat.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < distance) {
    // If too close, stay put
    return cat;
  }
  const ratio = (len - distance) / len;
  return {
    x: cat.x + dx * ratio,
    y: cat.y + dy * ratio,
  };
}

const CAT_SIZE = 420;
const MOUSE_SIZE = 96;
const CAT_DISTANCE = 160;
const TREATS = ['🐟', '🧀', '🥩', '🍗', '🍤'];
const FLOWERS = ['🌸', '🌻', '🌼', '🌷', '🌺', '💐'];
const FLOWER_COUNT = 14;

// Cloud positions and animation configs
const cloudConfigs = [
  { top: '8%', left: '5%', width: 160, opacity: 0.7, duration: 60, delay: 0 },
  { top: '18%', left: '20%', width: 220, opacity: 0.6, duration: 80, delay: 10 },
  { top: '28%', left: '60%', width: 120, opacity: 0.5, duration: 50, delay: 20 },
  { top: '12%', left: '70%', width: 180, opacity: 0.8, duration: 70, delay: 30 },
  { top: '22%', left: '40%', width: 140, opacity: 0.7, duration: 65, delay: 15 },
];

// Grass blade image tiling
const GRASS_BLADE_WIDTH = 48;
const GRASS_BLADE_HEIGHT = 80;
const GRASS_BLADE_COUNT = Math.ceil(1000 / GRASS_BLADE_WIDTH) + 2; // cover 1000px playground width

// Physics constants
const FOOD_SIZE = 48;
const FOOD_BOUNCE = 0.4;
const FOOD_FRICTION = 0.01;
const FOOD_DENSITY = 0.001;
const GROUND_HEIGHT = 40;

const CatAndMouse: FC = () => {
  const playgroundRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 300, y: 300 });
  const [catPos, setCatPos] = useState({ x: 300, y: 500 });
  const [treats, setTreats] = useState<{ x: number; y: number; emoji: string; id: number }[]>([]);
  const [catChasingTreat, setCatChasingTreat] = useState(false);
  const [activeTreatId, setActiveTreatId] = useState<number | null>(null);
  const treatIdRef = useRef(0);

  // Smooth motion values for the mouse
  const mouseX = useSpring(useMotionValue(mousePos.x), { stiffness: 200, damping: 20 });
  const mouseY = useSpring(useMotionValue(mousePos.y), { stiffness: 200, damping: 20 });
  // Smooth motion values for the cat
  const catX = useSpring(useMotionValue(catPos.x), { stiffness: 100, damping: 18 });
  const catY = useSpring(useMotionValue(catPos.y), { stiffness: 100, damping: 18 });

  // Track window height for treat fall
  const [windowHeight, setWindowHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 1000
  );
  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track window width for basket layout
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Playground size (should match the container in page.tsx)
  const PLAYGROUND_WIDTH = 1000;
  const PLAYGROUND_HEIGHT = 1000;

  // Basket config
  const BASKET_HEIGHT = 120;
  const BASKET_WIDTH = 120;
  const BASKET_COUNT = 4;
  const BASKET_X = 0; // fixed x position
  const MIN_SPEED = 2;
  const MAX_SPEED = 15;
  const BASKET_BOUNCE = 0.9; // bounce elasticity

  // State for basket positions and velocities
  const [basketPositions, setBasketPositions] = useState<{ y: number; vy: number }[]>([]);
  const [basketReactions, setBasketReactions] = useState<number[]>([]);
  const [basketHits, setBasketHits] = useState<number[]>(() => Array(BASKET_COUNT).fill(0));
  const [basketSpeed, setBasketSpeed] = useState(5); // Default speed

  // Initialize basket positions after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialPositions = Array.from({ length: BASKET_COUNT }).map((_, i) => ({
        y: PLAYGROUND_HEIGHT - BASKET_HEIGHT - (i * (BASKET_HEIGHT + 20)), // Space baskets vertically
        vy: (Math.random() - 0.5) * basketSpeed * 3 // Random initial velocity
      }));
      setBasketPositions(initialPositions);
    }
  }, [basketSpeed]); // Remove windowWidth dependency since we're not using it anymore

  // Animation frame for basket movement
  useEffect(() => {
    if (basketPositions.length === 0) return;

    let animationFrameId: number;
    const animate = () => {
      setBasketPositions(prev => prev.map((pos, i) => {
        let newY = pos.y + pos.vy;
        let newVy = pos.vy;

        // Bounce off top and bottom of playground
        if (newY < 0) {
          newY = 0;
          newVy = Math.abs(pos.vy) * BASKET_BOUNCE * (0.9 + Math.random() * 0.2);
        } else if (newY > PLAYGROUND_HEIGHT - BASKET_HEIGHT) {
          newY = PLAYGROUND_HEIGHT - BASKET_HEIGHT;
          newVy = -Math.abs(pos.vy) * BASKET_BOUNCE * (0.9 + Math.random() * 0.2);
        }

        return { y: newY, vy: newVy };
      }));

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [basketPositions.length]);

  // Clamp a position within the playground
  function clampToPlayground(x: number, y: number) {
    const margin = CAT_SIZE / 2;
    return {
      x: Math.max(margin, Math.min(PLAYGROUND_WIDTH - margin, x)),
      y: Math.max(margin, Math.min(PLAYGROUND_HEIGHT - margin, y)),
    };
  }

  // --- Grass Sway State ---
  const [grassSway, setGrassSway] = useState(0);

  // Handle mouse move for grass sway
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = playgroundRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const sway = ((x / PLAYGROUND_WIDTH) - 0.5) * 2; // -1 (left) to 1 (right)
      setGrassSway(sway);
      setMousePos({ x, y: e.clientY - rect.top });
    }
  };

  // --- Clouds: All move together, always visible ---
  const cloudCount = 5;
  const cloudSpacing = 0.18; // as percent of width
  const cloudWidth = 180;
  const cloudOpacity = 0.7;
  const cloudDuration = 60; // seconds for a full loop
  const [cloudAnimOffset, setCloudAnimOffset] = useState(0);

  // Animate clouds in sync
  useEffect(() => {
    let frame: number;
    const animate = () => {
      setCloudAnimOffset((prev) => (prev + 1 / (cloudDuration * 60)) % 1);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // --- Matter.js Physics Engine ---
  const engineRef = useRef<Engine | null>(null);
  const [foodBodies, setFoodBodies] = useState<Matter.Body[]>([]);
  const [foodStates, setFoodStates] = useState<{ id: number; x: number; y: number; angle: number; emoji: string }[]>([]);
  const worldRef = useRef<World | null>(null);
  const groundRef = useRef<Matter.Body | null>(null);
  const [physicsReady, setPhysicsReady] = useState(false);

  // Initialize Matter.js engine and world
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const engine = Engine.create();
    engine.gravity.y = 1.1;
    engineRef.current = engine;
    worldRef.current = engine.world;
    // Add ground
    const ground = Bodies.rectangle(
      window.innerWidth / 2,
      window.innerHeight - GROUND_HEIGHT / 2,
      window.innerWidth,
      GROUND_HEIGHT,
      { isStatic: true, restitution: 0.2, friction: 0.8 }
    );
    World.add(engine.world, ground);
    groundRef.current = ground;
    setPhysicsReady(true);
    return () => {
      Engine.clear(engine);
      Composite.clear(engine.world, false);
    };
  }, []);

  // Animation loop to sync food positions
  useEffect(() => {
    if (!physicsReady) return;
    let frame: number;
    const update = () => {
      Engine.update(engineRef.current!, 1000 / 60);
      setFoodStates(
        foodBodies.map((body, i) => ({
          id: (body as any).customId,
          x: body.position.x,
          y: body.position.y,
          angle: body.angle,
          emoji: (body as any).emoji,
        }))
      );
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [physicsReady, foodBodies]);

  // Handle treat click: add a new food body
  const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!physicsReady || !engineRef.current || !worldRef.current) return;
    const emoji = TREATS[Math.floor(Math.random() * TREATS.length)];
    const id = treatIdRef.current++;
    const x = e.clientX;
    const y = e.clientY;
    const body = Bodies.rectangle(
      x,
      y,
      FOOD_SIZE,
      FOOD_SIZE,
      {
        restitution: FOOD_BOUNCE,
        friction: FOOD_FRICTION,
        density: FOOD_DENSITY,
        angle: (Math.random() - 0.5) * 0.3,
      }
    );
    (body as any).customId = id;
    (body as any).emoji = emoji;
    World.add(worldRef.current, body);
    setFoodBodies((prev) => [...prev, body]);
    setCatChasingTreat(true);
    setActiveTreatId(id);
  };

  // Cat chases the most recent treat if any, else the mouse
  const activeTreat = treats.find(t => t.id === activeTreatId);
  let catTarget;
  if (catChasingTreat && activeTreat && playgroundRef.current) {
    const rect = playgroundRef.current.getBoundingClientRect();
    const x = activeTreat.x - rect.left;
    const y = activeTreat.y - rect.top;
    catTarget = clampToPlayground(x, y);
  } else {
    const target = getCatTarget(mousePos, catPos, CAT_DISTANCE);
    catTarget = clampToPlayground(target.x, target.y);
  }

  // Update the motion values when positions change
  mouseX.set(mousePos.x);
  mouseY.set(mousePos.y);
  catX.set(catTarget.x);
  catY.set(catTarget.y);
  // Also update the state for the next frame
  if (catPos.x !== catTarget.x || catPos.y !== catTarget.y) {
    setTimeout(() => setCatPos(catTarget), 16);
  }

  // Generate fixed positions, sizes, and delays for flowers only on the client
  const [flowerConfigs, setFlowerConfigs] = useState<{ left: number; size: number; emoji: string; delay: number }[]>([]);
  useEffect(() => {
    setFlowerConfigs(
      Array.from({ length: FLOWER_COUNT }).map((_, i) => {
        const left = 4 + (92 - 4) * (i / (FLOWER_COUNT - 1)); // Evenly spaced
        const size = Math.random() * 1.2 + 1; // 1x to 2.2x
        const emoji = FLOWERS[i % FLOWERS.length];
        const delay = Math.random() * 2;
        return { left, size, emoji, delay };
      })
    );
  }, []);

  // Render flowers with fixed configs
  const flowers = flowerConfigs.map((cfg, i) => (
    <motion.span
      key={i}
      className="absolute bottom-4 select-none pointer-events-none"
      style={{ left: `${cfg.left}%`, fontSize: `${cfg.size}rem` }}
      animate={{ x: [0, 10, -10, 0] }}
      transition={{
        duration: 5,
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'easeInOut',
        delay: cfg.delay,
      }}
    >
      {cfg.emoji}
    </motion.span>
  ));

  // Render food states from physics
  const foodElements = foodStates.map((food) =>
    typeof window !== 'undefined' && typeof document !== 'undefined'
      ? ReactDOM.createPortal(
          <motion.div
            key={food.id}
            className="fixed z-50 text-5xl pointer-events-none select-none"
            style={{
              left: food.x,
              top: food.y,
              width: FOOD_SIZE,
              height: FOOD_SIZE,
              transform: `translate(-50%, -50%) rotate(${food.angle}rad)`
            }}
            animate={{}}
          >
            {food.emoji}
          </motion.div>,
          document.body
        )
      : null
  );

  // New state for grass click animation
  const [grassClicked, setGrassClicked] = useState(false);

  // Handle grass click
  const handleGrassClick = () => {
    setGrassClicked(true);
    setTimeout(() => setGrassClicked(false), 500); // Reset after 500ms
  };

  // New state for day/night mode
  const [isNightMode, setIsNightMode] = useState(false);

  // Toggle day/night mode
  const toggleDayNightMode = () => {
    setIsNightMode(!isNightMode);
  };

  // --- Shooting Star State ---
  const [shootingStarKey, setShootingStarKey] = useState(0);
  const [shootingStarY, setShootingStarY] = useState(0);
  const [showShootingStar, setShowShootingStar] = useState(false);

  useEffect(() => {
    if (!isNightMode) return;
    let timeout: NodeJS.Timeout;
    let interval: NodeJS.Timeout;
    const launchShootingStar = () => {
      setShootingStarY(Math.random() * 40 + 10); // 10% to 50% from top
      setShootingStarKey(prev => prev + 1); // force re-mount for animation
      setShowShootingStar(true);
      timeout = setTimeout(() => setShowShootingStar(false), 1200); // shooting star visible for 1.2s
    };
    launchShootingStar();
    interval = setInterval(launchShootingStar, 5000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [isNightMode]);

  // --- Night sky stars: generate fixed positions on mount ---
  const [starConfigs, setStarConfigs] = useState<{ top: number; left: number }[]>([]);
  useEffect(() => {
    if (starConfigs.length === 0) {
      setStarConfigs(
        Array.from({ length: 50 }).map(() => ({
          top: Math.random() * 100,
          left: Math.random() * 100,
        }))
      );
    }
  }, [starConfigs.length]);

  // --- Cat rotation to face cursor, head points at cursor, feet down ---
  const [catAngle, setCatAngle] = useState(0);
  const catAngleRef = useRef(0);
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!playgroundRef.current) return;
      const rect = playgroundRef.current.getBoundingClientRect();
      const catRectX = catPos.x;
      const catRectY = catPos.y;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      // Angle from cat to mouse
      const angleRad = Math.atan2(mouseY - catRectY, mouseX - catRectX);
      const angleDeg = angleRad * (180 / Math.PI);
      // Add 180 so the face points at the cursor (assuming cat.gif faces up by default)
      const correctedAngle = angleDeg + 180;
      catAngleRef.current = correctedAngle;
      setCatAngle(correctedAngle);
    };
    window.addEventListener('mousemove', handleWindowMouseMove);
    return () => window.removeEventListener('mousemove', handleWindowMouseMove);
  }, [catPos.x, catPos.y]);

  return (
    <div
      ref={playgroundRef}
      className="relative w-full h-full cursor-pointer bg-gradient-to-t from-green-400 to-blue-200 overflow-hidden"
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      {/* Sky background (blue gradient) */}
      <div className={`absolute top-0 left-0 w-full h-full z-0 ${isNightMode ? 'bg-gradient-to-b from-gray-900 to-gray-700' : 'bg-gradient-to-b from-sky-300 via-sky-200 to-blue-100'}`} />

      {/* Synchronized Clouds using cloud.png (only in day mode) */}
      {!isNightMode && Array.from({ length: cloudCount }).map((_, i) => {
        const percent = ((cloudAnimOffset + i * cloudSpacing) % 1);
        return (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              top: `${8 + i * 10}%`,
              left: 0,
              width: cloudWidth,
              opacity: cloudOpacity,
              zIndex: 1,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
            animate={{ x: `calc(${percent * 100}vw - 100px)` }}
            transition={{ type: 'tween', ease: 'linear', duration: 0 }}
          >
            <Image
              src="/cloud.png"
              alt="Cloud"
              width={cloudWidth}
              height={cloudWidth * 0.6}
              draggable={false}
              priority={i === 0}
              style={{ width: '100%', height: 'auto', pointerEvents: 'none', userSelect: 'none' }}
            />
          </motion.div>
        );
      })}

      {/* Stars (only in night mode, still, no flicker) */}
      {isNightMode && starConfigs.map((cfg, i) => (
        <div
          key={i}
          className="absolute z-1"
          style={{
            top: `${cfg.top}%`,
            left: `${cfg.left}%`,
            width: 2,
            height: 2,
            backgroundColor: 'white',
            borderRadius: '50%',
          }}
        />
      ))}

      {/* Shooting star (star.gif) in night mode */}
      {isNightMode && showShootingStar && (
        <motion.img
          key={shootingStarKey}
          src="/star.gif"
          alt="Shooting Star"
          className="absolute z-10 pointer-events-none select-none"
          style={{
            top: `${shootingStarY}%`,
            left: '-10%',
            width: 80,
            height: 40,
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 8px #fff) drop-shadow(0 0 16px #fff)'
          }}
          initial={{ x: 0, opacity: 1 }}
          animate={{ x: '120vw', opacity: [1, 1, 0] }}
          transition={{ duration: 2.5, ease: 'easeIn' }}
        />
      )}

      {/* Grass base with swaying effect */}
      <motion.div
        className="absolute bottom-0 left-0 w-full h-40 z-0 rounded-b-2xl"
        animate={{ skewX: grassSway * 10 }}
        transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        style={{ background: 'linear-gradient(to top, #16a34a, #86efac 80%)' }}
      />

      {/* New grass.gif layer above the grass block */}
      <div className="absolute bottom-40 left-0 w-full h-5 z-10 pointer-events-none select-none flex">
        {Array.from({ length: 10 }).map((_, i) => (
          <img
            key={i}
            src="/grass.gif"
            alt="Grass"
            style={{ width: '12%', height: '100%', objectFit: 'cover', pointerEvents: 'none', userSelect: 'none', marginRight: '-2%' }}
            draggable={false}
          />
        ))}
      </div>

      {/* Flowers */}
      <div className="absolute bottom-0 left-0 w-full h-40 z-0">
        {flowers}
      </div>

      {/* Cat (follows mouse, keeps distance, or dashes to treat, and rotates to face cursor) */}
      <div
        className="absolute z-10"
        style={{
          left: `calc(${catX.get()}px)`,
          top: `calc(${catY.get()}px)`,
          width: CAT_SIZE,
          height: CAT_SIZE,
          transform: `translate(-50%, -50%) rotate(${catAngle}deg)`,
          transformOrigin: 'center center',
          transition: 'transform 0.1s linear',
        }}
      >
        <Image
          src="/cat.gif"
          alt="Cat"
          fill
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>

      {/* Mouse (follows cursor) */}
      <motion.div
        className="absolute z-20 pointer-events-none"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: '-50%',
          translateY: '-50%',
          width: MOUSE_SIZE,
          height: MOUSE_SIZE,
        }}
      >
        <Image
          src="/mouse.png"
          alt="Mouse"
          fill
          style={{ objectFit: 'contain' }}
          priority
        />
      </motion.div>

      {/* Treats (physics-based pile) */}
      {foodElements}

      {/* Toggle button for day/night mode */}
      <button
        className="absolute top-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded"
        onClick={toggleDayNightMode}
      >
        {isNightMode ? 'Switch to Day' : 'Switch to Night'}
      </button>
    </div>
  );
};

export default CatAndMouse; 