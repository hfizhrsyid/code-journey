import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A233A",
    padding: 20,
    paddingBottom: 70,
  },

  brand: {
    padding: 30,
    textAlign: "center",
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },

  card: {
    backgroundColor: '#B0C4DE',
    borderRadius: 10,
    padding: 15,
    paddingTop: 25,
    paddingBottom: 25,
    marginBottom: 15,
  },

  cardTitle: {
    color: '#1A233A',
    fontSize: 16,
    fontWeight: '600',
  },

  bottomNav: {
    position: 'absolute',
    bottom: 1.2,
    left: 0,
    right: 0,
  },
});