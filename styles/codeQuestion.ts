import { StyleSheet } from "react-native";

const COLORS = {
  background: "#1A233A",
  card: "#FFFFFF",
  primaryButton: "#3b82f6",
  successButton: "#10b981",
  text: "#374151",
  headerText: "#FFFFFF",
  secondaryButton: "transparent",
  border: "#e5e7eb",
  codeText: "#1f2937",
  codeBg: "#f3f4f6",
  placeholder: "#9ca3af",
};

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 30,
    paddingTop: 50,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.headerText,
    letterSpacing: -0.5,
  },
  primaryButton: {
    backgroundColor: COLORS.primaryButton,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
    fontWeight: "400",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primaryButton,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  inputCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  codeBlock: {
    backgroundColor: COLORS.codeBg,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 21,
    fontWeight: "400",
  },
  helperText: {
    fontSize: 13,
    color: COLORS.placeholder,
    marginTop: 8,
    fontStyle: "italic",
    lineHeight: 18,
  },

  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.codeText,
    fontFamily: "monospace",
    padding: 12,
    borderWidth: 0,
    lineHeight: 22,
    fontWeight: "400",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  runButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
    backgroundColor: COLORS.successButton,
    flex: 1,
    marginRight: 8,
  },
  nextButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
    backgroundColor: COLORS.primaryButton,
    flex: 1,
    marginLeft: 8,
  },
  footerButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  runButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  
  // Submit button styles (matching completionQuestion)
  submitButtonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
    alignItems: "flex-end",
  },
  submitButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#ffffff",
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  submitText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // Modal styles (matching completionQuestion)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalPositionWrapper: {
    width: "100%",
    paddingBottom: 32,
  },
  modalEmojiImage: {
    width: 70,
    height: 70,
    position: "absolute",
    right: 8,
    top: -36,
    zIndex: 12,
    resizeMode: "contain",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    paddingTop: 30,
    position: "relative",
  },
  closeLabel: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },
  closeIcon: {
    fontSize: 18,
    color: "#8898AA",
    marginRight: 4,
    fontWeight: "700",
  },
  closeText: {
    fontSize: 14,
    color: "#8898AA",
    fontWeight: "500",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A233A",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "400",
  },
  nextButtonRow: {
    marginTop: 20,
    alignItems: "center",
  },

  statusContainerWrapper: {
    minHeight: 40,
    backgroundColor: "transparent",
    /* naikkan container supaya pill overlap ke outputCard */
    marginLeft: 24,
    marginRight: 24,
    flexDirection: "row",
  },
  statusContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    paddingLeft: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    /* beri radius atas dan flat bawah supaya menyatu dengan card */
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: "#263043",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginRight: 4,
  },
  icon: {
    fontSize: 14,
    fontWeight: "bold",
  },

  /* outputCard: tarik ke atas sedikit supaya pill tampak menempel */
  outputCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    paddingTop: 28, // beri ruang di dalam supaya teks tidak tertutup pill
    minHeight: 180,
    marginTop: -10, // tarik ke atas supaya pill overlap
    borderTopWidth: 1,
    borderTopColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  outputText: {
    color: "#999",
    fontSize: 14,
    // fontFamily: "monospace",
    lineHeight: 20,
  },
});
