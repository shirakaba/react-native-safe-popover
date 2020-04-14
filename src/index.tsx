// import { NativeModules } from 'react-native';
// type SafePopoverType = {
//   getDeviceName(): Promise<string>;
// };

// const { SafePopover } = NativeModules;

// export default SafePopover as SafePopoverType;

import { Popover } from "./Popover";
export { Popover } from "./Popover";
export { calculatePopoverLayout, CalculatePopoverLayoutParams, PopoverLayout } from "./calculatePopoverLayout";
export { Triangle } from "./Triangle";
export { PopoverArrowDirection} from "./arrowDirection";

export default Popover;
