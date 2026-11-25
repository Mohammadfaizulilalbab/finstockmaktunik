// Input password dengan tombol lihat/sembunyikan

import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import AuthTextField from './AuthTextField';
import { PASSWORD_MAX_LENGTH } from '../../utils/passwordPolicy';

/**
 * Menerima semua props AuthTextField (kecuali type & trailing)
 */
const PasswordField = (props) => {
  const [terlihat, setTerlihat] = useState(false);

  const tombolLihat = (
    <button
      type="button"
      onClick={() => setTerlihat((nilai) => !nilai)}
      className="p-1.5 text-[#73777f] hover:text-[#1a3a5c] rounded-md transition-colors"
      aria-label={terlihat ? 'Sembunyikan password' : 'Tampilkan password'}
    >
      {terlihat ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <AuthTextField
      icon={Lock}
      maxLength={PASSWORD_MAX_LENGTH}
      {...props}
      type={terlihat ? 'text' : 'password'}
      trailing={tombolLihat}
    />
  );
};

export default PasswordField;
