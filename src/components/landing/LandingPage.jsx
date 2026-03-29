import React from 'react';
import Header from './Header';
import Hero from './Hero';
import About from './About';
import Features from './Features';
import Cta from './Cta';
import Contact from './Contact';
import Footer from './Footer';
import './LandingPage.css';

const LandingPage = ({ onStart }) => {
  return (
    <div className="landing-page">
      <Header onStart={onStart} />
      <main>
        <Hero onStart={onStart} />
        <Features />
        <About />
        <Cta onStart={onStart} />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
