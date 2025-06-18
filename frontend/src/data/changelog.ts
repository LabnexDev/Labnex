export interface Change {
  version: string;
  date: string;
  title: string;
  description: string;
  changes: {
    type: 'feature' | 'fix' | 'improvement' | 'refactor';
    details: string;
  }[];
}

export const changelogData: Change[] = [
  {
    version: '1.4.1',
    date: '2025-06-18',
    title: 'UI/UX Overhaul & Forgot Password Flow',
    description: 'Polished the global interface with glass/gradient design, implemented a darker charcoal light theme, and delivered a full password-reset experience across backend and frontend.',
    changes: [
      { type: 'improvement', details: 'Unified glassmorphic styling across Dashboard, Projects, Tasks, Notes, Snippets, Docs, CLI, and Discord pages.' },
      { type: 'improvement', details: 'Added charcoal-grey light theme via CSS variables for less glare.' },
      { type: 'feature', details: 'Restyled Login & Register pages to match landing-page design.' },
      { type: 'feature', details: 'Introduced Forgot Password modal with email entry.' },
      { type: 'feature', details: 'Backend endpoints /auth/forgot-password and /auth/reset-password with secure token & expiry.' },
      { type: 'feature', details: 'Email service sends Resend-powered reset link with 1-hour validity.' },
      { type: 'feature', details: 'Frontend Reset Password page validates token and lets users set a new password.' },
      { type: 'feature', details: 'Confirmation screen guiding users to check their inbox.' },
      { type: 'refactor', details: 'Updated Card, Button, Modal, and Input components to leverage theme variables.' },
    ],
  },
  {
    version: '1.4.0',
    date: '2025-06-17',
    title: 'Cloud CLI & Runner Release',
    description: 'Major release introducing cloud execution mode, new CLI commands, significant backend runner enhancements, and updated documentation across the platform.',
    changes: [
      { type: 'feature', details: 'Added --cloud flag and enabled cloud execution mode (beta).' },
      { type: 'feature', details: 'Integrated useCloudRunner=true for backend-triggered runs.' },
      { type: 'improvement', details: 'Self-healing execution with fallback selector strategies.' },
      { type: 'feature', details: 'Introduced lint-tests and create-test-case commands.' },
      { type: 'feature', details: 'Support for skip steps in parsing and execution.' },
      { type: 'improvement', details: 'Smart wait logic with email/user synonym detection and extended selector handling.' },
      { type: 'feature', details: 'Phase-1 interactive help wizard for onboarding new users.' },
      { type: 'refactor', details: 'Extracted executor logic into new @labnex/executor package.' },
      { type: 'improvement', details: 'Updated TypeScript configs & build order for multi-package workspace.' },
      { type: 'fix', details: 'Resolved circular dependencies and refined Dockerfile build pipeline.' },
      { type: 'feature', details: 'Test Case page now accepts "Raw Steps" and supports .txt / .json uploads.' },
      { type: 'improvement', details: 'Updated CLI banner & dashboard to reflect live cloud functionality.' },
      { type: 'feature', details: 'Implemented polling-based cloud test runner with Docker integration.' },
      { type: 'improvement', details: 'Enhanced test case claiming logic for cloud runs.' },
      { type: 'improvement', details: 'Improved authentication flow with Bearer token support.' },
      { type: 'feature', details: 'Deployed background worker for Render hosting environment.' },
      { type: 'improvement', details: 'Parser support for "wait for <selector>" steps and SPA flows.' },
      { type: 'improvement', details: 'Fallback navigation recovery for mis-routed login paths.' },
      { type: 'improvement', details: 'Enhanced logging, debug output, and retry logic in runner & backend.' },
      { type: 'improvement', details: 'Finalized API key management with secure route access.' },
      { type: 'improvement', details: 'Updated CLI usage guide, package docs, and inline help.' },
    ],
  },
  {
    version: '1.3.9',
    date: '2025-06-14',
    title: 'Support System & Platform-Wide Improvements',
    description: 'Introduced a comprehensive support system, updated documentation and policies, and rolled out significant improvements to the user interface and ticketing system.',
    changes: [
      { type: 'feature', details: 'Added a new Support page with form validation for both guest and authenticated users.' },
      { type: 'improvement', details: 'Linked the Support page across the site for improved navigation.' },
      { type: 'improvement', details: 'Integrated backend logic to send emails from the verified subdomain (support@contact.labnex.dev).' },
      { type: 'refactor', details: 'Improved email handling via email.service.ts with correct subdomain configuration.' },
      { type: 'improvement', details: 'Updated Privacy Policy, Support Documentation, and Terms of Service.' },
      { type: 'fix', details: 'Minor layout and content fixes across documentation pages.' },
      { type: 'improvement', details: 'Updated Contact.tsx for better layout and accessibility.' },
      { type: 'improvement', details: 'Refined Landing Page styling and added a Changelog section for user visibility.' },
      { type: 'refactor', details: 'Updated ticket command structure and moved /close command to the ticket category.' },
      { type: 'improvement', details: 'Temporarily removed automatic staff pings on new tickets for clarity.' },
      { type: 'improvement', details: 'Improved stability for /close and /delete ticket commands.' },
      { type: 'improvement', details: 'General improvements to ticket flow and internal organization.' },
    ],
  },
  {
    version: '1.3.5',
    date: '2025-06-13',
    title: 'Ticketing System Overhaul',
    description: 'Refactored the core ticketing logic, transitioned fully from the legacy modmail system, and integrated new AI-powered features for staff.',
    changes: [
      { type: 'refactor', details: 'Refactored ticket logic and resolved related issues.' },
      { type: 'improvement', details: 'Improved interactionCreateHandler.ts and response handling.' },
      { type: 'feature', details: 'Added backend logging and fixed a bot state hanging issue.' },
      { type: 'feature', details: 'Implemented AI tag generation for staff tickets.' },
      { type: 'feature', details: 'Fully transitioned from modmail to structured ticket channels.' },
    ],
  },
  {
    version: '1.3.0',
    date: '2025-06-12',
    title: 'New Features & Infrastructure Updates',
    description: 'Launched the public roadmap and donation features, alongside various improvements to routing, error handling, and frontend structure.',
    changes: [
      { type: 'feature', details: 'Launched roadmap page and enabled donation settings.' },
      { type: 'fix', details: 'Improved waitlist 409 error handling.' },
      { type: 'improvement', details: 'Updated stats controller and domain email logic.' },
      { type: 'refactor', details: 'Cleaned up 404 redirects and frontend structure in App.tsx.' },
    ],
  },
  {
    version: '1.2.8',
    date: '2025-06-11',
    title: 'Backend Stability & Deployment Fixes',
    description: 'Addressed critical backend issues including CORS, timeouts, and deployment configurations to improve overall stability and reliability.',
    changes: [
      { type: 'fix', details: 'Fixed CORS issues for backend endpoints.' },
      { type: 'improvement', details: 'Improved backend startup and logging.' },
      { type: 'fix', details: 'Fixed AI timeout and snippet-saving bugs.' },
      { type: 'improvement', details: 'Bound domain with CNAME and updated Vite config.' },
      { type: 'refactor', details: 'Backend package improvements and server config cleanups.' },
    ],
  },
  {
    version: '1.2.5',
    date: '2025-06-10',
    title: 'Modmail System Transition',
    description: 'Enhanced the existing modmail system with better commands and role handling while beginning its deprecation in favor of the new ticket system.',
    changes: [
      { type: 'improvement', details: 'Enhanced modmail commands and AI suggestions.' },
      { type: 'improvement', details: 'Improved role handling and debug logging.' },
      { type: 'refactor', details: 'Deprecated modmail flow in favor of ticket system.' },
    ],
  },
  {
    version: '1.2.2',
    date: '2025-06-07',
    title: 'Mobile Experience & Role Automation',
    description: 'Focused on improving the user experience on mobile devices and automating server role assignments based on user actions.',
    changes: [
      { type: 'improvement', details: 'Improved mobile responsiveness.' },
      { type: 'feature', details: 'Added `sendroleselect` and `sendrules` slash commands.' },
      { type: 'feature', details: 'Integrated waitlist role onboarding and rule-based role assignment.' },
    ],
  },
  {
    version: '1.2.1',
    date: '2025-05-26',
    title: 'CLI Publication & Documentation',
    description: 'Published the first public version of the Labnex CLI to npm and created documentation for its use and installation.',
    changes: [
      { type: 'feature', details: 'Published Labnex CLI v1.2.1 to npm.' },
      { type: 'feature', details: 'Added local CLI installation guide to the site.' },
      { type: 'improvement', details: 'Improved Puppeteer Chrome config for free-tier memory optimization.' },
      { type: 'fix', details: 'Fixed GitHub Actions workflows and permissions.' },
      { type: 'improvement', details: 'Refined README, added screenshots, and updated deployment docs.' },
    ],
  },
]; 