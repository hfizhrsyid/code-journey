import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A233A",
    justifyContent: "center",
    alignItems: "center",
  },

  logo: {
    width: 250,
    resizeMode: "contain",
  },

  loadingContainer: {
    width: "70%",
    height: 8,
    backgroundColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 20,
  },

  loadingBar: {
    height: "100%",
    backgroundColor: "#B0C4DE",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#B0C4DE",
  },
});
