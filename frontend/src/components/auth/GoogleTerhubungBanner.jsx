// Penanda bahwa email pendaftaran sudah diverifikasi lewat Google

import { BadgeCheck } from 'lucide-react';

/**
 * @param {{ email: string, onLepas: () => void }} props
 */
const GoogleTerhubungBanner = ({ email, onLepas }) => (
  <div className="flex items-start gap-2 p-3 mb-5 rounded-lg bg-[#83f5c6]/20 border border-[#006c4e]/20">
    <BadgeCheck className="w-4 h-4 text-[#006c4e] shrink-0 mt-0.5" />
    <div className="flex-1 text-[11px] text-[#191c1e] leading-relaxed">
      Email <span className="font-bold">{email}</span> terverifikasi lewat Google. Permintaan akan langsung diteruskan ke owner.
    </div>
    <button type="button" onClick={onLepas} className="text-[10px] font-bold text-[#73777f] hover:text-[#ba1a1a] shrink-0">
      Ganti
    </button>
  </div>
);

export default GoogleTerhubungBanner;
