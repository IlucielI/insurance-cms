import {
  IKnowledgeRepository,
  KnowledgeDocument,
  KnowledgeCategory,
  KnowledgeMetrics,
  CreateKnowledgeDocDTO,
  UpdateKnowledgeDocDTO,
  SimulatedChatResponse,
  KnowledgeSourceCitation,
} from './knowledge.repository.interface';

export class KnowledgeMockRepository implements IKnowledgeRepository {
  private documents: KnowledgeDocument[] = [
    {
      id: 'doc_underwriting_up_medical',
      title: 'Pedoman Batas Uang Pertanggungan & Medical Check-Up',
      slug: 'pedoman-batas-up-dan-medical-check-up',
      category: 'underwriting',
      summary:
        'Ketentuan limit uang pertanggungan tanpa pemeriksaan medis (Non-Medical Limit) berdasarkan kelompok usia nasabah dan riwayat kesehatan.',
      content: `1. Batas Non-Medical Limit (Tanpa MCU):
- Usia 18 - 35 tahun: Uang Pertanggungan (UP) hingga Rp 500.000.000 dapat disetujui otomatis melalui deklarasi kesehatan digital.
- Usia 36 - 45 tahun: Batas Non-Medical Limit adalah Rp 350.000.000. Pengajuan di atas Rp 350.000.000 mewajibkan Tele-Interview Underwriting.
- Usia 46 - 60 tahun: Batas Non-Medical Limit adalah Rp 200.000.000. Pengajuan di atas Rp 200.000.000 wajib melakukan tes darah rutin dan EKG.

2. Indikasi Pemeriksaan Tambahan:
- BMI (Indeks Massa Tubuh) > 30 atau < 16.
- Riwayat hipertensi dengan tekanan darah sistolik > 140 mmHg atau diastolik > 90 mmHg.
- Riwayat keluarga memiliki penyakit jantung atau diabetes pada usia dini (< 50 tahun).`,
      tags: ['underwriting', 'medical-checkup', 'uang-pertanggungan', 'non-medical-limit'],
      chunkCount: 16,
      status: 'indexed',
      lastSyncedAt: '2026-09-05T04:30:00Z',
      updatedAt: '2026-09-05T04:30:00Z',
    },
    {
      id: 'doc_critical_illness_waiting',
      title: 'Klausul Pengecualian & Waiting Period Penyakit Kritis',
      slug: 'klausul-pengecualian-dan-waiting-period-penyakit-kritis',
      category: 'product',
      summary:
        'Masa tunggu 90 hari pertama dan ketentuan pre-existing conditions untuk perlindungan penyakit kritis stadium awal dan lanjutan.',
      content: `1. Masa Tunggu (Waiting Period):
- Berlaku masa tunggu standar selama 90 (sembilan puluh) hari kalender terhitung sejak tanggal penerbitan polis resmi atau pemulihan polis.
- Gejala atau diagnosis penyakit kritis yang muncul dalam kurun waktu 90 hari pertama tidak dapat dibayarkan santunannya dan premi dikembalikan dikurangi biaya administrasi.

2. Pre-Existing Conditions:
- Penyakit kritis atau kondisi medis yang tanda atau gejalanya telah diketahui tertanggung sebelum tanggal berlakunya polis tidak ditanggung.
- Deklarasi jujur pada surat permohonan asuransi mutlak diperlukan untuk menghindari pembatalan polis sepihak.`,
      tags: ['penyakit-kritis', 'waiting-period', 'exclusions', 'pre-existing'],
      chunkCount: 12,
      status: 'indexed',
      lastSyncedAt: '2026-09-04T10:15:00Z',
      updatedAt: '2026-09-04T10:15:00Z',
    },
    {
      id: 'doc_dukcapil_biometric_ocr',
      title: 'Prosedur Verifikasi Dokumen Dukcapil & Biometrik',
      slug: 'prosedur-verifikasi-dokumen-dukcapil-dan-biometrik',
      category: 'compliance',
      summary:
        'Standar Operasional Prosedur (SOP) pencocokan NIK, data kependudukan Dukcapil, dan verifikasi biometrik liveness nasabah.',
      content: `1. Verifikasi NIK & Data Kependudukan:
- NIK 16 digit divalidasi ke database Ditjen Dukcapil Kemendagri secara online via Core API.
- Parameter wajib cocok: Nama lengkap sesuai KTP, Tanggal lahir, Alamat domisili provinsi dan kota/kabupaten.
- Toleransi ketidakcocokan karakter nama maksimal 2 karakter (typo) untuk review manual underwriter.

2. Verifikasi Wajah & Biometrik (Liveness Detection):
- Skor kemiripan biometrik (Facial Match Score) minimal 80%.
- Liveness check wajib mendeteksi kedipan mata dan rotasi kepala untuk mencegah spoofing foto atau topeng buatan.`,
      tags: ['dukcapil', 'nik', 'biometrik', 'ocr', 'compliance'],
      chunkCount: 14,
      status: 'indexed',
      lastSyncedAt: '2026-09-03T11:00:00Z',
      updatedAt: '2026-09-03T11:00:00Z',
    },
    {
      id: 'doc_claim_cashless_inpatient',
      title: 'Alur Klaim Rawat Inap Cashless & Dokumen Rumah Sakit',
      slug: 'alur-klaim-rawat-inap-cashless-dan-dokumen-rumah-sakit',
      category: 'claim_faq',
      summary:
        'Panduan nasabah dan rumah sakit rekanan mengenai penjaminan rawat inap tanpa uang tunai (cashless) dan syarat reimbursement.',
      content: `1. Penjaminan Awal (Pre-Admission):
- Tunjukkan kartu digital Bayu Insurance atau sebutkan NIK kepada petugas admisi rumah sakit rekanan AdMedika.
- Rumah sakit menerbitkan Surat Jaminan Awal (SJA) dalam waktu maksimal 30 menit.

2. Penjaminan Akhir & Pemulangan (Discharge):
- Resume medis dan rincian biaya tagihan dikirimkan oleh pihak RS ke Third Party Administrator (TPA).
- Surat Jaminan Akhir diterbitkan, nasabah hanya membayar biaya yang tidak dijamin (excess/selisih kamar).`,
      tags: ['klaim', 'cashless', 'rawat-inap', 'rumah-sakit', 'admedika'],
      chunkCount: 18,
      status: 'indexed',
      lastSyncedAt: '2026-09-02T16:00:00Z',
      updatedAt: '2026-09-02T16:00:00Z',
    },
    {
      id: 'doc_vehicle_allrisk_workshop',
      title: 'Ketentuan Bengkel Rekanan & Kerugian All-Risk Auto Shield',
      slug: 'ketentuan-bengkel-rekanan-dan-kerugian-allrisk-auto-shield',
      category: 'product',
      summary:
        'Prosedur pelaporan klaim kecelakaan mobil, bengkel resmi authorized, dan ketentuan biaya risiko sendiri (Own Risk).',
      content: `1. Batas Waktu Pelaporan Kecelakaan:
- Insiden kecelakaan, tabrakan, atau pencurian wajib dilaporkan selambat-lambatnya 5 x 24 jam kalender sejak kejadian.
- Laporan disertai foto 4 sisi kendaraan, SIM pengemudi aktif, dan STNK kendaraan.

2. Risiko Sendiri (Own Risk / Deductible):
- Biaya risiko sendiri yang ditanggung tertanggung adalah Rp 300.000 per kejadian klaim kecelakaan sebagian (partial loss).
- Kerugian total (Total Loss Only / TLO) di atas 75% harga pasar tidak dikenakan biaya risiko sendiri.`,
      tags: ['auto-shield', 'kendaraan', 'bengkel', 'own-risk', 'klaim-mobil'],
      chunkCount: 15,
      status: 'indexed',
      lastSyncedAt: '2026-09-01T09:30:00Z',
      updatedAt: '2026-09-01T09:30:00Z',
    },
    {
      id: 'doc_aml_pep_screening',
      title: 'Kepatuhan Anti-Pencucian Uang (AML) & Screening PEP',
      slug: 'kepatuhan-anti-pencucian-uang-aml-dan-screening-pep',
      category: 'compliance',
      summary:
        'Kebijakan verifikasi profil nasabah berisiko tinggi, Politically Exposed Persons (PEP), dan pelaporan transaksi mencurigakan PPATK.',
      content: `1. Definisi & Kategori PEP (Politically Exposed Persons):
- Pejabat negara, anggota parlemen, kepala daerah, perwira tinggi militer/polisi, serta keluarga inti garis lurus.
- Setiap pengajuan aplikasi dari nasabah berstatus PEP wajib melalui proses Enhanced Due Diligence (EDD) oleh Compliance Officer.

2. Batasan Transaksi Tunai & Sumber Dana:
- Pembayaran premi menggunakan uang tunai di atas Rp 100.000.000 wajib menyertakan formulir deklarasi sumber dana (Source of Wealth / Source of Funds).
- Transaksi anomali dilaporkan melalui Laporan Transaksi Keuangan Mencurigakan (LTKM) ke PPATK.`,
      tags: ['aml', 'pep', 'compliance', 'ppatk', 'enhanced-due-diligence'],
      chunkCount: 20,
      status: 'indexed',
      lastSyncedAt: '2026-08-30T14:00:00Z',
      updatedAt: '2026-08-30T14:00:00Z',
    },
  ];

