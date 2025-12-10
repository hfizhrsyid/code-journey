import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A233A",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 20,
  },

  headerImage: {
    width: 120,
    height: 120,
  },

  headerTitle: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginRight: 10,
  },

  card: {
    marginTop: 30,
    backgroundColor: "#286292",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    paddingBottom: 35,
    marginBottom: 100
  },

  name: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
  },

  smallText: {
    color: "#D7E6F7",
    fontSize: 14,
    marginTop: 2,
  },

  circleContainer: {
    justifyContent: "center",
    alignItems: "center",
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 25,
  },

  descText: {
    marginTop: 6,
    color: "#FFFFFF",
    opacity: 0.85,
    marginBottom: 10,
  },

  badge: {
    backgroundColor: "#B0C4DE",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 10,
  },

  badgeText: {
    color: "#1A233A",
    fontWeight: "bold",
  },

  progressRow: {
    marginTop: 15,
  },

  progressText: {
    color: "#FFFFFF",
    marginBottom: 5,
  },

  progressBarBg: {
    width: "100%",
    height: 8,
    backgroundColor: "#406A96",
    borderRadius: 10,
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    backgroundColor: "#FFFFFF",
  },

  progressValue: {
    color: "#FFFFFF",
    marginTop: 4,
  },

  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },

  outlineButton: {
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 9,
    width: "35%",
    alignItems: "center",
  },

  outlineText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
});
