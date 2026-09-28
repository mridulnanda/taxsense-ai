import { useEffect, useState } from 'react';
import { breakpointPixels, type Breakpoint } from '../tokens/breakpoints';

/**
 * Hook to detect current breakpoint
 */
export const useBreakpoint = (): Breakpoint => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('md');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      if (width < breakpointPixels.sm) {
        setBreakpoint('xs');
      } else if (width < breakpointPixels.md) {
        setBreakpoint('sm');
      } else if (width < breakpointPixels.lg) {
        setBreakpoint('md');
      } else if (width < breakpointPixels.xl) {
        setBreakpoint('lg');
      } else if (width < breakpointPixels['2xl']) {
        setBreakpoint('xl');
      } else if (width < breakpointPixels['3xl']) {
        setBreakpoint('2xl');
      } else if (width < breakpointPixels['4xl']) {
        setBreakpoint('3xl');
      } else {
        setBreakpoint('4xl');
      }
    };

    // Call on mount
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
};

/**
 * Hook to check if we're on a mobile device
 */
export const useIsMobile = (): boolean => {
  const breakpoint = useBreakpoint();
  return breakpoint === 'xs' || breakpoint === 'sm';
};

/**
 * Hook to check if we're on a tablet device
 */
export const useIsTablet = (): boolean => {
  const breakpoint = useBreakpoint();
  return breakpoint === 'md' || breakpoint === 'lg';
};

/**
 * Hook to check if we're on a desktop device
 */
export const useIsDesktop = (): boolean => {
  const breakpoint = useBreakpoint();
  return breakpoint === 'xl' || breakpoint === '2xl' || breakpoint === '3xl' || breakpoint === '4xl';
};

/**
 * Hook to detect if device supports hover
 */
export const useSupportsHover = (): boolean => {
  const [supportsHover, setSupportsHover] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover)');
    setSupportsHover(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setSupportsHover(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return supportsHover;
};

/**
 * Hook to detect if device is touch-capable
 */
export const useIsTouchDevice = (): boolean => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
    setIsTouchDevice(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsTouchDevice(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isTouchDevice;
};

/**
 * Hook to detect prefers reduced motion
 */
export const usePrefersReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

/**
 * Hook to detect color scheme preference
 */
export const usePrefersColorScheme = (): 'light' | 'dark' {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setColorScheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e: MediaQueryListEvent) => {
      setColorScheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return colorScheme;
};

export type ResponsiveValue<T> = {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
  '3xl'?: T;
  '4xl'?: T;
};

/**
 * Hook to get responsive value based on current breakpoint
 */
export const useResponsiveValue = <T,>(values: ResponsiveValue<T>, defaultValue: T): T => {
  const breakpoint = useBreakpoint();
  return values[breakpoint] || defaultValue;
};

export default useBreakpoint;
