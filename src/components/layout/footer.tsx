import Link from "next/link";
import { Linkedin, Book, Twitter } from "lucide-react";
import NiyamLogo from "@/components/niyam-logo";

const footerNav = [
  { name: "Home", href: "/" },
  { name: "Principles", href: "#core-principles" },
  { name: "Modules", href: "#" },
  { name: "Login", href: "/login" },
];

const socialLinks = [
  { icon: Twitter, href: "#" },
  { icon: Linkedin, href: "#" },
  { icon: Book, href: "#" }, // For Medium
];

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <NiyamLogo className="bg-primary-foreground text-primary" />
              <span className="font-headline text-lg font-bold">NiyamAI</span>
            </Link>
            <p className="text-sm text-primary-foreground/70">
              The Neural Alignment Engine for enterprises.
            </p>
          </div>
          <div className="md:col-span-2">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              <div>
                <h3 className="font-headline font-semibold uppercase tracking-wider">
                  Navigation
                </h3>
                <ul className="mt-4 space-y-2">
                  {footerNav.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm text-primary-foreground/70 hover:text-primary-foreground hover:underline"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-headline font-semibold uppercase tracking-wider">
                  Legal
                </h3>
                <ul className="mt-4 space-y-2">
                  <li>
                    <Link
                      href="#"
                      className="text-sm text-primary-foreground/70 hover:text-primary-foreground hover:underline"
                    >
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-sm text-primary-foreground/70 hover:text-primary-foreground hover:underline"
                    >
                      Terms
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="col-span-2 sm:col-span-2">
                 <h3 className="font-headline font-semibold uppercase tracking-wider">
                  Contact
                </h3>
                <p className="mt-4 text-sm text-primary-foreground/70">
                   Get in touch with our team.
                </p>
                 <a href="mailto:info@niyam.ai" className="mt-2 inline-block text-sm text-accent hover:underline">info@niyam.ai</a>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-primary-foreground/10 pt-8 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-sm text-primary-foreground/50">
            &copy; {new Date().getFullYear()} NiyamAI. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            {socialLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="text-primary-foreground/50 hover:text-primary-foreground"
              >
                <link.icon className="h-5 w-5" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
