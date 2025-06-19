import React from 'react';

const MockIcon = ({ className, 'data-testid': testId, ...props }) => (
  React.createElement('div', {
    className,
    'data-testid': testId,
    ...props
  })
);

export const PlusCircle = (props) => <MockIcon data-testid="plus-icon" {...props} />;
export const Settings = (props) => <MockIcon data-testid="settings-icon" {...props} />;
export const Copy = (props) => <MockIcon data-testid="copy-icon" {...props} />;
export const Files = (props) => <MockIcon data-testid="files-icon" {...props} />;
