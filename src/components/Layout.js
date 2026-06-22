import React from 'react';
import TopBar from './TopBar';
import BottomBar from './BottomBar';
import './Layout.css';

export default function Layout({ children, step, totalSteps, title, subtitle, contentMaxWidth }) {
  return (
    <div className="layout">
      <TopBar
        stepLabel={step && totalSteps ? `Paso ${step} de ${totalSteps}` : undefined}
        progress={step && totalSteps ? (step / totalSteps) * 100 : undefined}
      />

      <main className="layout-main">
        {(title || subtitle) && (
          <div className="layout-hero">
            {title && <h1 className="layout-title">{title}</h1>}
            {subtitle && <p className="layout-subtitle">{subtitle}</p>}
          </div>
        )}
        <div className="layout-content" style={contentMaxWidth ? { maxWidth: contentMaxWidth } : {}}>{children}</div>
      </main>

      <BottomBar />
    </div>
  );
}
