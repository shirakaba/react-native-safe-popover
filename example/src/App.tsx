import * as React from 'react';
import { StyleSheet, View, Text, TouchableWithoutFeedback, GestureResponderEvent } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafePopover from 'react-native-safe-popover';

export default function App() {
  const [popupVisible, setPopupVisible] = React.useState(false);
  // const hitboxRef = React.useRef(null);
  const targetRef = React.useRef(null);
  // const [deviceName, setDeviceName] = React.useState('');

  // React.useEffect(() => {
  //   SafePopover.getDeviceName().then(setDeviceName);
  // }, []);

  const onHitboxPress = (event: GestureResponderEvent) => {
    const { } = event.nativeEvent;
    setPopupVisible(true);
  };

  const onBackdropPress = () => {
    setPopupVisible(false);
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={onHitboxPress}>
          <View ref={targetRef} style={styles.target}></View>
        </TouchableWithoutFeedback>
        {/* <Text>Device name: {deviceName}</Text> */}
        <SafePopover
          sourceView={targetRef}
          modalVisible={popupVisible}
          dismissModalOnBackdropPress={onBackdropPress}
          canOverlapSourceViewRect={false}
        >
          <Text>I'm the content of this popover!</Text>
        </SafePopover>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  target: {
    backgroundColor: "blue",
    width: 20,
    height: 20,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
