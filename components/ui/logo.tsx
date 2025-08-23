// components/ui/logo.tsx
import Image from "next/image";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className = "", width = 600, height = 150 }: LogoProps) {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className="relative">
        <Image
          src="/GameTrackerBanner.png"
          alt="GameTracker"
          width={width}
          height={height}
          priority
          className="object-contain"
        />
      </div>
    </div>
  );
}