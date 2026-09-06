import {
  IApplicationRepository,
  UnderwritingDossier,
  ApplicationFilterParams,
  PillarType,
  PillarStatus,
  ApplicationStatus,
} from './application.repository.interface';

export class ApplicationMockRepository implements IApplicationRepository {
  private dossiers: UnderwritingDossier[] = [
    {
      id: '#APP-2026-8819',
      applicantName: 'Budi Santoso',
      applicantAge: 34,
      nik: '3271048801920002',
      productName: 'Secure Life Plus',
      productSlug: 'secure-life-plus',
      sumAssured: 'Rp 500.000.000',
      status: 'under_review',
      statusLabel: 'Under Review',
      riskScore: 92,
      riskGrade: 'A+',
      slaRemainingMinutes: 14,
      slaText: 'SLA: 14 min',
      slaColor: '#ef4444',
      monthlyPremium: 'Rp 450.000',
      tenorYears: 20,
      paymentMethod: 'VA Mandiri',
      autoDebet: true,
      beneficiaryName: 'Ratna Dewi (Istri)',
      beneficiaryRelation: 'Istri',
      beneficiarySharePct: 100,
      passedChecksCount: 4,
      totalChecksCount: 4,
      internalAuditNotes:
        'Semua 4 pilar checks terverifikasi valid tanpa anomali. Verifikasi identitas Dukcapil OCR mencapai 99.4%, rasio premi terhadap pendapatan sangat sehat (1.8%), tidak membutuhkan skrining medis khusus. Direkomendasikan untuk langsung diterbitkan polis aktif nomor POL-2026-8819.',
      auditSignature:
        'Diperiksa oleh: Bayu Pratama (NIP: UW-2026-042) • Terhubung ke PATCH /api/v1/applications/:id/status',
      auditHash:
        'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      reviewChecks: [
        {
          type: 'identity_verified',
          title: '1. Verifikasi Identitas (Dukcapil OCR)',
          status: 'PASSED',
          statusBg: '#d1fae5',
          statusColor: '#065f46',
          details:
            'NIK: 3271048801920002 • Nama: BUDI SANTOSO • TTL: Bogor, 14-08-1992. OCR Confidence 99.4%. Liveness Biometric matching 98.1% cocok tanpa fraud flag.',
          reviewer: 'Diverifikasi oleh: System OCR Worker (Auto)',
        },
        {
          type: 'income_verified',
          title: '2. Verifikasi Pendapatan & Debt-to-Income (DSR)',
          status: 'PASSED',
          statusBg: '#d1fae5',
          statusColor: '#065f46',
          details:
            'Gaji Pokok: IDR 25.000.000/bln (Slip Gaji terlampir & validasi rek 3 bulan). Premi: IDR 450.000/bln -> Rasio Premi terhadap Gaji: 1.8% (Batas Maksimum Aman: 15%).',
          reviewer: 'Diverifikasi oleh: Bayu Pratama (Underwriter)',
        },
        {
          type: 'documents_complete',
          title: '3. Kelengkapan Berkas & Legalitas',
          status: 'PASSED',
          statusBg: '#d1fae5',
          statusColor: '#065f46',
          details:
            'Dokumen terunggah: Foto KTP Asli (OK), Foto Selfie Liveness (OK), NPWP (OK), Bukti Penghasilan (OK). Semua 4 dokumen memenuhi standar resolusi dan metadata EXIF valid.',
          reviewer: 'Diverifikasi oleh: System Doc Validator',
        },
        {
          type: 'medical_required',
          title: '4. Skrining Medis & Risk Threshold',
          status: 'NOT_NEEDED',
          statusBg: '#f1f5f9',
          statusColor: '#64748b',
          details:
            'Status Merokok: TIDAK • BMI: 22.4 (Normal) • Riwayat Penyakit Kritis: TIDAK. Uang Pertanggungan Rp 500 Jt berada di bawah batas kewajiban tes laboratorium (1 M).',
          reviewer: 'Diverifikasi oleh: Auto-Rule Engine (Waived)',
        },
      ],
    },
    {
      id: '#APP-2026-8820',
      applicantName: 'Siti Rahmawati',
      applicantAge: 29,
      nik: '3174029104870001',
      productName: 'Health Guard Essential',
      productSlug: 'health-guard-essential',
      sumAssured: 'Rp 250.000.000',
      status: 'submitted',
      statusLabel: 'Submitted Baru',
      riskScore: 88,
      riskGrade: 'A',
      slaRemainingMinutes: 26,
      slaText: 'SLA: 26 min',
      slaColor: '#f59e0b',
      monthlyPremium: 'Rp 320.000',
      tenorYears: 10,
      paymentMethod: 'BCA Virtual Account',
      autoDebet: true,
      beneficiaryName: 'Ahmad Fauzi (Suami)',
      beneficiaryRelation: 'Suami',
      beneficiarySharePct: 100,
      passedChecksCount: 2,
      totalChecksCount: 4,
      internalAuditNotes:
        'Pengajuan baru masuk dari kanal digital mobile. Menunggu validasi dokumen pendukung dan verifikasi DSR.',
      auditSignature:
        'Diperiksa oleh: Bayu Pratama (NIP: UW-2026-042) • Terhubung ke PATCH /api/v1/applications/:id/status',
      auditHash:
        'sha256:8b42c1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9070',
      reviewChecks: [
        {
          type: 'identity_verified',
          title: '1. Verifikasi Identitas (Dukcapil OCR)',
          status: 'PASSED',
          statusBg: '#d1fae5',
          statusColor: '#065f46',
          details:
            'NIK: 3174029104870001 • Nama: SITI RAHMAWATI • TTL: Jakarta, 04-05-1997. Liveness match 99.1%.',
          reviewer: 'Diverifikasi oleh: System OCR Worker (Auto)',
        },
        {
          type: 'income_verified',
          title: '2. Verifikasi Pendapatan & Debt-to-Income (DSR)',
          status: 'PASSED',
          statusBg: '#d1fae5',
          statusColor: '#065f46',
          details: 'Gaji Pokok: IDR 18.000.000/bln. Rasio Premi: 1.7% (Sehat).',
          reviewer: 'Diverifikasi oleh: Auto-Rule Engine',
        },
        {
          type: 'documents_complete',
          title: '3. Kelengkapan Berkas & Legalitas',
          status: 'UNDER_REVIEW',
          statusBg: '#fef3c7',
          statusColor: '#92400e',
          details:
            'Foto NPWP memerlukan konfirmasi ulang nomor registrasi pajak DJP.',
          reviewer: 'Menunggu: Manual Underwriter Review',
        },
        {
          type: 'medical_required',
          title: '4. Skrining Medis & Risk Threshold',
          status: 'NOT_NEEDED',
          statusBg: '#f1f5f9',
          statusColor: '#64748b',
          details: 'BMI: 21.1 (Ideal) • UP di bawah threshold medical exam.',
          reviewer: 'Diverifikasi oleh: Auto-Rule Engine (Waived)',
        },
      ],
    },
    {
      id: '#APP-2026-8821',
      applicantName: 'Hendra Wijaya',
      applicantAge: 41,
      nik: '3578017508840003',
      productName: 'Auto Shield Comprehensive',
      productSlug: 'auto-shield-comprehensive',
      sumAssured: 'Rp 380.000.000',
      status: 'under_review',
      statusLabel: 'Under Review',
      riskScore: 81,
      riskGrade: 'B+',
      slaRemainingMinutes: 38,
      slaText: 'SLA: 38 min',
      slaColor: '#64748b',
      monthlyPremium: 'Rp 650.000',
      tenorYears: 5,
      paymentMethod: 'Kartu Kredit Mandiri',
      autoDebet: true,
      beneficiaryName: 'Hendra Wijaya (Tertanggung Utama)',
      beneficiaryRelation: 'Pemilik Polis',
      beneficiarySharePct: 100,
      passedChecksCount: 2,
      totalChecksCount: 4,
      internalAuditNotes:
        'Klaim historis kendaraan sebelumnya bersih. Menunggu verifikasi faktur pembelian mobil dan STNK asli.',
      auditSignature:
        'Diperiksa oleh: Bayu Pratama (NIP: UW-2026-042) • Terhubung ke PATCH /api/v1/applications/:id/status',
      auditHash:
        'sha256:1a23c1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9071',
      reviewChecks: [
        {
          type: 'identity_verified',
          title: '1. Verifikasi Identitas (Dukcapil OCR)',
          status: 'PASSED',
          statusBg: '#d1fae5',
          statusColor: '#065f46',
          details: 'NIK: 3578017508840003 • Nama: HENDRA WIJAYA. OCR 99.2%.',
          reviewer: 'Diverifikasi oleh: System OCR Worker (Auto)',
        },
        {
          type: 'income_verified',
          title: '2. Verifikasi Pendapatan & Debt-to-Income (DSR)',
          status: 'UNDER_REVIEW',
          statusBg: '#fef3c7',
          statusColor: '#92400e',
          details: 'Menunggu konfirmasi rekening koran operasional usaha.',
          reviewer: 'Menunggu: Manual Underwriter Review',
        },
        {
          type: 'documents_complete',
          title: '3. Kelengkapan Berkas & Legalitas',
          status: 'PASSED',
          statusBg: '#d1fae5',
          statusColor: '#065f46',
          details: 'STNK, BPKB copy, dan foto fisik 4 sisi kendaraan lengkap.',
          reviewer: 'Diverifikasi oleh: System Doc Validator',
        },
        {
          type: 'medical_required',
          title: '4. Skrining Medis & Risk Threshold',
          status: 'NOT_NEEDED',
          statusBg: '#f1f5f9',
          statusColor: '#64748b',
          details: 'Asuransi kerugian kendaraan; skrining medis tidak diperlukan.',
          reviewer: 'Diverifikasi oleh: Auto-Rule Engine (Waived)',
        },
      ],
    },
    {
      id: '#APP-2026-8822',
      applicantName: 'Maya Anggraini',
      applicantAge: 33,
      nik: '3201099203950004',
      productName: 'Secure Life Plus',
      productSlug: 'secure-life-plus',
      sumAssured: 'Rp 1.000.000.000',
      status: 'under_review',
      statusLabel: 'Under Review',
      riskScore: 85,
      riskGrade: 'B+',
      slaRemainingMinutes: 45,
      slaText: 'SLA: 45 min',
      slaColor: '#64748b',
      monthlyPremium: 'Rp 950.000',
      tenorYears: 25,
      paymentMethod: 'VA BNI',
      autoDebet: true,
      beneficiaryName: 'Bambang Irawan (Ayah Kandung)',
      beneficiaryRelation: 'Orang Tua',
      beneficiarySharePct: 100,
      passedChecksCount: 3,
      totalChecksCount: 4,
      internalAuditNotes:
        'UP mencapai Rp 1.000.000.000 (batas threshold pemeriksaan lab MCU). Menunggu review hasil cek gula darah.',
      auditSignature:
        'Diperiksa oleh: Bayu Pratama (NIP: UW-2026-042) • Terhubung ke PATCH /api/v1/applications/:id/status',
      auditHash:
        'sha256:2b34c1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9072',
      reviewChecks: [
        {
          type: 'identity_verified',
          title: '1. Verifikasi Identitas (Dukcapil OCR)',
          status: 'PASSED',
          statusBg: '#d1fae5',
          statusColor: '#065f46',
          details: 'NIK: 3201099203950004 • Nama: MAYA ANGGRAINI. Valid.',
          reviewer: 'Diverifikasi oleh: System OCR Worker (Auto)',
        },
        {
          type: 'income_verified',
          title: '2. Verifikasi Pendapatan & Debt-to-Income (DSR)',
          status: 'PASSED',
          statusBg: '#d1fae5',
          statusColor: '#065f46',
          details: 'Gaji Pokok: IDR 35.000.000/bln. Rasio Premi: 2.7%.',
          reviewer: 'Diverifikasi oleh: Auto-Rule Engine',
        },
        {
          type: 'documents_complete',
          title: '3. Kelengkapan Berkas & Legalitas',
          status: 'PASSED',
          statusBg: '#d1fae5',
          statusColor: '#065f46',
          details: 'Semua 4 dokumen identitas dan laporan keuangan terunggah valid.',
          reviewer: 'Diverifikasi oleh: System Doc Validator',
        },
        {
          type: 'medical_required',
          title: '4. Skrining Medis & Risk Threshold',
          status: 'UNDER_REVIEW',
          statusBg: '#fef3c7',
          statusColor: '#92400e',
          details:
            'UP Rp 1.000.000.000 mewajibkan hasil MCU lab darah & urine rumah sakit rekanan.',
          reviewer: 'Menunggu: Hasil Lab RS Rekanan',
        },
      ],
    },
    {
      id: '#APP-2026-8823',
      applicantName: 'Dimas Prasetyo',
      applicantAge: 38,
      nik: '5171038902910005',
      productName: 'Health Guard Essential',
      productSlug: 'health-guard-essential',
      sumAssured: 'Rp 150.000.000',
      status: 'approved',
      statusLabel: 'Disetujui',
      riskScore: 95,
      riskGrade: 'A+',
      slaRemainingMinutes: 0,
      slaText: 'Selesai',
      slaColor: '#10b981',
      monthlyPremium: 'Rp 220.000',
      tenorYears: 10,
      paymentMethod: 'VA Mandiri',
      autoDebet: true,
      beneficiaryName: 'Winda Sari (Istri)',
      beneficiaryRelation: 'Istri',
      beneficiarySharePct: 100,
      passedChecksCount: 4,
      totalChecksCount: 4,
      internalAuditNotes:
        'Polis telah disetujui dan diterbitkan secara otomatis dengan nomor POL-2026-8823.',
      auditSignature:
        'Diperiksa oleh: Auto-Underwriting System • Approved on 2026-09-06 08:30 WIB',
      auditHash:
        'sha256:3c45c1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9073',
      reviewChecks: [
        {
          type: 'identity_verified',
          title: '1. Verifikasi Identitas (Dukcapil OCR)',
          status: 'PASSED',
          statusBg: '#d1fae5',
          statusColor: '#065f46',
          details: 'Dukcapil match 100%.',
          reviewer: 'System Auto',
        },
        {
          type: 'income_verified',
          title: '2. Verifikasi Pendapatan & Debt-to-Income (DSR)',
          status: 'PASSED',
          statusBg: '#d1fae5',
          statusColor: '#065f46',
          details: 'DSR 1.2% aman.',
          reviewer: 'System Auto',
        },
        {
          type: 'documents_complete',
          title: '3. Kelengkapan Berkas & Legalitas',
          status: 'PASSED',
          statusBg: '#d1fae5',
          statusColor: '#065f46',
          details: 'Semua berkas lengkap.',
          reviewer: 'System Auto',
        },
        {
          type: 'medical_required',
          title: '4. Skrining Medis & Risk Threshold',
          status: 'NOT_NEEDED',
          statusBg: '#f1f5f9',
          statusColor: '#64748b',
          details: 'Tanpa tes lab.',
          reviewer: 'System Auto',
        },
      ],
    },
    {
      id: '#APP-2026-8824',
      applicantName: 'Rina Setyowati',
      applicantAge: 45,
      nik: '3374018809790006',
      productName: 'Secure Life Plus',
      productSlug: 'secure-life-plus',
      sumAssured: 'Rp 750.000.000',
      status: 'rejected',
      statusLabel: 'Ditolak',
      riskScore: 64,
      riskGrade: 'C',
      slaRemainingMinutes: 0,
      slaText: 'Ditutup',
      slaColor: '#ef4444',
      monthlyPremium: 'Rp 890.000',
      tenorYears: 15,
      paymentMethod: 'VA BCA',
      autoDebet: false,
      beneficiaryName: 'Bagus Setyawan (Anak)',
      beneficiaryRelation: 'Anak',
      beneficiarySharePct: 100,
      passedChecksCount: 1,
      totalChecksCount: 4,
      internalAuditNotes:
        'Pengajuan ditolak karena riwayat klaim fraud di database OJK SLIK dan ketidaksesuaian laporan lab medis.',
      auditSignature:
        'Ditolak oleh: Bayu Pratama (Lead Underwriter) • Kode OJK: REJ_OJK_RISK_EXCEEDED',
      auditHash:
        'sha256:4d56c1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9074',
      reviewChecks: [
        {
          type: 'identity_verified',
          title: '1. Verifikasi Identitas (Dukcapil OCR)',
          status: 'PASSED',
          statusBg: '#d1fae5',
          statusColor: '#065f46',
          details: 'Identitas cocok.',
          reviewer: 'System OCR',
        },
        {
          type: 'income_verified',
          title: '2. Verifikasi Pendapatan & Debt-to-Income (DSR)',
          status: 'REJECTED',
          statusBg: '#fee2e2',
          statusColor: '#991b1b',
          details: 'Rasio hutang melampaui toleransi aktuaris (> 40%).',
          reviewer: 'Bayu Pratama (Underwriter)',
        },
        {
          type: 'documents_complete',
          title: '3. Kelengkapan Berkas & Legalitas',
          status: 'REJECTED',
          statusBg: '#fee2e2',
          statusColor: '#991b1b',
          details: 'Dokumen slip gaji terindikasi manipulasi.',
          reviewer: 'Document Fraud Analysis',
        },
        {
          type: 'medical_required',
          title: '4. Skrining Medis & Risk Threshold',
          status: 'NOT_NEEDED',
          statusBg: '#f1f5f9',
          statusColor: '#64748b',
          details: 'Aplikasi ditolak sebelum skrining medis.',
          reviewer: 'Auto-Rule Engine',
        },
      ],
    },
  ];

  async findAll(params?: ApplicationFilterParams): Promise<UnderwritingDossier[]> {
    let list = structuredClone(this.dossiers);

    if (params?.status && params.status !== 'all') {
      if (params.status === 'review_needed') {
        list = list.filter((d) => d.status === 'under_review');
      } else {
        list = list.filter((d) => d.status === params.status);
      }
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (d) =>
          d.applicantName.toLowerCase().includes(q) ||
          d.nik.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q)
      );
    }

    if (params?.product && params.product !== 'all') {
      list = list.filter((d) => d.productSlug === params.product);
    }

    return Promise.resolve(list);
  }

  async findById(id: string): Promise<UnderwritingDossier | null> {
    const item = this.dossiers.find((d) => d.id === id);
    if (!item) return Promise.resolve(null);
    return Promise.resolve(structuredClone(item));
  }

  async updateReviewCheck(
    id: string,
    pillarType: PillarType,
    status: PillarStatus,
    notes?: string
  ): Promise<UnderwritingDossier> {
    const item = this.dossiers.find((d) => d.id === id);
    if (!item) {
      throw new Error(`Application with id ${id} not found`);
    }

    const check = item.reviewChecks.find((c) => c.type === pillarType);
    if (check) {
      check.status = status;
      if (status === 'PASSED') {
        check.statusBg = '#d1fae5';
        check.statusColor = '#065f46';
      } else if (status === 'REJECTED' || status === 'FAILED') {
        check.statusBg = '#fee2e2';
        check.statusColor = '#991b1b';
      } else if (status === 'NOT_NEEDED' || status === 'WAIVED') {
        check.statusBg = '#f1f5f9';
        check.statusColor = '#64748b';
      } else {
        check.statusBg = '#fef3c7';
        check.statusColor = '#92400e';
      }

      if (notes) {
        check.details = `${check.details} [Manual Override: ${notes}]`;
      }
      check.reviewer = 'Diubah Manual oleh: Bayu Pratama (Lead Underwriter)';
    }

    // Recalculate passed checks
    item.passedChecksCount = item.reviewChecks.filter(
      (c) => c.status === 'PASSED' || c.status === 'NOT_NEEDED' || c.status === 'WAIVED'
    ).length;

    return Promise.resolve(structuredClone(item));
  }

  async updateStatus(
    id: string,
    newStatus: ApplicationStatus,
    reason?: string,
    notes?: string
  ): Promise<UnderwritingDossier> {
    const item = this.dossiers.find((d) => d.id === id);
    if (!item) {
      throw new Error(`Application with id ${id} not found`);
    }

    item.status = newStatus;
    if (newStatus === 'approved') {
      item.statusLabel = 'Disetujui';
      item.slaText = 'Selesai';
      item.slaColor = '#10b981';
      item.internalAuditNotes = `${item.internalAuditNotes}\n[Disetujui: Polis aktif diterbitkan. ${notes || ''}]`;
    } else if (newStatus === 'rejected') {
      item.statusLabel = 'Ditolak';
      item.slaText = 'Ditutup';
      item.slaColor = '#ef4444';
      item.internalAuditNotes = `${item.internalAuditNotes}\n[Ditolak: ${reason || ''}. ${notes || ''}]`;
    } else if (newStatus === 'rfi_requested') {
      item.statusLabel = 'RFI Terkirim';
      item.slaText = 'Menunggu Dokumen';
      item.slaColor = '#f59e0b';
      item.internalAuditNotes = `${item.internalAuditNotes}\n[Permintaan Dokumen Tambahan: ${reason || ''}. ${notes || ''}]`;
    } else if (newStatus === 'under_review') {
      item.statusLabel = 'Under Review';
      item.slaText = 'SLA: 14 min';
      item.slaColor = '#ef4444';
    }

    return Promise.resolve(structuredClone(item));
  }

  async saveInternalNotes(id: string, notes: string): Promise<UnderwritingDossier> {
    const item = this.dossiers.find((d) => d.id === id);
    if (!item) {
      throw new Error(`Application with id ${id} not found`);
    }

    item.internalAuditNotes = notes;
    item.auditHash = `sha256:${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    return Promise.resolve(structuredClone(item));
  }
}
