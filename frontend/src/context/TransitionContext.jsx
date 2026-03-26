import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const TransitionContext = createContext(null);

export function usePageTransition() {
  return useContext(TransitionContext);
}

const RAINBOW = "linear-gradient(90deg, #ff0000, #ff7700, #ffee00, #00cc44, #0088ff, #8800ff, #ff00cc, #ff0000)";
const EASING  = "cubic-bezier(0.76, 0, 0.24, 1)";
const DURATION = 420; // ms

export function TransitionProvider({ children }) {
  const [phase, setPhase] = useState("idle"); // idle | covering | revealing
  const navigate    = useNavigate();
  const location    = useLocation();
  const pending     = useRef(null);
  const isAnimating = useRef(false);

  const navigateTo = useCallback((path) => {
    if (isAnimating.current || path === location.pathname) return;
    isAnimating.current = true;
    pending.current = path;
    setPhase("covering");
  }, [location.pathname]);

  const onTransitionEnd = useCallback((e) => {
    if (e.propertyName !== "transform") return;
    if (phase === "covering") {
      navigate(pending.current);
      setPhase("revealing");
    } else if (phase === "revealing") {
      setPhase("idle");
      isAnimating.current = false;
    }
  }, [phase, navigate]);

  // Curtain: starts below (idle), slides up (covering), slides back down (revealing)
  const transform = phase === "covering" ? "translateY(0%)" : "translateY(100%)";
  const transition = phase === "idle" ? "none" : `transform ${DURATION}ms ${EASING}`;

  return (
    <TransitionContext.Provider value={{ navigateTo }}>
      {children}
      <div
        aria-hidden="true"
        onTransitionEnd={onTransitionEnd}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9000,
          background: RAINBOW,
          backgroundSize: "300% 100%",
          animation: phase !== "idle" ? "rainbowMove 4s linear infinite" : "none",
          transform,
          transition,
          pointerEvents: phase === "idle" ? "none" : "all",
          willChange: "transform",
        }}
      />
    </TransitionContext.Provider>
  );
}
