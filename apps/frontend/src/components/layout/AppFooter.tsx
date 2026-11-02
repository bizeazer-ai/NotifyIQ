import React from 'react';

interface AppFooterProps {
  className?: string;
  style?: React.CSSProperties;
}

export function AppFooter({ className = '', style }: AppFooterProps) {
  return (
    <footer className={`app-footer ${className}`} style={style}>
      <div>
        &copy; 2026 <strong> NotifyIQ. </strong> All rights reserved. NotifyIQ is a product of {' '}
        <a
          href="https://www.aadiitservices.com"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          Aadi IT Services LLP
        </a>
      </div>
      {/* <div className="footer-subtext">
        NotifyIQ is a product of Aadi IT Services LLP. Trademark Registration is under process.
      </div> */}
    </footer>
  );
}

export default AppFooter;
