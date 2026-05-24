interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

export function Field({ label, required, hint, children }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-pk-text mb-1.5">
        {label}
        {required && <span className="text-pk-red ml-1" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && <p className="text-pk-subtle text-xs mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full bg-pk-surface-2 border border-pk-border rounded-lg px-3 py-2 text-sm text-pk-text placeholder:text-pk-subtle focus:outline-none focus:border-pk-red focus:ring-1 focus:ring-pk-red transition-colors";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputCls} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} resize-none`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${inputCls} cursor-pointer`} />
  );
}
