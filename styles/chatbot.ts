import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 90,
    paddingTop: 50,
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 80,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    marginBottom: 4,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: "#e2e8f0",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    color: "#9fb3d9",
    fontSize: 13,
    lineHeight: 18,
  },
  listContent: {
    paddingBottom: 16,
    gap: 10,
  },
  bubble: {
    borderRadius: 14,
    padding: 12,
    maxWidth: "90%",
  },
  botBubble: {
    backgroundColor: "#12233d",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#1f2f4a",
    marginRight: 40,
    marginTop: 13,
  },
  userBubble: {
    backgroundColor: "#3fa0e9",
    alignSelf: "flex-end",
    borderWidth: 1,
    borderColor: "#1f7cc1",
    marginLeft: 40,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 19,
  },
  botText: {
    color: "#d9e6ff",
  },
  userText: {
    color: "#0b1729",
    fontWeight: "600",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#12233d",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1f2f4a",
    padding: 10,
    gap: 10,
    marginTop: 8,
    marginBottom: 5,
  },
  input: {
    flex: 1,
    color: "#e2e8f0",
    fontSize: 14,
    maxHeight: 96,
  },
  sendButton: {
    backgroundColor: "#a5d8ff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
});
