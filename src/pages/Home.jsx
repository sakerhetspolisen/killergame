import React from "react";
import styles from "./Home.module.css";
import backgroundVideo from "../assets/hallway.mp4";
import webMVideo from "../assets/hallway.webm";
import logo from "../assets/logo.png";
import music from "../assets/music.mp3";

const Home = () => {
    return (
        <div className={styles.hero}>
            <div className={styles.backgroundVideo}>
                <video playsInline autoPlay muted loop poster="">
                    <source src={webMVideo} type="video/webm"/>
                    <source src={backgroundVideo} type="video/mp4"/>
                </video>
                <audio controls autoPlay>
                    <source src={music} type="audio/mpeg"></source>
                </audio>
            </div>
            <div className={styles.content}>
                <img src={logo} alt="killergame-logo"/>
                <p>
                    Killergamekommittén arrangerar<br/>
                    <b>{(new Date().getFullYear() - 2016).toString()}</b>-årsutgåvan av Killergame i samarbete med<br/>
                    Elevkåren vid Procivitas. Alla är välkomna att spela,<br/>
                    men du kommer inte klara dig länge...</p>
            </div>
        </div>
    );
}

export default Home;