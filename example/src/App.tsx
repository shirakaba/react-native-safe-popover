import * as React from 'react';
import { StyleSheet, View, Text, TouchableWithoutFeedback, GestureResponderEvent, LayoutChangeEvent } from 'react-native';
import { SafeAreaProvider, useSafeArea } from "react-native-safe-area-context";
import SafePopover from 'react-native-safe-popover';

const silenceLogs: boolean = true;

function log(message?: any, ...optionalParams: any[]): void {
  if(silenceLogs){
    return;
  }
  return console.log(message, ...optionalParams);
}

function MySafeAreaConsumer() {
  const insets = useSafeArea();
  const [targetRect, setTargetRect] = React.useState({ x: 0, y: 0, width: 0, height: 0 });
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

  const safeAreaRef = React.useRef(null);
  const unsafeTopRef = React.useRef(null);
  const unsafeBottomRef = React.useRef(null);
  const unsafeLeftRef = React.useRef(null);
  const unsafeRightRef = React.useRef(null);

  const onTargetPress = (event: GestureResponderEvent, targetRef: React.RefObject<View>, whichTarget: string) => {
    log(`[onTargetPress] ${whichTarget}`);

    if(whichTarget === "safeArea"){
      log(`[onTargetPress] ${whichTarget} – suppressing display of popup for this particular target.`);
      return;
    }

    if(whichTarget.startsWith("unsafe")){
      /* No-op, but could consider special tests for unsafe area presses later. */
    }

    /* Note: we could consider the actual position of the touch, but for now the purpose of the test is just to track the target. */
    const layout = { };

    const target = targetRef.current;
    if(!target){
      return;
    }
    setLastClickedTarget(targetRef);
    target.measureInWindow(
      (x: number, y: number, width: number, height: number) => {
        log(`[target.onTargetPress] measureInWindow:\n- sourceView: ${JSON.stringify({ x, y, width, height })}`);

        setTargetRect({ x, y, width, height });
      }
    );
    setPopupVisible(true);
  };

  const onBackdropPress = () => {
    setPopupVisible(false);
  };

  const onTargetLayout = (e: LayoutChangeEvent, targetRef: React.RefObject<View>) => {
    if(targetRef !== lastClickedTarget){
      // We're only interested in setting the targetRef if this layout event corresponds to the last-clicked target.
      return;
    }
    /**
     * The "layout" event gives the latest dimensions of the backdrop, which equal those of the modal,
     * which is full-screen, and so these measurements can reflect the window dimensions.
     * 
     * We have to clone the event because events are pooled (re-used) in React.
     */
    const layout = { ...e.nativeEvent.layout };
    const target = targetRef.current;
    if(!target){
      return;
    }
    target.measureInWindow(
      (x: number, y: number, width: number, height: number) => {
        log(`[target.onLayout] measureInWindow:\n- sourceView: ${JSON.stringify({ x, y, width, height })}\n- layout: ${JSON.stringify(layout)}`);

        setTargetRect({ x, y, width, height });
      }
    );
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={(event) => onTargetPress(event, unsafeTopRef, "unsafeTop")}>
        <View
          ref={unsafeTopRef} onLayout={e => onTargetLayout(e, unsafeTopRef)}
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
        <TouchableWithoutFeedback onPress={(event) => onTargetPress(event, unsafeLeftRef, "unsafeLeft")}>
          <View
            ref={unsafeLeftRef} onLayout={e => onTargetLayout(e, unsafeLeftRef)}
            style={[
              styles.unsafeHorizontal,
              {
                width: insets.left,
              },
            ]}
          >
          </View>
        </TouchableWithoutFeedback>

        <TouchableWithoutFeedback onPress={(event) => onTargetPress(event, safeAreaRef, "safeArea")}>
          <View
            ref={safeAreaRef}
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
                <View ref={nwTargetRef} onLayout={e => onTargetLayout(e, nwTargetRef)} style={[styles.target]}></View>
              </TouchableWithoutFeedback>

              <TouchableWithoutFeedback onPress={(event) => onTargetPress(event, nTargetRef, "n")}>
                <View ref={nTargetRef} onLayout={e => onTargetLayout(e, nTargetRef)} style={[styles.target]}></View>
              </TouchableWithoutFeedback>

              <TouchableWithoutFeedback onPress={(event) => onTargetPress(event, neTargetRef, "ne")}>
                <View ref={neTargetRef} onLayout={e => onTargetLayout(e, neTargetRef)} style={[styles.target]}></View>
              </TouchableWithoutFeedback>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>  
              <TouchableWithoutFeedback onPress={(event) => onTargetPress(event, wTargetRef, "w")}>
                <View ref={wTargetRef} onLayout={e => onTargetLayout(e, wTargetRef)} style={[styles.target]}></View>
              </TouchableWithoutFeedback>

              <TouchableWithoutFeedback onPress={(event) => onTargetPress(event, centralTargetRef, "central")}>
                <View ref={centralTargetRef} onLayout={e => onTargetLayout(e, centralTargetRef)} style={[styles.target]}></View>
              </TouchableWithoutFeedback>

              <TouchableWithoutFeedback onPress={(event) => onTargetPress(event, eTargetRef, "e")}>
                <View ref={eTargetRef} onLayout={e => onTargetLayout(e, eTargetRef)} style={[styles.target]}></View>
              </TouchableWithoutFeedback>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <TouchableWithoutFeedback onPress={(event) => onTargetPress(event, swTargetRef, "sw")}>
                <View ref={swTargetRef} onLayout={e => onTargetLayout(e, swTargetRef)} style={[styles.target]}></View>
              </TouchableWithoutFeedback>

              <TouchableWithoutFeedback onPress={(event) => onTargetPress(event, sTargetRef, "s")}>
                <View ref={sTargetRef} onLayout={e => onTargetLayout(e, sTargetRef)} style={[styles.target]}></View>
              </TouchableWithoutFeedback>

              <TouchableWithoutFeedback onPress={(event) => onTargetPress(event, seTargetRef, "se")}>
                <View ref={seTargetRef} onLayout={e => onTargetLayout(e, seTargetRef)} style={[styles.target]}></View>
              </TouchableWithoutFeedback>
            </View>
          </View>
        </TouchableWithoutFeedback>

        <TouchableWithoutFeedback onPress={(event) => onTargetPress(event, unsafeRightRef, "unsafeRight")}>
          <View
            ref={unsafeRightRef} onLayout={e => onTargetLayout(e, unsafeRightRef)}
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

      <TouchableWithoutFeedback onPress={(event) => onTargetPress(event, unsafeBottomRef, "unsafeBottom")}>
        <View
          ref={unsafeBottomRef} onLayout={e => onTargetLayout(e, unsafeBottomRef)}
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
        sourceRectHeight={targetRect.height}
        sourceRectWidth={targetRect.width}
        sourceRectX={targetRect.x}
        sourceRectY={targetRect.y}
        modalVisible={popupVisible}
        dismissModalOnBackdropPress={onBackdropPress}
        canOverlapSourceViewRect={false}
      >
        <Text style={{ padding: 8 }}>I'm the content of this popover!</Text>
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
