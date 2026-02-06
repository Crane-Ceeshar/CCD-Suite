import * as React from 'react';
import { cn } from '../lib/utils';
import { Label } from '../primitives/label';

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  htmlFor?: string;
  description?: string;
  error?: string;
  required?: boolean;
}

function FormField({
  label,
  htmlFor,
  description,
  error,
  required,
  children,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

export { FormField };
