import "./navbar.scss"
import { HiMenu } from "react-icons/hi";


function Navbar() {
    return (
        <nav className="navbar">
            <h2 className="navbar__title">lasweety</h2>
            <div className="navbar__icon-menu"><HiMenu /></div>
        </nav>
    )
}

export default Navbar;