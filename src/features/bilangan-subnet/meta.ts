import type { ToolMeta } from '../../lib/tool-types';

export const meta: ToolMeta = {
	slug: 'bilangan-subnet', name: 'Bilangan & Subnet', category: 'developer', icon: 'network', status: 'siap', privacy: 'lokal',
	tagline: 'Konversi bilangan besar antarbasis dengan BigInt, lihat komplemen dua, dan hitung atau bagi subnet IPv4.',
	keywords: ['biner', 'oktal', 'desimal', 'hex', 'bigint', 'subnet', 'ipv4', 'cidr', 'network', 'komplemen dua'],
	usage: ['Pilih tab bilangan atau subnet IPv4.', 'Isi bilangan dan basisnya, atau IPv4 beserta CIDR atau mask.', 'Periksa hasil dan salin. Pembagian subnet dibatasi 256 baris agar browser kamu tetap ringan.'],
	privacyDetail: 'Semua perhitungan dilakukan di browser kamu, tanpa mengirim data jaringan ke server.',
	faq: [{ q: 'Bagaimana host /31 dan /32 dihitung?', a: '/31 memakai kedua alamat sebagai endpoint point-to-point sesuai RFC 3021. /32 berisi satu alamat. Field broadcast tetap menunjukkan alamat paling akhir blok; /31 tidak memiliki directed broadcast.' }],
};
