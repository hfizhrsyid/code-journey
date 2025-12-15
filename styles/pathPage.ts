import { SCREEN_W, radius, spacing } from "@/app/main/constants";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#1A233A",
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
    borderColor: "#286292",
    borderWidth: 3,
    backgroundColor: "#B0C4DE",
    alignItems: "center",
    justifyContent: "center",
  },

  nodeNumber: {
    color: "#286292",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
  },

  nodeDone: {
    backgroundColor: "#B0C4DE",
  },

  nodeLocked: {
    backgroundColor: "#B0C4DE",
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
    width: 120,
    height: 100,
  },

  imgRight: {
    width: 110,
    height: 110,
  },

  emoji: { fontSize: 36 },
  
  caption: { 
    color: "#d9eefc", 
    marginTop: 6, 
    fontSize: 13, 
    fontWeight: "500",
    letterSpacing: 0.2,
  },
});

