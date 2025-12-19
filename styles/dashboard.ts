import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A233A",
    padding: 20,
    paddingBottom: 70,
    paddingTop: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
  },

  brand: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },

  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#a5d8ff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },

  chatButtonText: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 13,
  },

  card: {
    backgroundColor: "#B0C4DE",
    borderRadius: 10,
    padding: 15,
    paddingTop: 25,
    paddingBottom: 25,
    marginBottom: 15,
  },

  cardTitle: {
    color: "#1A233A",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  bottomNav: {
    position: "absolute",
    bottom: 1.2,
    left: 0,
    right: 0,
  },
});
