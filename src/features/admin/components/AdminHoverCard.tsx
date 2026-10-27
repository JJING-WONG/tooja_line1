import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

export default function AdminHoverCard({ id, labelledBy, className, anchor, children, onClose, onEnter, onLeave }: {
  id: string;
  labelledBy: string;
  className: string;
  anchor: HTMLElement;
  children: ReactNode;
  onClose: () => void;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const card = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = card.current;
    if (!element) return;
    const position = () => {
      if (!anchor.isConnected) { onClose(); return; }
      const rect = anchor.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) { onClose(); return; }
      const margin = 12;
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      const right = rect.right + margin;
      const left = right + width <= window.innerWidth - margin ? right
        : rect.left - width - margin >= margin ? rect.left - width - margin
        : Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin));
      element.style.left = `${left}px`;
      element.style.top = `${Math.max(margin, Math.min(rect.top - 24, window.innerHeight - height - margin))}px`;
      element.style.visibility = "visible";
    };
    const dismiss = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (element.contains(document.activeElement)) anchor.focus({ preventScroll: true });
      onClose();
    };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !element.contains(event.target) && !anchor.contains(event.target)) onClose();
    };
    position();
    const observer = new ResizeObserver(position);
    observer.observe(element);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    document.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", outside);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      document.removeEventListener("keydown", dismiss);
      document.removeEventListener("pointerdown", outside);
    };
  }, [anchor, children, onClose]);

  useEffect(() => {
    const element = card.current;
    if (!element || !window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
    const animation = element.animate(
      [{ opacity: 0, transform: "translateY(4px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 120, easing: "ease-out" },
    );
    return () => animation.cancel();
  }, []);

  return createPortal(
    <div ref={card} id={id} className={`fixed z-50 invisible max-w-[calc(100vw-24px)] max-h-[calc(100dvh-24px)] overflow-auto overscroll-contain rounded-2xl border border-[#dddded] bg-white text-[13px] leading-normal text-[#333] font-[Anta,Noto_Sans_KR,sans-serif] shadow-[0_16px_48px_#20233824,0_3px_10px_#2023380d] focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-3 [&_footer]:border-t [&_footer]:border-[#efeff4] [&_footer]:bg-[#fafafb] [&_footer]:px-5.5 [&_footer]:py-3.25 [&_footer]:text-[11px] [&_footer]:leading-[1.7] [&_footer]:text-[#777] ${className}`} role="dialog" aria-modal="false" aria-labelledby={labelledBy} tabIndex={0}
      onPointerEnter={onEnter} onPointerLeave={onLeave} onFocus={onEnter}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) onLeave(); }}>
      {children}
    </div>, document.body,
  );
}
