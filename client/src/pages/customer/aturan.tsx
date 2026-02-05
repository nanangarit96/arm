import { CheckCircle, AlertTriangle, DollarSign, Package, Clock, Shield, FileText, CreditCard, AlertCircle, Scale } from "lucide-react";
import { Card } from "@/components/ui/card";

const rules = [
  {
    id: "rule-1",
    title: "1. Penyerahan Pesanan & Larangan Aktivitas Ilegal",
    icon: Package,
    items: [
      { type: "success", text: "Setiap pesanan akan dikirimkan langsung kepada pelanggan sesuai data yang terdaftar." },
      { type: "success", text: "Bonus VIP akan otomatis ditambahkan ke akun pengguna dan dapat ditarik sesuai dengan arahan pembimbing resmi." },
      { type: "warning", text: "Dilarang keras melakukan aktivitas ilegal, termasuk namun tidak terbatas pada pencucian uang, penyalahgunaan dana, atau penarikan untuk tujuan yang tidak sah setelah pesanan dikirim." },
      { type: "warning", text: "Pengguna wajib menyelesaikan seluruh pekerjaan setelah data pesanan dimulai. Pesanan yang sedang berlangsung tidak dapat dibatalkan. Pelanggaran terhadap ketentuan ini dapat mengakibatkan pembatasan atau penangguhan hak penarikan dana." },
    ],
  },
  {
    id: "rule-2",
    title: "2. Penentuan Komisi",
    icon: DollarSign,
    items: [
      { type: "info", text: "Besaran komisi ditetapkan berdasarkan jenis pesanan atau tugas yang dipilih pengguna." },
      { type: "info", text: "Sistem akan mendistribusikan tugas secara otomatis dan acak." },
    ],
  },
  {
    id: "rule-3",
    title: "3. Perubahan Harga Pesanan",
    icon: Clock,
    items: [
      { type: "info", text: "Harga pesanan dapat disesuaikan sewaktu-waktu guna meningkatkan peringkat penjualan dan memperbesar peluang memperoleh komisi optimal." },
    ],
  },
  {
    id: "rule-4",
    title: "4. Proses Penarikan Dana",
    icon: CreditCard,
    items: [
      { type: "success", text: "Waktu pencairan dana ke rekening pengguna berkisar antara 3–15 menit, tergantung pada antrean proses." },
      { type: "info", text: "Dalam kondisi tertentu, pencairan dapat memakan waktu hingga 24 jam, menyesuaikan kebijakan dan kecepatan sistem perbankan." },
    ],
  },
  {
    id: "rule-5",
    title: "5. Pemeriksaan Saldo Sebelum Penarikan",
    icon: Shield,
    items: [
      { type: "success", text: "Pastikan saldo komisi telah masuk sebelum melakukan permintaan penarikan." },
      { type: "warning", text: "Dilarang melakukan permintaan penarikan berulang kali dalam waktu singkat dengan menekan tombol penarikan berkali-kali." },
    ],
  },
  {
    id: "rule-6",
    title: "6. Kewajiban Penyelesaian Tugas",
    icon: FileText,
    items: [
      { type: "warning", text: "Setiap pesanan wajib diselesaikan sesuai dengan ketentuan sistem." },
      { type: "warning", text: "Jika pesanan hilang akibat kesalahan pribadi, pengguna diwajibkan melakukan proses verifikasi ulang, dan segala akibatnya menjadi tanggung jawab pengguna." },
    ],
  },
  {
    id: "rule-7",
    title: "7. Penerimaan Instruksi Penarikan",
    icon: CheckCircle,
    items: [
      { type: "info", text: "Setelah menerima detail tugas, pengguna dianggap telah membaca, memahami, dan menyetujui seluruh prosedur penarikan dana." },
      { type: "warning", text: "Penarikan dana hanya dapat diproses setelah seluruh pesanan diselesaikan." },
    ],
  },
  {
    id: "rule-8",
    title: "8. Batas Harian Tugas Pesanan",
    icon: Clock,
    items: [
      { type: "info", text: "Setiap pengguna memiliki batas maksimal 5 tugas per hari." },
      { type: "success", text: "Sisa tugas dapat dilanjutkan kembali pada hari berikutnya setelah batas harian tercapai." },
    ],
  },
  {
    id: "rule-9",
    title: "9. Pengurangan Nilai Kredit",
    icon: AlertCircle,
    items: [
      { type: "warning", text: "Apabila ditemukan pelanggaran terhadap peraturan selama pelaksanaan pesanan, sistem akan secara otomatis melakukan pengurangan nilai kredit akun pengguna." },
    ],
  },
  {
    id: "rule-10",
    title: "10. Kewajiban Pajak",
    icon: Scale,
    items: [
      { type: "info", text: "Apabila penghasilan pengguna melebihi batas tertentu, maka pengguna wajib memenuhi kewajiban perpajakan sesuai dengan ketentuan hukum yang berlaku di Republik Indonesia." },
    ],
  },
];

export default function CustomerAturan() {
  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="text-aturan-title">Aturan & Panduan</h1>
        <span className="text-sm text-muted-foreground" data-testid="text-aturan-version">Versi 2.0</span>
      </div>
      <div className="space-y-6">
        {rules.map((section) => (
          <Card key={section.id} className="p-5" data-testid={`section-${section.id}`}>
            <div className="flex items-center gap-3 mb-4">
              <section.icon className="h-6 w-6 text-primary" />
              <h2 className="font-semibold text-lg" data-testid={`title-${section.id}`}>{section.title}</h2>
            </div>
            <div className="space-y-3">
              {section.items.map((item, itemIdx) => (
                <div key={itemIdx} className="flex items-start gap-3" data-testid={`item-${section.id}-${itemIdx}`}>
                  {item.type === "success" && (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                  )}
                  {item.type === "warning" && (
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                  )}
                  {item.type === "info" && (
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                  )}
                  <p className={`text-sm ${
                    item.type === "warning" 
                      ? "text-amber-700 dark:text-amber-400" 
                      : "text-muted-foreground"
                  }`}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <div className="text-center text-xs text-muted-foreground pt-4 border-t space-y-1">
        <p>Copyright © 2026 Giorgio Armani S.p.A. - All Rights Reserved</p>
      </div>
    </div>
  );
}
