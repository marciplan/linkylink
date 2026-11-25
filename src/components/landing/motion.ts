// Animation classes for children of <InView>. Plain strings, usable from server components.

/** Fade-and-rise for a child of InView; pass a delay in ms. */
export const rise =
  "opacity-0 translate-y-5 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-data-[inview=true]/inview:opacity-100 group-data-[inview=true]/inview:translate-y-0 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none"

/** Pop-in for small things (bubbles, icons). */
export const pop =
  "opacity-0 scale-75 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-data-[inview=true]/inview:opacity-100 group-data-[inview=true]/inview:scale-100 motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:transition-none"

export const delay = (ms: number) => ({ transitionDelay: `${ms}ms` })
