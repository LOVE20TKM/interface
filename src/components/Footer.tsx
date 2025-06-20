// src/components/Footer.tsx
'use client';
import React from 'react';
import { NavigationUtils } from '@/src/lib/navigationUtils';

interface FooterProps {}

const Footer: React.FC<FooterProps> = () => {
  const handleExternalLink = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    NavigationUtils.handleExternalLink('https://love20tkm.github.io/docs/');
  };

  return (
    <footer className="mt-4 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
      <div className="container mx-auto px-4 py-4">
        <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900 flex flex-col items-center space-y-2">
          <p className="text-center text-sm text-slate-700 dark:text-slate-300">
            LOVE20 所有合约 以及 前端代码，都在全球最大开源平台 GitHub 上开源。地址是：
          </p>
          <a
            href="https://love20tkm.github.io/docs/"
            onClick={handleExternalLink}
            className="flex items-center gap-2 text-primary hover:underline font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-github"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
              <path d="M9 18c-4.51 2-5-2-7-2"></path>
            </svg>
            https://love20tkm.github.io/docs/
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
