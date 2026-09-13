# Kayeen M. Campaña — Portfolio

A minimalist, editorial neo-brutalist developer portfolio built with React and Vite.

## Features
- **Hero & Interactive ID Badge**: Two-sided interactive hanging identity badge with realistic physics and 3D flip.
- **Folder-Tab Project Cards**: Custom file-folder inspired cards with layered depth sheets, geometric tabs, and modal project galleries.
- **Editorial About Me Page**: Magazine-style layout highlighting background, education at AMA Computer College, core philosophy, and creative escapes.
- **Page Wipe Navigation**: Smooth color-wipe screen transitions between views.
- **Cyberpunk / Glitch Accents**: Scrambled text decoders, chromatic glitch animations, and DM Mono / Oswald typography.
- **Theme Support**: Seamless Light & Dark neo-brutalist modes.
- **Client Contact Page**: A three-step website brief with business details, website goals, launch preferences, review, email delivery, and direct-email fallback.

## Tech Stack
- **Framework**: React 18
- **Bundler**: Vite
- **Styling**: Vanilla CSS (CSS Variables, Clip-Path, Flexbox/Grid)
- **Fonts**: Oswald & DM Mono

## Getting Started

### Prerequisites
- Node.js (v18+)
- pnpm / npm

### Installation
```bash
# Clone repository
git clone https://github.com/Topor24k/Portfolio.git

# Navigate to project
cd Portfolio

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Build for Production
```bash
pnpm build
```

## Contact email activation

The Contact page and the shorter form below Projects share the same FormSubmit AJAX delivery to **kayeencampana@gmail.com**. No API key or Gmail password belongs in the browser code. Client replies use the visitor’s `email` field as the Reply-To address.

Before accepting client inquiries:

1. Submit a clearly labeled test inquiry from the running website.
2. Open the FormSubmit activation email in **kayeencampana@gmail.com** (check Spam too) and confirm the form.
3. Submit another test and verify that the inquiry arrives, includes business details, and replies to the supplied client address. If the public domain changes, check whether another activation is requested.

The UI handles accepted, pending-activation, failure, and timeout responses. A success response means the email service accepted the inquiry; it does not verify Gmail inbox placement. Draft details remain available after an error, with a prefilled direct-email fallback. FormSubmit processes submissions under its privacy policy, linked beside the form. No live test email is sent by local automated checks.

Delivery integration checks: `node --test src/contactDelivery.test.js`. See [FormSubmit setup](https://formsubmit.co/) and [AJAX documentation](https://formsubmit.co/ajax-documentation).
