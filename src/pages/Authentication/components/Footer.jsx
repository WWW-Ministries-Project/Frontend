const Footer = () => {
  return (
    <>
      <footer className="flex justify-center justify-self-end w-full bottom-0 text-sma text-black">
        {/* <ul className="justify-self-start text-sma ">
          <li className="inline-block">&copy; Worldwide Word</li>
          <li className="inline-block">Ministries Privacy</li>
          <li className="inline-block">Policy Platform Agreement</li>
        </ul> */}
        <div className="inline-block absolute right-0 bottom-0">
          <a href="https://wa.me/qr/6TUNEFPG5RGMD1" target="_blank" rel="noreferrer">
            <img
            src="/assets/authentication/FooterIcon.svg"
            alt="footer-icon"
            className="inline-block"
          />
          </a>         
        </div>
      </footer>
    </>
  );
};

export default Footer;
