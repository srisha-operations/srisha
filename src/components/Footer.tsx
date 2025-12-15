import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Instagram, Youtube, Facebook, MapPin, Mail } from "lucide-react";

const socialIcons: Record<string, JSX.Element> = {
  instagram: <Instagram className="w-4 h-4" />,
  youtube: <Youtube className="w-4 h-4" />,
  facebook: <Facebook className="w-4 h-4" />,
};

const otherIcons: Record<string, JSX.Element> = {
  mappin: <MapPin className="w-4 h-4" />,
  mail: <Mail className="w-4 h-4" />,
};

const Footer = () => {
  const [footer, setFooter] = useState<any>(null);

  useEffect(() => {
    const loadFooter = async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "footer")
        .single();

      if (!error && data?.value) {
        setFooter(data.value);
      } else {
        // Fallback to static file
        const fallback = await import("@/data/footer.json");
        setFooter(fallback.default);
      }
    };

    loadFooter();
  }, []);

  if (!footer) return null;

  return (
    <footer
      id="footer-contact"
      className="w-full bg-background border-t border-border"
    >
      <div className="container mx-auto px-4 py-16 md:py-20 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 items-stretch justify-center">
          {/* Quick Links */}
          <div className="h-full w-full text-center md:text-left flex flex-col justify-start">
            <h3 className="font-tenor text-lg mb-6 text-foreground">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {footer?.quickLinks.map((link) => (
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
          <div className="h-full w-full text-center md:text-left flex flex-col justify-start">
            <h3 className="font-tenor text-lg mb-6 text-foreground">
              Contact Us
            </h3>
            <div className="space-y-3 font-lato text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                {otherIcons["mappin"]}
                <span>{footer?.contact.address}</span>
              </p>
              <p className="flex items-center gap-2">
                <span>{footer?.contact.number}</span>
              </p>
              <p className="flex items-center gap-2">
                {otherIcons["mail"]}
                <span>{footer?.contact.email}</span>
              </p>
            </div>
          </div>

          {/* Socials */}
          <div className="h-full w-full text-center md:text-left flex flex-col justify-start">
            <h3 className="font-tenor text-lg mb-6 text-foreground">Socials</h3>
            <ul className="space-y-3">
              {footer?.socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-lato text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {socialIcons[social.type] || null}
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
          {footer?.copyright}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
