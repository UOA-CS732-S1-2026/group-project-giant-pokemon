"use client";

export default function Dropdown({ label, value, onChange, options }: any) {
  return (
    <div className="flex flex-col">
      <label className="text-gray-700 font-medium mb-1">{label}</label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 
                   text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      >
        {options.map((opt: string) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}