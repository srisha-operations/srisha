import { Link } from "react-router-dom";
import footerData from "@/data/footer.json";

const Footer = () => {
  return (
    <footer className="w-full bg-background border-t border-border">
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Quick Links */}
          <div>
            <h3 className="font-tenor text-lg mb-6 text-foreground">Quick Links</h3>
            <ul className="space-y-3">
              {footerData.quickLinks.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.url}
                    className="font-lato text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h3 className="font-tenor text-lg mb-6 text-foreground">Contact Us</h3>
            <div className="space-y-3 font-lato text-sm text-muted-foreground">
              <p>{footerData.contact.address}</p>
              <p>{footerData.contact.number}</p>
              <p>{footerData.contact.email}</p>
            </div>
          </div>

          {/* Socials */}
          <div>
            <h3 className="font-tenor text-lg mb-6 text-foreground">Socials</h3>
            <ul className="space-y-3">
              {footerData.socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-lato text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-border py-6">
        <p className="text-center font-lato text-sm text-muted-foreground">
          {footerData.copyright}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
