import * as React from 'react';
import { StyleSheet, View, Text, TouchableWithoutFeedback, GestureResponderEvent } from 'react-native';
import { SafeAreaProvider, useSafeArea } from "react-native-safe-area-context";
import SafePopover from 'react-native-safe-popover';

function MySafeAreaConsumer() {
  const insets = useSafeArea();
  const [popupVisible, setPopupVisible] = React.useState(false);
  const [lastClickedTarget, setLastClickedTarget] = React.useState<React.RefObject<View>|null>(null);
  const targetRef = React.useRef(null);
  const unsafeTopRef = React.useRef(null);
  const unsafeBottomRef = React.useRef(null);
  const unsafeLeftRef = React.useRef(null);
  const unsafeRightRef = React.useRef(null);

  const onUnsafeAreaPress = (event: GestureResponderEvent, whichInset: "top"|"left"|"bottom"|"right") => {
    console.log(`[onUnsafeAreaPress] ${whichInset}`);
    const { } = event.nativeEvent;

    switch(whichInset){
      case "bottom":
        setLastClickedTarget(unsafeBottomRef);
        break;
      case "top":
        setLastClickedTarget(unsafeTopRef);
        break;
      case "left":
        setLastClickedTarget(unsafeLeftRef);
        break;
      case "right":
        setLastClickedTarget(unsafeRightRef);
        break;
    }

    setPopupVisible(true);
  };

  const onSafeAreaPress = (event: GestureResponderEvent) => {
    console.log(`[onsafeAreaPress]`);
    const { } = event.nativeEvent;
    // setLastClickedTarget(targetRef);
    // setPopupVisible(true);
  };

  const onHitboxPress = (event: GestureResponderEvent) => {
    console.log("[onHitboxPress]");
    const { } = event.nativeEvent;
    setLastClickedTarget(targetRef);
    setPopupVisible(true);
  };

  const onBackdropPress = () => {
    setPopupVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={(event) => onUnsafeAreaPress(event, "top")}>
        <View
          ref={unsafeTopRef}
          style={[
            styles.unsafeVertical,
            {
              height: insets.top,
            },
          ]}
        >
        </View>
      </TouchableWithoutFeedback>

      <View style={styles.centralRow}>
        <TouchableWithoutFeedback onPress={(event) => onUnsafeAreaPress(event, "left")}>
          <View
            ref={unsafeLeftRef}
            style={[
              styles.unsafeHorizontal,
              {
                width: insets.left,
              },
            ]}
          >
          </View>
        </TouchableWithoutFeedback>

        <TouchableWithoutFeedback onPress={(event) => onSafeAreaPress(event)}>
          <View
            style={[
              styles.safe,
              {
                alignItems: "center",
                justifyContent: "center",
              },
            ]}
          >
            <TouchableWithoutFeedback onPress={onHitboxPress}>
              <View ref={targetRef} style={[styles.target]}></View>
            </TouchableWithoutFeedback>

            <SafePopover
              sourceView={lastClickedTarget!}
              modalVisible={popupVisible}
              dismissModalOnBackdropPress={onBackdropPress}
              canOverlapSourceViewRect={false}
            >
              <Text>I'm the content of this popover!</Text>
            </SafePopover>
          </View>
        </TouchableWithoutFeedback>

        <TouchableWithoutFeedback onPress={(event) => onUnsafeAreaPress(event, "right")}>
          <View
            ref={unsafeRightRef}
            style={[
              styles.unsafeHorizontal,
              {
                width: insets.right,
              },
            ]}
          >
          </View>
        </TouchableWithoutFeedback>
      </View>

      <TouchableWithoutFeedback onPress={(event) => onUnsafeAreaPress(event, "bottom")}>
        <View
          ref={unsafeBottomRef}
          style={[
            styles.unsafeVertical,
            {
              height: insets.bottom,
            },
          ]}
        >
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

export default function App() {
  const targetRef = React.useRef(null);
  // const [deviceName, setDeviceName] = React.useState('');

  // React.useEffect(() => {
  //   SafePopover.getDeviceName().then(setDeviceName);
  // }, []);

  return (
    <SafeAreaProvider>
      <MySafeAreaConsumer/>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  unsafeVertical: {
    backgroundColor: "red",
    width: "100%",
    flex: 0,
  },
  unsafeHorizontal: {
    flex: 0,
    backgroundColor: "orange",
  },
  centralRow: {
    flex: 1,
    flexDirection: "row",
    // width: "100%",
  },
  safe: {
    flex: 1,
    backgroundColor: "rgba(0,255,0, 0.25)",
  },
  target: {
    backgroundColor: "blue",
    width: 90,
    height: 90,
  },
  container: {
    flex: 1,
    flexDirection: "column",
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
