import React from 'react';

const STEPS = [
  {
    icon: '🤝',
    title: 'Pair up on a goal',
    description: 'Invite a friend by email and agree on a shared habit — like "exercise daily" or "read every night."'
  },
  {
    icon: '📸',
    title: 'Check in daily',
    description: 'Mark today done, and optionally attach a quick proof photo. No pressure — it\'s just for your partner.'
  },
  {
    icon: '✅',
    title: 'Your partner confirms it',
    description: 'A check-in only counts toward your streak once your partner reviews and confirms it really happened.'
  },
  {
    icon: '🔔',
    title: 'Automatic nudges',
    description: 'Miss 3 days in a row and your partner gets notified automatically — so nobody quietly falls off track.'
  }
];

function HowItWorks() {
  return (
    <div className="how-it-works">
      <h2 className="how-it-works-title">How it works</h2>
      <div className="how-it-works-steps">
        {STEPS.map((step, idx) => (
          <div
            key={step.title}
            className="how-it-works-step fade-in-up"
            style={{ animationDelay: `${idx * 0.12}s` }}
          >
            <div className="how-it-works-icon">{step.icon}</div>
            <div>
              <h3>{step.title}</h3>
              <p className="muted">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HowItWorks;
