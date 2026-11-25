// Daftar aturan password yang berubah hijau saat terpenuhi

import { Check, Circle } from 'lucide-react';
import { PASSWORD_RULES } from '../../utils/passwordPolicy';

/**
 * @param {{ password: string }} props
 */
const PasswordChecklist = ({ password }) => (
  <ul className="grid gap-1 mt-1" aria-label="Syarat password">
    {PASSWORD_RULES.map((rule) => {
      const terpenuhi = rule.test(password);
      return (
        <li
          key={rule.id}
          className={`flex items-center gap-1.5 text-[10px] font-medium ${terpenuhi ? 'text-[#006c4e]' : 'text-[#73777f]'}`}
        >
          {terpenuhi ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
          {rule.label}
        </li>
      );
    })}
  </ul>
);

export default PasswordChecklist;
