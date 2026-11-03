// Prototype page: a copy of investdetroit.com/need-support with the copilot attached.
// Copilot logic lives in src/copilot (no UI); reusable screens live in src/components.
import { useState } from 'react'
import IntakeForm from './prototype/IntakeForm.jsx'
import ChatAssistant from './components/ChatAssistant.jsx'
import { createAssistant } from './copilot/assistant.js'
import { track } from './copilot/events.js'
import './components/copilot.css'
import './App.css'

export default function App() {
  const [assistant] = useState(() => createAssistant({ onEvent: track }))
  const [activeFieldId, setActiveFieldId] = useState(null)

  return (
    <>
      <div className="proto-banner" role="note">
        Student prototype for the Invest Detroit project. Not the official website. Nothing you enter is sent anywhere.
      </div>

      <header className="site-header">
        <div className="container header-inner">
          <span className="logo">Invest Detroit</span>
          <a href="#form" className="btn yellow">Need Support?</a>
        </div>
      </header>

      <section className="hero">
        <div className="container">
          <h2>Need Support?</h2>
        </div>
      </section>

      <main>
        <section className="band how-it-works">
          <div className="inner">
            <h3>How it works</h3>
            <p>Invest Detroit works with developers, business owners, entrepreneurs, and startup founders to help accomplish our mission to be a financial catalyst for economic growth in underserved communities and markets in Detroit and the region. We believe in one Detroit for all and welcome funding interest from Detroit residents, entrepreneurs of color, women, and immigrants.</p>
            <p>For more information on our <strong>real estate</strong> and <strong>industrial</strong> offerings, please fill out the contact form below with information about your project and someone from our team will be in touch with you.</p>
            <p>For <strong>small business inquiries</strong>, please visit our <a href="https://investdetroit.com/small-business/" target="_blank" rel="noreferrer">small business page</a> and fill out the inquiry form.</p>
            <p>For more information on <strong>ID Ventures</strong>, our venture capital arm, please <a href="https://idventures.com/" target="_blank" rel="noreferrer">click here</a>.</p>
          </div>
        </section>

        <section className="band form-band" id="form">
          <div className="band-title"><span>Get In Touch</span></div>
          <div className="form-holder">
            <IntakeForm onActiveFieldChange={setActiveFieldId} />
          </div>
        </section>

        <section className="band contact-band">
          <div className="band-title"><span>Contact Us</span></div>
          <address className="contact">
            950 Selden Street, Suite 360<br />
            Detroit, MI 48201<br />
            info@investdetroit.com<br />
            313.259.6368
          </address>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>Prototype built by students to test an AI application assistant. Content adapted from the public Invest Detroit intake form. Not affiliated with or endorsed by Invest Detroit.</p>
        </div>
      </footer>

      <ChatAssistant assistant={assistant} activeFieldId={activeFieldId} />
    </>
  )
}
