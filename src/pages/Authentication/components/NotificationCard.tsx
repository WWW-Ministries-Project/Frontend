import { Link } from "react-router-dom";

interface IProps {
  header: string;
  text: string;
  src: string;
  imageAlt?: string;
  bottomText?: string;
  className?: string;
  link?: string;
}

const NotificationCard = (props: IProps) => {
  return (
    <section
      className={`mx-auto w-full max-w-lg ${props.className || ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="overflow-hidden rounded-2xl border border-lightGray bg-white shadow-[0_20px_45px_-30px_rgba(8,13,45,0.6)]">
        <div className="px-6 py-8">
          <div className="mb-6 flex justify-center">
            <img src={props.src} alt={props.imageAlt || ""} />
          </div>
          <h1 className="text-center text-xl font-semibold text-primary">{props.header}</h1>
          <p className="mt-2 text-center text-sm text-gray">{props.text}</p>

          {props.bottomText && (
            <div className="mt-6 text-center">
              <Link
                to={props.link || "#"}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {props.bottomText}
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NotificationCard;
