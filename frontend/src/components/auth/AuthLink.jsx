// Link teks bergaya halaman autentikasi

import { Link } from 'react-router-dom';

const AuthLink = ({ className = '', ...props }) => (
  <Link className={`font-bold text-[#1a3a5c] hover:text-[#002444] hover:underline ${className}`} {...props} />
);

export default AuthLink;
