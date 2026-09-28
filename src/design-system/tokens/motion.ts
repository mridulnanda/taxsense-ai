/**
 * TaxSense AI - Motion & Animation Design Tokens
 * Easing curves, durations, and animation definitions
 */

export const motion = {
  // Animation durations
  duration: {
    instant: '0ms',
    fast: '100ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '700ms',
  },

  // Easing curves (following Material Design + CSS standard curves)
  easing: {
    // Standard easing
    linear: 'linear',
    ease: 'ease',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

    // Material Design emphasis
    emphasis: 'cubic-bezier(0.2, 0.85, 0.32, 1.275)',
    sharp: 'cubic-bezier(0.4, 0, 1, 1)',
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    decelerated: 'cubic-bezier(0, 0, 0.2, 1)',
    accelerated: 'cubic-bezier(0.4, 0, 1, 1)',

    // Spring-like easing
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',

    // Custom curves for specific use cases
    subtle: 'cubic-bezier(0.4, 0, 0.6, 1)',
    emphasizedAccelerate: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
    emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  },

  // Transition shorthands
  transition: {
    fast: 'all 100ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slower: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',

    // Specific transitions
    colors: 'color 200ms cubic-bezier(0.4, 0, 0.2, 1), background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: 'background-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    borderColor: 'border-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    shadow: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Keyframe animations
export const keyframes = {
  // Fade animations
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },

  // Slide animations
  slideInUp: {
    from: { transform: 'translateY(20px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },
  slideInDown: {
    from: { transform: 'translateY(-20px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },
  slideInLeft: {
    from: { transform: 'translateX(-20px)', opacity: 0 },
    to: { transform: 'translateX(0)', opacity: 1 },
  },
  slideInRight: {
    from: { transform: 'translateX(20px)', opacity: 0 },
    to: { transform: 'translateX(0)', opacity: 1 },
  },

  slideOutUp: {
    from: { transform: 'translateY(0)', opacity: 1 },
    to: { transform: 'translateY(-20px)', opacity: 0 },
  },
  slideOutDown: {
    from: { transform: 'translateY(0)', opacity: 1 },
    to: { transform: 'translateY(20px)', opacity: 0 },
  },
  slideOutLeft: {
    from: { transform: 'translateX(0)', opacity: 1 },
    to: { transform: 'translateX(-20px)', opacity: 0 },
  },
  slideOutRight: {
    from: { transform: 'translateX(0)', opacity: 1 },
    to: { transform: 'translateX(20px)', opacity: 0 },
  },

  // Scale animations
  scaleIn: {
    from: { transform: 'scale(0.95)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
  },
  scaleOut: {
    from: { transform: 'scale(1)', opacity: 1 },
    to: { transform: 'scale(0.95)', opacity: 0 },
  },

  // Rotate animations
  rotateIn: {
    from: { transform: 'rotate(-180deg)', opacity: 0 },
    to: { transform: 'rotate(0deg)', opacity: 1 },
  },
  rotateOut: {
    from: { transform: 'rotate(0deg)', opacity: 1 },
    to: { transform: 'rotate(-180deg)', opacity: 0 },
  },

  // Spin animation
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },

  // Pulse animation
  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },

  // Bounce animations
  bounce: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-25%)' },
  },

  // Shimmer/skeleton loading
  shimmer: {
    '0%': { backgroundPosition: '-1000px 0' },
    '100%': { backgroundPosition: '1000px 0' },
  },

  // Ping animation (for alerts/notifications)
  ping: {
    '75%, 100%': { transform: 'scale(2)', opacity: 0 },
  },

  // Wiggle animation (for error states)
  wiggle: {
    '0%, 100%': { transform: 'translateX(0)' },
    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
    '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
  },
};

// Animation presets
export const animations = {
  fadeIn: {
    animation: `fadeIn 300ms ${motion.easing.easeOut} forwards`,
  },
  fadeOut: {
    animation: `fadeOut 300ms ${motion.easing.easeOut} forwards`,
  },
  slideInUp: {
    animation: `slideInUp 300ms ${motion.easing.easeOut} forwards`,
  },
  slideInDown: {
    animation: `slideInDown 300ms ${motion.easing.easeOut} forwards`,
  },
  slideInLeft: {
    animation: `slideInLeft 300ms ${motion.easing.easeOut} forwards`,
  },
  slideInRight: {
    animation: `slideInRight 300ms ${motion.easing.easeOut} forwards`,
  },
  scaleIn: {
    animation: `scaleIn 200ms ${motion.easing.spring} forwards`,
  },
  spin: {
    animation: `spin 1s ${motion.easing.linear} infinite`,
  },
  pulse: {
    animation: `pulse 2s ${motion.easing.easeInOut} infinite`,
  },
  bounce: {
    animation: `bounce 1s ${motion.easing.easeInOut} infinite`,
  },
  shimmer: {
    animation: `shimmer 2s infinite`,
    backgroundSize: '1000px 100%',
  },
};

export type MotionDuration = keyof typeof motion.duration;
export type MotionEasing = keyof typeof motion.easing;
export type AnimationName = keyof typeof animations;
