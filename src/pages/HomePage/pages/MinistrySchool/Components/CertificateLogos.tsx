import ChurchLogo from "@/components/ChurchLogo";
import hillcityLogo from "@/assets/certificate/hillcity logo black .png";

interface CertificateLogosProps {
  compact?: boolean;
}

export default function CertificateLogos({
  compact = false,
}: CertificateLogosProps) {
  const churchLogoClassName = compact
    ? "[&_img]:h-10 [&_img]:w-auto gap-2"
    : "[&_img]:h-14 [&_img]:w-auto gap-2.5";
  const hillcityLogoClassName = compact ? "h-10 w-10" : "h-14 w-14";
  const separatorClassName = compact ? "text-sm" : "text-lg";

  return (
    <div className="flex items-center justify-center gap-4 text-primary">
      <div className={churchLogoClassName}>
        <ChurchLogo show />
      </div>
      <span className={`font-light text-primary/40 ${separatorClassName}`}>|</span>
      <img
        src={hillcityLogo}
        alt="Hillcity logo"
        className={hillcityLogoClassName}
      />
    </div>
  );
}