  async getDocuments(category?: KnowledgeCategory, search?: string): Promise<KnowledgeDocument[]> {
    let result = this.documents;
    if (category) {
      result = result.filter((d) => d.category === category);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.summary.toLowerCase().includes(q) ||
          d.content.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return Promise.resolve(structuredClone(result));
  }

  async getDocumentById(id: string): Promise<KnowledgeDocument | null> {
    const doc = this.documents.find((d) => d.id === id);
    if (!doc) return Promise.resolve(null);
    return Promise.resolve(structuredClone(doc));
  }

  async getDocumentBySlug(slug: string): Promise<KnowledgeDocument | null> {
    const doc = this.documents.find((d) => d.slug === slug);
    if (!doc) return Promise.resolve(null);
    return Promise.resolve(structuredClone(doc));
  }

  async createDocument(dto: CreateKnowledgeDocDTO): Promise<KnowledgeDocument> {
    const slug =
      dto.slug?.trim() ||
      dto.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const existing = this.documents.find((d) => d.slug === slug);
    if (existing) {
      throw new Error(`Dokumen dengan slug "${slug}" sudah ada.`);
    }

    const id = `doc_${slug.replace(/-/g, '_')}`;
    const now = new Date().toISOString();
    // Estimate chunks: roughly 1 chunk per 150 characters
    const estimatedChunks = Math.max(2, Math.ceil(dto.content.length / 150));

    const newDoc: KnowledgeDocument = {
      id,
      title: dto.title,
      slug,
      category: dto.category,
      summary: dto.summary,
      content: dto.content,
      tags: dto.tags.length > 0 ? dto.tags : ['general'],
      chunkCount: estimatedChunks,
      status: dto.status ?? 'indexed',
      lastSyncedAt: now,
      updatedAt: now,
    };

    this.documents.push(newDoc);
    return Promise.resolve(structuredClone(newDoc));
  }

  async updateDocument(id: string, dto: UpdateKnowledgeDocDTO): Promise<KnowledgeDocument> {
    const index = this.documents.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error(`Dokumen dengan ID "${id}" tidak ditemukan.`);
    }

    if (dto.slug) {
      const conflict = this.documents.find((d) => d.slug === dto.slug && d.id !== id);
      if (conflict) {
        throw new Error(`Dokumen dengan slug "${dto.slug}" sudah digunakan.`);
      }
    }

    const current = this.documents[index];
    const now = new Date().toISOString();
    const updatedContent = dto.content !== undefined ? dto.content : current.content;
    const estimatedChunks = Math.max(2, Math.ceil(updatedContent.length / 150));

    const updated: KnowledgeDocument = {
      ...current,
      ...dto,
      chunkCount: estimatedChunks,
      updatedAt: now,
    };

    this.documents[index] = updated;
    return Promise.resolve(structuredClone(updated));
  }

