import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="w-full h-16 flex items-center justify-between px-4 border-b">
      <div className="flex items-center">
        <Link to="/">Logo Placeholder</Link>
      </div>
      <nav className="flex gap-4">
        <Link to="/">Home</Link>
        <Link to="/admin">Admin</Link>
        <div>Cart Placeholder</div>
      </nav>
      <div className="hidden">MobileNav Placeholder</div>
    </header>
  );
};

export default Header;
