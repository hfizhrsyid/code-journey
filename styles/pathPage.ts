import { SCREEN_W, radius, spacing } from "@/app/main/constants";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0f2130",
  },

  container: {
    flex: 1,
  },
  
  header: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginVertical: 10,
  },

  content: {
    flex: 1, 
    paddingHorizontal: 10
  },

  svgWrapper: {
    left: 0,
    right: 0,
    top: 40,
    zIndex: 0,
  },

  row: {
    height: spacing,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  side: {
    width: SCREEN_W * 0.36,
    alignItems: "center",
    justifyContent: "center",
  },

  imgSide: {},

  node: {
    width: radius * 2,
    height: radius * 2,
    borderRadius: radius,
    backgroundColor: "#375b7a",
    alignItems: "center",
    justifyContent: "center",
  },

  nodeNumber: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  nodeDone: {
    backgroundColor: "#4CAF50",
  },

  nodeLocked: {
    backgroundColor: "#607D8B",
  },

  cardImage: {
    width: 110,
    height: 110,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },

  imgLeft: {
    width: 145,
    height: 145,
  },

  imgRight: {
    width: 120,
    height: 120,
  },

  emoji: { fontSize: 36 },
  
  caption: { color: "#d9eefc", marginTop: 6, fontSize: 12 },
});

