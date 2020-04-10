import * as React from 'react';
import { StyleSheet, View, Text, TouchableWithoutFeedback, GestureResponderEvent } from 'react-native';
import { SafeAreaProvider, useSafeArea } from "react-native-safe-area-context";
import SafePopover from 'react-native-safe-popover';

function MySafeAreaConsumer() {
  const insets = useSafeArea();
  const [popupVisible, setPopupVisible] = React.useState(false);
  const targetRef = React.useRef(null);

  const onHitboxPress = (event: GestureResponderEvent) => {
    const { } = event.nativeEvent;
    setPopupVisible(true);
  };

  const onBackdropPress = () => {
    setPopupVisible(false);
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.unsafeVertical,
          {
            height: insets.top,
          },
        ]}
      >
      </View>
      <View style={styles.centralRow}>
        <View
          style={[
            styles.unsafeHorizontal,
            {
              width: insets.left,
            },
          ]}
        >
        </View>
        <View
          style={[
            styles.safe,
            {
            },
          ]}
        >
          <Text>Heya</Text>
        </View>
        <View
          style={[
            styles.unsafeHorizontal,
            {
              width: insets.right,
            },
          ]}
        >
        </View>
      </View>

      <View
        style={[
          styles.unsafeVertical,
          {
            height: insets.bottom,
          },
        ]}
      >
      </View>
      

      {/* <TouchableWithoutFeedback onPress={onHitboxPress}>
        <View ref={targetRef} style={styles.target}></View>
      </TouchableWithoutFeedback>
      <Text>Lorem ipsum</Text>

      <SafePopover
        sourceView={targetRef}
        modalVisible={popupVisible}
        dismissModalOnBackdropPress={onBackdropPress}
        canOverlapSourceViewRect={false}
      >
        <Text>I'm the content of this popover!</Text>
      </SafePopover> */}


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