  async deleteDocument(id: string): Promise<boolean> {
    const index = this.documents.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error(`Dokumen dengan ID "${id}" tidak ditemukan.`);
    }
    this.documents.splice(index, 1);
    return Promise.resolve(true);
  }

  async reindexDocument(id: string): Promise<KnowledgeDocument> {
    const doc = this.documents.find((d) => d.id === id);
    if (!doc) {
      throw new Error(`Dokumen dengan ID "${id}" tidak ditemukan.`);
    }
    doc.status = 'indexed';
    doc.lastSyncedAt = new Date().toISOString();
    doc.updatedAt = new Date().toISOString();
    return Promise.resolve(structuredClone(doc));
  }

  async getMetrics(): Promise<KnowledgeMetrics> {
    const totalDocuments = this.documents.length;
    const indexedDocuments = this.documents.filter((d) => d.status === 'indexed').length;
    const syncingDocuments = this.documents.filter((d) => d.status === 'syncing').length;
    const totalChunks = this.documents.reduce((acc, curr) => acc + curr.chunkCount, 0);

    const indexHealthPercent =
      totalDocuments > 0 ? Number(((indexedDocuments / totalDocuments) * 100).toFixed(1)) : 100;

    return Promise.resolve({
      totalDocuments,
      indexedDocuments,
      syncingDocuments,
      totalChunks,
      vectorDimension: 1024,
      modelName: 'text-embedding-004 / Core API v1.2',
      avgLatencyMs: 142,
      indexHealthPercent,
    });
  }

  async simulateRagChat(
    query: string,
    categoryFilter?: KnowledgeCategory
  ): Promise<SimulatedChatResponse> {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) {
      throw new Error('Pertanyaan prompt tidak boleh kosong.');
    }

    let candidates = this.documents.filter((d) => d.status === 'indexed');
    if (categoryFilter) {
      candidates = candidates.filter((d) => d.category === categoryFilter);
    }

    // Rank candidates by keyword matching
    const scoredDocs = candidates
      .map((doc) => {
        let score = 0.55; // baseline
        const titleMatch = cleanQuery
          .split(' ')
          .filter((w) => w.length > 2 && doc.title.toLowerCase().includes(w));
        const contentMatch = cleanQuery
          .split(' ')
          .filter((w) => w.length > 2 && doc.content.toLowerCase().includes(w));
        const tagMatch = doc.tags.filter((t) => cleanQuery.includes(t.toLowerCase()));

        score += titleMatch.length * 0.15;
        score += contentMatch.length * 0.08;
        score += tagMatch.length * 0.12;

        if (score > 0.98) score = 0.98;
        return { doc, score: Number(score.toFixed(2)) };
      })
      .sort((a, b) => b.score - a.score);

    const topMatches = scoredDocs.slice(0, 3);
    const sources: KnowledgeSourceCitation[] = topMatches.map(({ doc, score }) => ({
      id: doc.id,
      title: doc.title,
      sourceType: doc.category,
      score,
      excerpt: doc.summary,
    }));

    // Synthesize contextual AI answer based on top match
    const primary = topMatches[0]?.doc;
    let answer = `Berdasarkan basis pengetahuan polis dan underwriting Core API, `;

    if (primary) {
      answer += `untuk pertanyaan terkait "${query}":\n\n${primary.summary}\n\nKetentuan spesifik:\n`;
      // pick first 2 bullet points or sentences from content
      const points = primary.content
        .split('\n')
        .filter((l) => l.trim().length > 0)
        .slice(0, 4)
        .join('\n');
      answer += `${points}\n\nSilakan verifikasi berkas pendukung pada Underwriting Workbench bila diperlukan otorisasi manual.`;
    } else {
      answer += `informasi tidak ditemukan pada indeks knowledge base aktif. Disarankan untuk menambahkan dokumen SOP atau melakukan re-index data embedding.`;
    }

    return Promise.resolve({
      answer,
      sources,
      latencyMs: Math.floor(Math.random() * 80) + 110, // ~110-190ms
    });
  }
}
