# 🚀 DSA Canvas - Notion-Style LeetCode Tracker

A minimalist, fast, and fully local dashboard to track your Data Structures and Algorithms (DSA) progress. Built with a sleek, Notion-inspired dark mode interface.

## ✨ Features

- **🎨 Notion-Inspired UI**: Beautiful dark mode aesthetic with custom scrollbars, typography, and layout mimicking Notion databases.
- **📊 Real-time Statistics**: See your progress at a glance with counts for Total, Easy, Medium, and Hard problems completed.
- **🔍 Advanced Filtering**: 
  - Text search (by problem name or topic)
  - Custom autocomplete dropdown for Company tags
  - Difficulty filter (Easy, Medium, Hard)
  - Status filter (Completed, Pending)
- **💾 Local Persistence**: Your progress is automatically saved to your browser's `localStorage` — no database setup required.
- **📄 CSV Powered**: Reads directly from a local `leetcode_master.csv` file, making it incredibly easy to update or swap out your question bank.
- **📱 Fully Responsive**: Carefully crafted for both desktop and mobile viewing.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Library**: [React](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **CSV Parsing**: [PapaParse](https://www.papaparse.com/)

## 🚀 Getting Started

First, make sure you have Node.js installed. Then, clone the repository and install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🗂️ Data Management

The application reads question data from a CSV file located at `public/leetcode_master.csv`. 

To update your question list, simply replace or update this CSV file. The CSV expects the following headers:
- `Title`
- `Difficulty` 
- `Frequency`
- `Acceptance Rate`
- `Topics` (comma separated)
- `Company Count`
- `Companies` (pipe `|` separated)
- `Link`

## � Data Storage & Privacy

Your completion checkmarks are stored locally using your browser's **`localStorage`**. No data is ever sent to an external server. 

**Multi-User & Devices Behavior:**
- **Different Devices/Browsers:** Tracking statuses are completely isolated to the device and browser you are currently using. They will not collide across different machines or phones.
- **Same Browser Profile:** If two people use the exact same browser profile on the same computer, their tracking data *will* collide as they share the same `localStorage` key.
- **Want Cross-Device Sync?** To support multiple users or cross-device syncing (like saving on phone and seeing it on your computer), you can fork this repo and integrate a database (like Supabase, Firebase) and an authentication provider (like NextAuth).

## 🙏 Credits & Data Source

A massive thank you to [**liquidslr**](https://github.com/liquidslr/interview-company-wise-problems) for compiling and maintaining the LeetCode company tags dataset that powers this frontend dashboard.