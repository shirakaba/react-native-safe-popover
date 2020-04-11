import * as React from 'react';
import { StyleSheet, View, Text, TouchableWithoutFeedback, GestureResponderEvent } from 'react-native';
import { SafeAreaProvider, useSafeArea } from "react-native-safe-area-context";
import SafePopover from 'react-native-safe-popover';

function MySafeAreaConsumer() {
  const insets = useSafeArea();
  const [popupVisible, setPopupVisible] = React.useState(false);
  const [lastClickedTarget, setLastClickedTarget] = React.useState<React.RefObject<View>|null>(null);
  const nwTargetRef = React.useRef(null);
  const nTargetRef = React.useRef(null);
  const neTargetRef = React.useRef(null);

  const wTargetRef = React.useRef(null);
  const centralTargetRef = React.useRef(null);
  const eTargetRef = React.useRef(null);

  const swTargetRef = React.useRef(null);
  const sTargetRef = React.useRef(null);
  const seTargetRef = React.useRef(null);

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

  const onTargetPress = (event: GestureResponderEvent, ref: React.RefObject<View>, whichTarget: string) => {
    console.log(`[onTargetPress] ${whichTarget}`);
    const { } = event.nativeEvent;
    setLastClickedTarget(ref);
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
                justifyContent: "space-between",
              },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <TouchableWithoutFeedback onPress={(event) => onTargetPress(event, nwTargetRef, "nw")}>
                <View ref={nwTargetRef} style={[styles.target]}></View>
              </TouchableWithoutFeedback>

              <TouchableWithoutFeedback onPress={(event) => onTargetPress(event, nTargetRef, "n")}>
                <View ref={nTargetRef} style={[styles.target]}></View>
              </TouchableWithoutFeedback>

              <TouchableWithoutFeedback onPress={(event) => onTargetPress(event, neTargetRef, "ne")}>
                <View ref={neTargetRef} style={[styles.target]}></View>
              </TouchableWithoutFeedback>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>  
              <TouchableWithoutFeedback onPress={(event) => onTargetPress(event, wTargetRef, "w")}>
                <View ref={wTargetRef} style={[styles.target]}></View>
              </TouchableWithoutFeedback>

              <TouchableWithoutFeedback onPress={(event) => onTargetPress(event, centralTargetRef, "central")}>
                <View ref={centralTargetRef} style={[styles.target]}></View>
              </TouchableWithoutFeedback>

              <TouchableWithoutFeedback onPress={(event) => onTargetPress(event, eTargetRef, "e")}>
                <View ref={eTargetRef} style={[styles.target]}></View>
              </TouchableWithoutFeedback>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <TouchableWithoutFeedback onPress={(event) => onTargetPress(event, swTargetRef, "sw")}>
                <View ref={swTargetRef} style={[styles.target]}></View>
              </TouchableWithoutFeedback>

              <TouchableWithoutFeedback onPress={(event) => onTargetPress(event, sTargetRef, "s")}>
                <View ref={sTargetRef} style={[styles.target]}></View>
              </TouchableWithoutFeedback>

              <TouchableWithoutFeedback onPress={(event) => onTargetPress(event, seTargetRef, "se")}>
                <View ref={seTargetRef} style={[styles.target]}></View>
              </TouchableWithoutFeedback>
            </View>
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

      <SafePopover
        sourceView={lastClickedTarget!}
        modalVisible={popupVisible}
        dismissModalOnBackdropPress={onBackdropPress}
        canOverlapSourceViewRect={false}
      >
        <Text>I'm the content of this popover!</Text>
      </SafePopover>
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
