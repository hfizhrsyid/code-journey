import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: '#286292',
    height: 63,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },

  homeButton: {
    backgroundColor: '#286292',
    padding: 15,
    borderRadius: 40,
    borderColor: "#1A233A",
    borderWidth: 5,
    marginBottom: 60,
  },

  imagePath: {
    width: 25,
    height: 22,
  },

  imageProfile: {
    width: 23,
    height: 27,
  },

  imageDashboard: {
    width: 30,
    height: 30,
  },
});