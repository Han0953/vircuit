import Image from "next/image";

export function CirraAvatar({ size = 32 }: { size?: number }) {
  return <span aria-hidden="true" className="relative inline-block shrink-0 overflow-hidden rounded-full border border-primary/20 bg-primary-soft" style={{ width: size, height: size }}>
    <Image src="/Cirra.webp" alt="" fill sizes={`${size}px`} className="origin-[50%_30%] scale-150 object-cover object-[50%_25%]" />
  </span>;
}
