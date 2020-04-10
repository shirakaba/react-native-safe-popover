import * as React from 'react';
import { StyleSheet, View, Text, TouchableWithoutFeedback, GestureResponderEvent } from 'react-native';
import { SafeAreaProvider, useSafeArea } from "react-native-safe-area-context";
import SafePopover from 'react-native-safe-popover';

function MySafeAreaConsumer() {
  const insets = useSafeArea();
  const [popupVisible, setPopupVisible] = React.useState(false);
  const targetRef = React.useRef(null);

  const onUnsafeAreaPress = (event: GestureResponderEvent, whichInset: "top"|"left"|"bottom"|"right") => {
    console.log(`[onUnsafeAreaPress] ${whichInset}`);
    const { } = event.nativeEvent;
  };

  const onSafeAreaPress = (event: GestureResponderEvent) => {
    console.log(`[onsafeAreaPress]`);
    const { } = event.nativeEvent;
  };

  const onHitboxPress = (event: GestureResponderEvent) => {
    console.log("onHitboxPress");
    const { } = event.nativeEvent;
    setPopupVisible(true);
  };

  const onBackdropPress = () => {
    setPopupVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={(event) => onUnsafeAreaPress(event, "top")}>
        <View
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
              <View ref={targetRef} style={styles.target}></View>
            </TouchableWithoutFeedback>

            <SafePopover
              sourceView={targetRef}
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
    width: 20,
    height: 20,
  },
  container: {
    flex: 1,
    flexDirection: "column",
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
