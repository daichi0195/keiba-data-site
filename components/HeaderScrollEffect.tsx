'use client';

import { useEffect } from 'react';

export default function HeaderScrollEffect() {
  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;

    const onScroll = () => {
      if (window.scrollY > 0) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return null;
}
