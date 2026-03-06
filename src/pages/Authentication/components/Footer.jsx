import { ThemeModeSelector } from "@/components/ThemeModeSelector";

const Footer = () => {
  return (
    <footer className="px-4 pb-4">
      <div className="flex items-end justify-between gap-3">
        <div className="w-full max-w-[160px]">
          <p className="mb-1 text-xs font-medium text-white/90">Theme</p>
          <ThemeModeSelector className="w-full" />
        </div>
        <a
          href="https://wa.me/qr/6TUNEFPG5RGMD1"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          aria-label="Contact support on WhatsApp"
        >
          <img
            src="/assets/authentication/FooterIcon.svg"
            alt=""
            className="inline-block"
            aria-hidden="true"
          />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
