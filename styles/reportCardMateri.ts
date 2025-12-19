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
    marginTop: 50,
    paddingHorizontal: 20,
    marginBottom: 30,
  },

  headerImage: {
    width: 100,
    height: 100,
  },

  headerTitle: {
    fontSize: 32,
    color: "#FFFFFF",
    fontWeight: "700",
    marginRight: 10,
  },

  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    paddingBottom: 30,
    marginBottom: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },

  section: {
    marginBottom: 24,
  },

  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#286292",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 12,
  },

  // SECTION 1: Mingyuuuu
  accuracyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  accuracyLeft: {
    flex: 1,
  },

  labelSmall: {
    fontSize: 12,
    color: "#286292",
    fontWeight: "500",
    marginTop: 8,
  },

  percentageText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#286292",
    marginBottom: 12,
  },

  timeText: {
    fontSize: 12,
    color: "#666666",
  },

  circleContainer: {
    justifyContent: "center",
    alignItems: "center",
  },

  // SECTION 2: Hasil
  resultMessage: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 20,
    marginBottom: 16,
  },

  badgeContainer: {
    backgroundColor: "#D7E6F7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
  },

  badgeText: {
    color: "#286292",
    fontWeight: "600",
    fontSize: 12,
  },

  // SECTION 3: Rekapitulasi
  recapText: {
    fontSize: 13,
    color: "#555555",
    lineHeight: 20,
    marginBottom: 16,
  },

  divider: {
    height: 1,
    backgroundColor: "#E8E8E8",
    marginVertical: 16,
  },

  // BUTTON
  nextLevelButton: {
    backgroundColor: "#286292",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },

  nextLevelText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
