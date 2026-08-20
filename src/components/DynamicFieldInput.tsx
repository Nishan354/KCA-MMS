import React from 'react';
import { CustomFieldDefinition } from '../types/member';

interface DynamicFieldInputProps {
  field: CustomFieldDefinition;
  value: any;
  onChange: (value: any) => void;
  className?: string;
}

export const DynamicFieldInput: React.FC<DynamicFieldInputProps> = ({
  field,
  value,
  onChange,
  className = '',
}) => {
  const isRequired = !!field.required;

  if (field.type === 'checkbox') {
    return (
      <div className={`flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-md ${className}`}>
        <input
          type="checkbox"
          id={field.id}
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="rounded text-[#8b0000] focus:ring-[#8b0000] h-4 w-4"
        />
        <label htmlFor={field.id} className="text-xs font-semibold text-slate-800 cursor-pointer select-none">
          {field.label} {isRequired && <span className="text-red-600">*</span>}
        </label>
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className={className}>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          {field.label} {isRequired && <span className="text-red-600">*</span>}
        </label>
        <textarea
          rows={2}
          required={isRequired}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || `Enter ${field.label}...`}
          className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs text-slate-900 bg-white focus:ring-1 focus:ring-[#8b0000] outline-none"
        />
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div className={className}>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          {field.label} {isRequired && <span className="text-red-600">*</span>}
        </label>
        <select
          required={isRequired}
          value={value ?? field.defaultValue ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs font-medium text-slate-900 bg-white focus:ring-1 focus:ring-[#8b0000] outline-none"
        >
          <option value="">-- Choose {field.label} --</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'date') {
    return (
      <div className={className}>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          {field.label} {isRequired && <span className="text-red-600">*</span>}
        </label>
        <input
          type="date"
          required={isRequired}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono text-xs text-slate-900 bg-white focus:ring-1 focus:ring-[#8b0000] outline-none"
        />
      </div>
    );
  }

  if (field.type === 'number') {
    return (
      <div className={className}>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          {field.label} {isRequired && <span className="text-red-600">*</span>}
        </label>
        <input
          type="number"
          required={isRequired}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          placeholder={field.placeholder || '0'}
          className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono text-xs text-slate-900 bg-white focus:ring-1 focus:ring-[#8b0000] outline-none"
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
        {field.label} {isRequired && <span className="text-red-600">*</span>}
      </label>
      <input
        type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
        required={isRequired}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || `Enter ${field.label}...`}
        className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs text-slate-900 bg-white focus:ring-1 focus:ring-[#8b0000] outline-none"
      />
    </div>
  );
};
