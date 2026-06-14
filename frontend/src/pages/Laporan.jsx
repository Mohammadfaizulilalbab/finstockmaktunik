import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import axiosInstance from '../api/axiosInstance';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { formatRupiah } from '../utils/formatRupiah';
import { toast } from 'react-hot-toast';

const Laporan = () => {
  const [laporan, setLaporan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [trendData, setTrendData] = useState([]);
  const [pengeluaranData, setPengeluaranData] = useState([]);
  const [laporanHarian, setLaporanHarian] = useState([]);

  useEffect(() => {
    fetchLaporan();
  }, []);

  const fetchLaporan = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/laporan/keuangan?periode=bulanan');
      const data = response.data.data;
      setLaporan(data);

      const tData = {};
      data.transaksi?.forEach(trx => {
        const dateStr = new Date(trx.waktu).toISOString().split('T')[0];
        if (!tData[dateStr]) tData[dateStr] = { dateStr, Pendapatan: 0, Pengeluaran: 0 };
        tData[dateStr].Pendapatan += Number(trx.total);
      });
      data.pengeluaran?.forEach(p => {
        const dateStr = new Date(p.tanggal).toISOString().split('T')[0];
        if (!tData[dateStr]) tData[dateStr] = { dateStr, Pendapatan: 0, Pengeluaran: 0 };
        tData[dateStr].Pengeluaran += Number(p.jumlah);
      });
      
      const sortedTrend = Object.values(tData).sort((a,b) => new Date(a.dateStr) - new Date(b.dateStr)).map(item => ({
        tanggal: new Date(item.dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        Pendapatan: item.Pendapatan,
        Pengeluaran: item.Pengeluaran
      }));
      setTrendData(sortedTrend);

      const pData = {};
      data.pengeluaran?.forEach(p => {
        const kat = p.kategori || 'Lainnya';
        if (!pData[kat]) pData[kat] = 0;
        pData[kat] += Number(p.jumlah);
      });
      const colors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];
      setPengeluaranData(Object.entries(pData).map(([name, value], idx) => ({
        name,
        value,
        fill: colors[idx % colors.length]
      })));

      const hData = {};
      data.transaksi?.forEach(trx => {
        const dateStr = new Date(trx.waktu).toISOString().split('T')[0];
        if (!hData[dateStr]) hData[dateStr] = { dateStr, totalTrx: 0, pendapatan: 0, pengeluaran: 0 };
        hData[dateStr].totalTrx += 1;
        hData[dateStr].pendapatan += Number(trx.total);
      });
      data.pengeluaran?.forEach(p => {
        const dateStr = new Date(p.tanggal).toISOString().split('T')[0];
        if (!hData[dateStr]) hData[dateStr] = { dateStr, totalTrx: 0, pendapatan: 0, pengeluaran: 0 };
        hData[dateStr].pengeluaran += Number(p.jumlah);
      });
      const harianList = Object.values(hData).sort((a, b) => new Date(b.dateStr) - new Date(a.dateStr));
      setLaporanHarian(harianList);

    } catch (error) {
      console.error('Failed to fetch laporan', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, subtitleColorClass, topBorderColor }) => (
    <Card topBorderColor={topBorderColor} className="flex flex-col justify-center py-5 px-6">
      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">{title}</p>
      <h4 className="text-2xl font-bold text-neutral-800 leading-none mb-2">{value}</h4>
      <p className={`text-[11px] font-medium ${subtitleColorClass}`}>{subtitle}</p>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <h1 className="text-xl font-bold text-neutral-800">Laporan Keuangan</h1>
        <button onClick={() => {
          if (laporanHarian.length === 0) { toast.error('Belum ada data laporan'); return; }
          const cols = [
            { header: 'Tanggal', key: 'dateStr', format: (v) => new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) },
            { header: 'Total Trx', key: 'totalTrx' },
            { header: 'Pendapatan', key: 'pendapatan', format: (v) => formatRupiah(v) },
            { header: 'Pengeluaran', key: 'pengeluaran', format: (v) => formatRupiah(v) },
            { header: 'Laba Bersih', key: 'pendapatan', format: (v, row) => formatRupiah(row.pendapatan - row.pengeluaran) },
            { header: 'Status', key: 'pendapatan', format: (v, row) => (row.pendapatan - row.pengeluaran) >= 0 ? 'Untung' : 'Rugi' },
          ];
          exportToPDF(laporanHarian, cols, `laporan_bulanan_${new Date().toISOString().split('T')[0]}`, {
            title: 'Laporan Keuangan Bulanan',
            subtitle: `Pendapatan: ${formatRupiah(laporan?.summary?.totalPendapatan || 0)} | Pengeluaran: ${formatRupiah(laporan?.summary?.totalPengeluaran || 0)} | Laba: ${formatRupiah(laporan?.summary?.labaBersih || 0)}`,
          });
          toast.success('File PDF berhasil di-download');
        }} className="bg-[#1e3251] text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-slate-800">
          <Download size={16} />
          Download Laporan Bulanan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="PENDAPATAN BERSIH" 
          value={laporan?.summary ? `Rp ${(laporan.summary.totalPendapatan / 1000000).toFixed(1)} jt` : 'Rp 0'} 
          subtitle="Bulan ini"
          subtitleColorClass="text-teal-500"
          topBorderColor="indigo"
        />
        <StatCard 
          title="TOTAL PENGELUARAN" 
          value={laporan?.summary ? `Rp ${(laporan.summary.totalPengeluaran / 1000000).toFixed(1)} jt` : 'Rp 0'} 
          subtitle="Bulan ini"
          subtitleColorClass="text-teal-500"
          topBorderColor="warning"
        />
        <StatCard 
          title="MARGIN KEUNTUNGAN" 
          value={laporan?.summary && laporan.summary.totalPendapatan > 0 ? `${((laporan.summary.labaBersih / laporan.summary.totalPendapatan) * 100).toFixed(0)}%` : '0%'} 
          subtitle="Bulan ini"
          subtitleColorClass="text-teal-500"
          topBorderColor="success"
        />
        <StatCard 
          title="RATA-RATA TRANSAKSI" 
          value={laporan?.summary && laporan.summary.totalTransaksi > 0 ? `Rp ${(laporan.summary.totalPendapatan / laporan.summary.totalTransaksi / 1000).toFixed(0)}rb` : 'Rp 0'} 
          subtitle="Bulan ini"
          subtitleColorClass="text-teal-500"
          topBorderColor="indigo"
        />
      </div>

      <Card title="Tren Pendapatan vs Pengeluaran">
        <div className="h-72 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
              <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#6b7280' }} />
              <Line type="monotone" dataKey="Pendapatan" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Pengeluaran" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <Card title="Rincian Pengeluaran">
            <div className="h-56 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pengeluaranData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} width={100} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {pengeluaranData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-between items-center text-sm font-semibold text-neutral-800 border-t border-neutral-100 pt-4">
              <span>Total Pengeluaran</span>
              <span>{laporan?.summary ? `Rp ${laporan.summary.totalPengeluaran.toLocaleString('id-ID')}` : 'Rp 0'}</span>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card title="Laporan Harian (April 2026)" noPadding>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50">
                    <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">TANGGAL</th>
                    <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-right">TOTAL TRX</th>
                    <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-right">PENDAPATAN</th>
                    <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-right">PENGELUARAN</th>
                    <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-right">LABA BERSIH</th>
                    <th className="py-3 px-6 text-[10px] font-bold text-neutral-400 uppercase tracking-wider text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-neutral-600">
                  {laporanHarian.length > 0 ? laporanHarian.map((hari, idx) => {
                    const laba = hari.pendapatan - hari.pengeluaran;
                    return (
                      <tr key={idx} className="even:bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                        <td className="py-3 px-6 text-xs text-[#1e3251] font-medium">{new Date(hari.dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td className="py-3 px-6 text-xs text-right">{hari.totalTrx}</td>
                        <td className="py-3 px-6 text-xs text-right text-green-600 font-medium">Rp {hari.pendapatan.toLocaleString('id-ID')}</td>
                        <td className="py-3 px-6 text-xs text-right text-red-500">Rp {hari.pengeluaran.toLocaleString('id-ID')}</td>
                        <td className={`py-3 px-6 text-xs text-right font-bold ${laba >= 0 ? 'text-[#1e3251]' : 'text-red-600'}`}>
                          {laba < 0 ? '-' : ''}Rp {Math.abs(laba).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-6 text-center">
                          <Badge variant={laba >= 0 ? "success" : "danger"}>{laba >= 0 ? "Untung" : "Rugi"}</Badge>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="6" className="py-4 text-center text-xs text-neutral-500">Belum ada data laporan</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Laporan;
