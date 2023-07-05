const Footer = () => {
  return (
    <>
      <footer className="flex justify-center justify-self-end w-full bottom-0">
        <ul className="justify-self-start ">
          <li className="inline-block">&copy Worldwide Word</li>
          <li className="inline-block">Ministries Privacy</li>
          <li className="inline-block">Policy Platform Agreement</li>
        </ul>
        <div className="inline-block absolute right-0 bottom-0">
          <img
            src="/assets/authentication/FooterIcon.svg"
            alt="footer-icon"
            className="inline-block"
          />
        </div>
      </footer>
    </>
  );
};

export default Footer;
