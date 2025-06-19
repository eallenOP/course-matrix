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
export const CheckCircle2 = (props) => <MockIcon data-testid="check-circle-icon" {...props} />;
export const Loader2 = (props) => <MockIcon data-testid="loader-icon" {...props} />;
export const AlertCircle = (props) => <MockIcon data-testid="alert-circle-icon" {...props} />;
export const Wifi = (props) => <MockIcon data-testid="wifi-icon" {...props} />;
export const WifiOff = (props) => <MockIcon data-testid="wifi-off-icon" {...props} />;
export const X = (props) => <MockIcon data-testid="x-icon" {...props} />;
export const GripVertical = (props) => <MockIcon data-testid="grip-icon" {...props} />;
