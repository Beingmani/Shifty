import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import {
  Children,
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/**
 * Magic UI / macOS dock pattern:
 *
 * - Glass panel: fixed height, 12px vertical padding, uniform rest icons.
 * - Icons grow in layout width (neighbors push apart, no overlap).
 * - Stage height is reserved up front (no hover reflow) so Schedule
 *   and sections below never jump when icons magnify.
 */

export const DOCK_BASE_SIZE = 48;
export const DOCK_MAGNIFICATION = 80;
export const DOCK_DISTANCE = 140;
/** Vertical padding inside the glass shelf (top + bottom). */
export const DOCK_PADDING_Y = 12;
/** panel = icon + top pad + bottom pad — keeps all rest icons the same size. */
export const DOCK_PANEL_HEIGHT = DOCK_BASE_SIZE + DOCK_PADDING_Y * 2; // 72
/** Space above the panel for name labels while magnified. */
export const DOCK_LABEL_HEADROOM = 36;
export const DOCK_GAP = 10;
export const DOCK_SPRING = { mass: 0.1, stiffness: 150, damping: 12 };

const DockContext = createContext(null);

function cn(...parts) {
  return parts.filter(Boolean).join(' ');
}

function useDock() {
  const context = useContext(DockContext);
  if (!context) throw new Error('useDock must be used within Dock');
  return context;
}

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function Dock({
  children,
  className,
  baseSize = DOCK_BASE_SIZE,
  magnification = DOCK_MAGNIFICATION,
  distance = DOCK_DISTANCE,
  panelHeight = DOCK_PANEL_HEIGHT,
  spring = DOCK_SPRING,
}) {
  const mouseX = useMotionValue(Infinity);
  const reduced = prefersReducedMotion();

  // Fixed stage height: always enough for peak magnify + label.
  // Never animates — avoids pushing Schedule / sections below on hover.
  const stageHeight = useMemo(() => {
    const rise = Math.max(0, magnification - baseSize);
    return panelHeight + rise + DOCK_LABEL_HEADROOM;
  }, [baseSize, magnification, panelHeight]);

  return (
    <div
      className="dock-stage-wrap"
      style={{
        '--dock-base-size': `${baseSize}px`,
        '--dock-magnify-size': `${magnification}px`,
        '--dock-panel-height': `${panelHeight}px`,
        '--dock-padding-y': `${DOCK_PADDING_Y}px`,
        '--dock-gap': `${DOCK_GAP}px`,
        '--dock-stage-height': `${stageHeight}px`,
      }}
    >
      <div className="dock-stage" style={{ height: stageHeight }}>
        {/*
          Glass panel: FIXED height, pinned to bottom of the reserved stage.
          Magnify grows upward into pre-allocated space — no layout shift.
        */}
        <div
          className={cn('dock-panel', className)}
          style={{ height: panelHeight }}
          onMouseMove={({ clientX }) => mouseX.set(clientX)}
          onMouseLeave={() => mouseX.set(Infinity)}
          role="toolbar"
          aria-label="Profile apps dock"
        >
          <DockContext.Provider
            value={{ mouseX, spring, distance, magnification, baseSize, reduced }}
          >
            {children}
          </DockContext.Provider>
        </div>
      </div>
    </div>
  );
}

export function DockItem({
  children,
  className,
  onClick,
  onContextMenu,
  title,
}) {
  const ref = useRef(null);
  const { distance, magnification, mouseX, spring, baseSize, reduced } = useDock();
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val) => {
    const domRect = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - domRect.x - domRect.width / 2;
  });

  const widthTransform = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseSize, magnification, baseSize]
  );

  const width = useSpring(
    widthTransform,
    reduced ? { stiffness: 500, damping: 40 } : spring
  );

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      onContextMenu={onContextMenu}
      title={title}
      className={cn('dock-item', className)}
      tabIndex={onClick ? 0 : -1}
      role={onClick ? 'button' : 'presentation'}
    >
      {Children.map(children, (child) => {
        if (!child || typeof child !== 'object') return child;
        return cloneElement(child, { width, isHovered });
      })}
    </motion.div>
  );
}

export function DockLabel({ children, className, ...rest }) {
  const isHovered = rest.isHovered;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isHovered?.on) return undefined;
    return isHovered.on('change', (latest) => setIsVisible(latest === 1));
  }, [isHovered]);

  if (!isHovered) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10, x: '-50%' }}
          exit={{ opacity: 0, y: 0, x: '-50%' }}
          transition={{ duration: 0.2 }}
          className={cn('dock-label', className)}
          role="tooltip"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DockIcon({ children, className, ...rest }) {
  const width = rest.width;

  if (width) {
    return (
      <motion.div
        style={{ width, height: width }}
        className={cn('dock-icon', className)}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={cn('dock-icon', className)}>{children}</div>;
}

export function DockDivider() {
  return <div className="dock-divider" aria-hidden="true" />;
}
