import React from "react";
import styles from "./Nav.module.css";
import { Link } from "react-router-dom";
import elevkarenLogo from "../assets/elevkarenLogo.png";
import killergameLogo from "../assets/logo.png";

const Nav = ({location, user}) => {
    var locationObj = location()
    var path = locationObj.pathname.slice(1);

    const options = {
        logo: (path === "") ? 1 : 2,
        login: (path === "login") ? false : true,
        signUp: (path === "signup") ? false : true,
        stats: (path === "stats") ? false : true,
        loggedin: user ? true : false,
    }

    var LogoComponent;
    if (options.logo === 1) {
        LogoComponent = <img src={elevkarenLogo} alt="Elevkåren logo"/>
    } else if (options.logo === 2) {
        LogoComponent = (
            <Link to="/">
                <img src={killergameLogo} alt="Killergame logo"/>
            </Link>)
    }

    return (
        <div className={styles.nav}>
            <div className={styles.logo}>
                {options.logo ? LogoComponent : null}
            </div>
            <div style={{display: "flex"}}>
                <div className={styles.subLink + " " + styles.redLink} style={{display: options.stats ? "inline-block" : "none"}}><Link to="/stats">Statistik</Link></div>
                <div className={styles.subLink} style={{display: options.login ? "inline-block" : "none"}}><Link to="/login">Logga in</Link></div>
                <div className={styles.cta} style={{display: options.signUp ? "inline-block" : "none"}}><Link to="/signup">Anmäl dig</Link></div>
            </div>
        </div>
    )
}

export default Nav