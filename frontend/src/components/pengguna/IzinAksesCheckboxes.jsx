// Pilihan izin akses fitur untuk akun KARYAWAN

import { DAFTAR_FITUR } from '../../constants/permissions';

/**
 * @param {{ value: string[], onChange: (permissions: string[]) => void }} props
 */
const IzinAksesCheckboxes = ({ value, onChange }) => {
  const toggle = (fitur) => {
    onChange(value.includes(fitur) ? value.filter((item) => item !== fitur) : [...value, fitur]);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">Izin Akses Fitur</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-[#c3c6cf]/40 rounded-md p-3 max-h-48 overflow-y-auto bg-neutral-50/50">
        {DAFTAR_FITUR.map((fitur) => (
          <label key={fitur.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white p-1.5 rounded transition-colors">
            <input
              type="checkbox"
              className="rounded text-[#002444] focus:ring-[#002444] w-4 h-4 cursor-pointer"
              checked={value.includes(fitur.id)}
              onChange={() => toggle(fitur.id)}
            />
            <span className="text-neutral-700">{fitur.label}</span>
          </label>
        ))}
      </div>
      <p className="text-[10px] text-neutral-500 mt-1">* Akun dengan role OWNER otomatis mendapatkan akses penuh ke semua fitur.</p>
    </div>
  );
};

export default IzinAksesCheckboxes;
