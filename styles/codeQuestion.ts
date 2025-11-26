import { StyleSheet } from "react-native";

const COLORS = {
  background: "#1A232E", // Biru tua gelap
  card: "#FFFFFF", // Putih untuk kartu
  primaryButton: "#4A90E2", // Biru terang untuk tombol utama
  text: "#FFFFFF", // Putih untuk teks umum
  headerText: "#FFFFFF", // Putih untuk teks header
  secondaryButton: "transparent", // Transparan untuk tombol Run/Selanjutnya
};

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1A232E",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 20, // Memberi ruang di bagian bawah ScrollView
  },

  // Header Styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.headerText,
  },
  primaryButton: {
    backgroundColor: COLORS.primaryButton,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  primaryButtonText: {
    color: COLORS.text,
    fontWeight: "600",
    fontSize: 14,
  },

  // Card Styles
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333", // Teks kartu lebih gelap
  },

  // Input Styles
  inputCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    minHeight: 200, // Memberi tinggi minimum untuk area input
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textInput: {
    flex: 1, // Mengisi ruang yang tersedia di dalam inputCard
    fontSize: 16,
    color: "#333",
    // Tidak perlu border karena sudah diatur oleh card
  },

  // Footer/Tombol Styles
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderTopColor: "rgba(255, 255, 255, 0.1)", // Garis pemisah opsional
    // position: 'absolute', // Bisa pakai absolute jika ingin selalu di bawah
    // bottom: 0,
    // left: 20,
    // right: 20,
  },
  runButton: {
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.text,
  },
  nextButton: {
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.text,
  },
  footerButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
  statusContainerWrapper: {
    minHeight: 40,
    backgroundColor: "transparent",
  },
  statusContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    paddingLeft: 5,
    marginTop: 10,
  },
  statusPill: {
    flexDirection: "row",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,

    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: "center",
  },
  statusText: {
    color: "#FFFFFF", // Teks tab tetap putih
    fontSize: 14,
    marginRight: 4,
  },
  icon: {
    fontSize: 14,
    fontWeight: "bold",
  },
  placeholderText: {
    color: "#999",
    fontStyle: "italic",
    fontSize: 14,
    paddingHorizontal: 20,
  },
  outputCard: {
    // DIKOREKSI: Warna latar belakang putih solid
    backgroundColor: "#FFFFFF",
    borderRadius: 10,

    // Hapus border radius atas agar menempel dengan tab

    padding: 15,
    minHeight: 180,

    // Margin horizontal disesuaikan

    // Menggeser ke atas agar menempel pada tab gelap
    marginTop: 0,

    // Tambahkan border atas tipis yang terlihat di screenshot
    borderTopWidth: 1,
    borderTopColor: "#FFFFFF", // Border putih agar menyatu

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  outputText: {
    // DIKOREKSI: Teks output menjadi gelap karena latar belakang putih
    color: "#999",
    fontSize: 14,
    fontFamily: "monospace",
    lineHeight: 20,
  },
});