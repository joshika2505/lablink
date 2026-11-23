import React, { useRef } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react';

export const SPRING_TACTILE = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 26,
  mass: 0.8,
};

export const SPRING_GENTLE = {
  type: 'spring' as const,
  stiffness: 220,
  damping: 24,
};

interface ClayTiltCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  tiltMax?: number;
  enableHoverLift?: boolean;
}

export const ClayTiltCard: React.FC<ClayTiltCardProps> = ({
  children,
  className = '',
  onClick,
  tiltMax = 6,
  enableHoverLift = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const sheenX = useMotionValue(50);
  const sheenY = useMotionValue(50);
  const sheenOpacity = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 260, damping: 24 });
  const smoothY = useSpring(mouseY, { stiffness: 260, damping: 24 });

  const rotateY = useTransform(smoothX, [0, 1], [-tiltMax, tiltMax]);
  const rotateX = useTransform(smoothY, [0, 1], [tiltMax, -tiltMax]);
  const glossBg = useMotionTemplate`radial-gradient(circle 180px at ${sheenX}% ${sheenY}%, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0) 75%)`;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    mouseX.set(nx);
    mouseY.set(ny);
    sheenX.set(nx * 100);
    sheenY.set(ny * 100);
    sheenOpacity.set(1);
  };

  const handlePointerLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
    sheenOpacity.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      whileHover={enableHoverLift ? { y: -5, transition: SPRING_TACTILE } : undefined}
      className={`relative transition-shadow duration-300 ${className}`}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] z-10"
        style={{ background: glossBg, opacity: sheenOpacity }}
      />
      {children}
    </motion.div>
  );
};

interface TactileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'soft' | 'danger' | 'ghost';
  loading?: boolean;
  success?: boolean;
  successLabel?: string;
}

export const TactileButton: React.FC<TactileButtonProps> = ({
  children,
  variant = 'primary',
  loading = false,
  success = false,
  successLabel = 'Done!',
  className = '',
  disabled,
  ...props
}) => {
  const variantClasses: Record<NonNullable<TactileButtonProps['variant']>, string> = {
    primary:
      'bg-[#a8e8d5] text-[#2b6a5b] clay-button hover:brightness-[0.97]',
    secondary:
      'bg-[#b0e4fd] text-[#32677c] clay-button-soft hover:brightness-[0.97]',
    soft:
      'bg-[#ffffff] text-[#1d1c15] clay-button-soft hover:bg-[#f8f3e8]',
    danger:
      'bg-[#ffcfd9] text-[#84515e] clay-button-soft hover:brightness-[0.97]',
    ghost:
      'bg-[#f8f3e8] text-[#3f4945] hover:bg-[#ede8dd]',
  };

  const isDisabled = Boolean(disabled || loading);

  return (
    <motion.button
      whileHover={isDisabled ? undefined : { y: -1.5, scale: 1.015 }}
      whileTap={isDisabled ? undefined : { scale: 0.96, y: 1.5 }}
      transition={SPRING_TACTILE}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold cursor-pointer select-none whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#29695a] disabled:opacity-55 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...(props as Record<string, unknown>)}
    >
      {loading ? (
        <>
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
            className="w-4 h-4 rounded-full border-2 border-current border-t-transparent inline-block"
          />
          <span>Working...</span>
        </>
      ) : success ? (
        <>
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{successLabel}</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
};

interface MagneticElementProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

export const MagneticElement: React.FC<MagneticElementProps> = ({
  children,
  className = '',
  strength = 0.18,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    x.set(Math.max(-10, Math.min(10, dx * strength)));
    y.set(Math.max(-8, Math.min(8, dy * strength)));
  };

  const handlePointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
};

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface ClayModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
  ariaLabel?: string;
}

export const ClayModal: React.FC<ClayModalProps> = ({
  open,
  onClose,
  children,
  maxWidthClass = 'max-w-lg',
  ariaLabel = 'Dialog',
}) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1c15]/30 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={SPRING_TACTILE}
            onClick={(e) => e.stopPropagation()}
            className={`w-full ${maxWidthClass} bg-[#ffffff] rounded-[2rem] p-6 md:p-8 clay-card max-h-[90vh] overflow-y-auto`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
