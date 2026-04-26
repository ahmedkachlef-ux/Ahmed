"use client";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-100 dark:border-ink-800 bg-[rgb(var(--card))]">
      <div className="container-page py-12 grid md:grid-cols-4 gap-8">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-ink-500 max-w-xs">
            Premium training programs in IT, Cloud, AI, Cybersecurity, Project Management and beyond.
          </p>
        </div>
        <div>
          <div className="label mb-2">Product</div>
          <ul className="space-y-2 text-sm">
            <li><a href="/catalogue" className="hover:text-brand-600">Catalogue</a></li>
            <li><a href="/calendar" className="hover:text-brand-600">Calendar</a></li>
            <li><a href="/dashboard" className="hover:text-brand-600">Dashboard</a></li>
          </ul>
        </div>
        <div>
          <div className="label mb-2">Company</div>
          <ul className="space-y-2 text-sm">
            <li><a className="hover:text-brand-600" href="#">About</a></li>
            <li><a className="hover:text-brand-600" href="#">Trainers</a></li>
            <li><a className="hover:text-brand-600" href="#">Contact</a></li>
          </ul>
        </div>
        <div>
          <div className="label mb-2">Newsletter</div>
          <form className="flex gap-2">
            <input className="input" placeholder="you@company.com" />
            <button className="btn btn-primary">Join</button>
          </form>
          <p className="mt-3 text-xs text-ink-500">© {new Date().getFullYear()} ADVANCIA Trainings.</p>
        </div>
      </div>
    </footer>
  );
}
