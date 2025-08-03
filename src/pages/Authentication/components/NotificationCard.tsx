import { Link } from "react-router-dom";

interface NotificationCardProps {
  header: string;
  text: string;
  src: string;
  bottomText?: string;
  className?: string;
  link?: string;
}

const NotificationCard = (props: NotificationCardProps) => {
  return (
    <div className={`flex rounded-lg flex-col justify-center h-full ${props.className || ''}`}>
      <div className="authForm p-10 rounded-lg shadow-lg mx-auto bg-white/20 text-white">
        <div className="mx-auto">
          <div className="flex justify-center mb-8">
            <img src={props.src} alt="" />
          </div>
          <div className="">
            <div className="text-center text-[19px] font-medium mb-2">
              {props.header}
            </div>
            <div className="text-center text-gray text-sma mb-8">
              {props.text}
            </div>
            {props.bottomText && (
              <div className="text-center text-gray text-sma">
                <Link to={props.link || '#'}>{props.bottomText}</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;