'use client';

import { useEffect } from 'react';

/**
 * useScrollAnimation
 * Watches all elements with [data-scroll] and adds the class
 * "in-view" when they enter the viewport.
 * Supports staggered children via [data-scroll-stagger] on a parent.
 */
export function useScrollAnimation() {
  useEffect(() => {
    const elements = document.querySelectorAll('[data-scroll]');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target); // animate once
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}
