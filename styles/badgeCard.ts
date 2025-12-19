import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  badgeItem: {
    width: "31%",
    aspectRatio: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  badgeItemLocked: {
    backgroundColor: "#E8E8E8",
    opacity: 0.6,
  },

  badgeImageContainer: {
    position: "relative",
    width: 60,
    height: 60,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  badgeImage: {
    width: 60,
    height: 60,
    resizeMode: "contain",
  },

  lockOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },

  lockIcon: {
    fontSize: 24,
  },

  badgeName: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    color: "#1A233A",
  },

  earnedDate: {
    fontSize: 9,
    color: "#999",
    marginTop: 4,
  },
});
