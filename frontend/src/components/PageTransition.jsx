import React, { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// iOS-style navigation: new pages slide in from the right, going back slides in from the left.
// The final keyframe is `transform: none`, so fixed/sticky children behave normally once it ends.
export default function PageTransition({ transitionKey, children }) {
  const location = useLocation();
  const navType = useNavigationType();
  const key = transitionKey ?? location.pathname;

  useLayoutEffect(() => {
    if (navType !== 'POP') window.scrollTo({ top: 0, behavior: 'instant' });
  }, [key, navType]);

  return (
    <div key={key} className={navType === 'POP' ? 'animate-page-pop' : 'animate-page-push'}>
      {children}
    </div>
  );
}
