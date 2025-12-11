import { StyleSheet } from "react-native";

const COLORS = {
  background: "#1A233A",
  card: "#FFFFFF",
  primaryButton: "#3b82f6",
  text: "#FFFFFF",
  headerText: "#FFFFFF",
  secondaryButton: "transparent",
};

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1A233A",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 30,
    paddingTop: 50,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.headerText,
  },
  primaryButton: {
    backgroundColor: COLORS.primaryButton,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: COLORS.text,
    fontWeight: "600",
    fontSize: 14,
  },

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
    color: "#333",
  },

  inputCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    minHeight: 200,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    borderWidth: 0,
    borderColor: "#fff",
    outlineColor: "transparent",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
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
