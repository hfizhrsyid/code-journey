import { StyleSheet } from "react-native";

const COLORS = {
  background: "#1A232E", 
  card: "#FFFFFF", 
  primaryButton: "#4A90E2", 
  text: "#FFFFFF", 
  headerText: "#FFFFFF", 
  secondaryButton: "transparent", 
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
    paddingBottom: 20, 
  },

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
    outlineColor: 'transparent',
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
    color: "#FFFFFF", 
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
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    minHeight: 180,
    marginTop: 0,
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
    fontFamily: "monospace",
    lineHeight: 20,
  },
});