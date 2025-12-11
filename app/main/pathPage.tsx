import { styles } from "@/styles/pathPage";
import { FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

import { radius, SCREEN_W, spacing, timeline } from "@/app/main/constants";

type LevelStatus = "done" | "open" | "locked";

interface LevelItem {
  id: number;
  title: string;
  status: LevelStatus;
  imgLeft: any;
  imgRight: any;
  imgLeftSize?: { width: number; height: number };
  imgRightSize?: { width: number; height: number };
}

//gambar
const imageLeft = [
  require('../../assets/images/path/imgLeft1.png'),
  require('../../assets/images/path/imgLeft2.png'),
  require('../../assets/images/path/imgLeft3.png'),
  require('../../assets/images/path/imgLeft4.png'),
  require('../../assets/images/path/imgLeft5.png'),
]

const imageRight = [
  require('../../assets/images/path/imgRight1.png'),
  require('../../assets/images/path/imgRight2.png'),
  require('../../assets/images/path/imgRight3.png'),
  require('../../assets/images/path/imgRight4.png'),
  require('../../assets/images/path/imgRight5.png'),
]

const CONTENT_TOP = 80;
const CARD_H = 100;

const initialLevels: LevelItem[] = Array.from({ length: 10 }).map((_, i) => ({
  id: i + 1,
  title: `Level ${i + 1}`,
  status: i === 0 ? "open" : i <= 1 ? "done" : "locked",
  imgLeft: imageLeft[i % imageLeft.length],
  imgRight: imageRight[i % imageRight.length],
  imgLeftSize: { width: 110, height: 70 },
  imgRightSize: { width: 90, height: 90 }
}));

export default function PathPage() {
  const params = useLocalSearchParams(); 
  console.log("pathPage params:", params);
  const id = params.id ? Number(params.id) : null;
  const [levels, setLevels] = useState(initialLevels);

  const totalHeight = useMemo(
    () => spacing * levels.length + 100 + CONTENT_TOP,
    [levels.length]
  );

  const makePath = (index: number) => {
    const startY = index * spacing + CONTENT_TOP;
    const endY = (index + 1) * spacing + CONTENT_TOP;

    // posisi X node
    const nodeX = timeline + (index % 2 === 0 ? -70 : 70);
    const nextNodeX = timeline + ((index + 1) % 2 === 0 ? -70 : 70);

    const offsetBase = 120;
    const dir = index % 2 === 0 ? 1 : -1;
    const offsetX = dir * offsetBase;

    const controlY1 = startY + (endY - startY) * 0.2;
    const controlY2 = startY + (endY - startY) * 0.8;

    const controlX1 = timeline + offsetX;
    const controlX2 = timeline + offsetX;

    return `M ${nodeX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${nextNodeX} ${endY}`;
  };



  const handlePress = (node: LevelItem) => {
    if (node.status === "locked") return;

    setLevels((prev) =>
      prev.map((l) =>
        l.id === node.id
          ? { ...l, status: l.status === "done" ? "open" : "done" }
          : l
      )
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ flex: 1, position: "relative" }}>
        <Text style={styles.header}>CodeJourney</Text>
        <Text>Ini halaman materi untuk ID: {id}</Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            height: totalHeight,
            paddingTop: CONTENT_TOP - 75,
            paddingBottom: 160,
        }}
        >
          {/* TIMELINE SVG */}
          <Svg width={SCREEN_W} height={totalHeight} style={{ position: "absolute", top: 0 }}>
            {levels.map((_, i) => {
              if (i === levels.length - 1) return null;

              return (
                <Path
                  key={`path-${i}`}
                  d={makePath(i)}
                  stroke="#93b7cf"
                  strokeWidth={4}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="12 10"
                />
              );
            })}

            {levels.map((_, i) => {
              const cy = i * spacing + CONTENT_TOP;

              return (
                <Circle
                  key={`circle-${i}`}
                  cx={timeline}
                  cy={cy}
                  r={radius + 4}
                  fill="transparent"
                />
              );
            })}
          </Svg>

          {/* CONTENT */}
          {levels.map((node, idx) => {
            const imageOnRight = idx % 2 === 0;
            const baseImageTop = spacing / 2 - CARD_H / 2;
            const extraOffset = imageOnRight && idx === 0 ? -1 : 0;
            const imageTop = baseImageTop + extraOffset;

            const imgSizeLeft = idx === 4 
              ? { width: 120, height: 120 } : { };
            
            const imgSizeRight = idx === 3 && 4
              ? { width: 120, height: 120 } : { };

            return (
              <View key={node.id} style={[styles.row, { height: spacing, position: "relative" }]}>
                {/* Left image */}
                <View
                  style={[
                    styles.side,
                    !imageOnRight && styles.imgSide,
                    {
                      position: "absolute",
                      top: imageTop - 28, 
                      left: 0, 
                      width: 138, 
                      height: CARD_H,
                      zIndex: 2, 
                    },
                  ]}
                >
                  {!imageOnRight ? (
                    <View style={[styles.cardImage, { height: CARD_H }]}>
                      <Image source={node.imgLeft} style={[styles.imgLeft, imgSizeLeft]} resizeMode="contain"/>
                    </View>
                  ) : null}
                </View>

                {/* Right image */}
                <View
                  style={[
                    styles.side,
                    imageOnRight && styles.imgSide,
                    {
                      position: "absolute",
                      top: imageOnRight
                        ? (idx === 0 ? imageTop : imageTop - 30)
                        : undefined,
                      right: 0,
                      width: 140,
                      height: CARD_H,
                      zIndex: 2,
                    },
                  ]}
                >
                  {imageOnRight ? (
                    <View style={[styles.cardImage, { height: CARD_H }]}>
                      <Image source={node.imgRight} style={[styles.imgRight, imgSizeRight]} resizeMode="contain"/>
                    </View>
                  ) : null }
                </View>
                
                {/* space */}
                <View style={styles.side}></View>

                {/* NODE */}
                <TouchableOpacity
                  onPress={() => handlePress(node)}
                  activeOpacity={1}
                  style={{
                    position: "absolute",
                    left: timeline + (idx % 2 === 0 ? -70 : 70) - radius,
                    top: spacing / 2 - radius,
                    zIndex: 3,
                  }}
                >
                  <View
                    style={[
                      styles.node,
                      node.status === "done" && styles.nodeDone,
                      node.status === "locked" && styles.nodeLocked,
                    ]}
                  >
                    {node.status === "done" ? (
                      <FontAwesome name="check" size={23} color="#286292" />
                    ) : node.status === "locked" ? (
                      <FontAwesome name="lock" size={23} color="#286292" />
                    ) : (
                      <Text style={styles.nodeNumber}>{node.id}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}