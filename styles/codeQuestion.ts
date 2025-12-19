import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1A233A",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
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
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  primaryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  card: {
    backgroundColor: "#ffffff",
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  cardText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#374151",
    fontWeight: "400",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3b82f6",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  inputCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  codeBlock: {
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 12,
    lineHeight: 21,
    fontWeight: "400",
  },
  helperText: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 8,
    fontStyle: "italic",
    lineHeight: 18,
  },

  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#1f2937",
    fontFamily: "monospace",
    padding: 12,
    borderWidth: 0,
    lineHeight: 22,
    fontWeight: "400",
  },

  // Submit button styles
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
    fontSize: 14,
    fontWeight: "600",
  },

  // Modal styles
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
    position: "relative",
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
    backgroundColor: "#D4E3F7",
    borderRadius: 16,
    padding: 24,
    paddingTop: 20,
  },
  closeLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  closeIcon: {
    fontSize: 18,
    color: "#ef4444",
    fontWeight: "700",
  },
  closeText: {
    fontSize: 14,
    color: "#ef4444",
    fontWeight: "600",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12,
    lineHeight: 24,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 16,
    textAlign: "justify",
  },
  nextButtonRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  nextButton: {
    backgroundColor: "transparent",
    borderColor: "#286292",
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    color: "#286292",
    fontWeight: "600",
    fontSize: 14,
  },
});
