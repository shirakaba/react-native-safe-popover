import { NativeModules } from 'react-native';

type SafePopoverType = {
  getDeviceName(): Promise<string>;
};

const { SafePopover } = NativeModules;

export default SafePopover as SafePopoverType;
