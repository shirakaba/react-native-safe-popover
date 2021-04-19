# react-native-safe-popover

A faithful JS-only imitation of UIKit's UIPopoverPresentationController, which respects the safe area, to React Native.

## Installation

```sh
npm install react-native-safe-popover
# or
yarn add react-native-safe-popover
```

## Appearance

<table>
    <tbody>
        <tr>
            <td align="center" valign="middle">
                <img width="200px" src="/github/bottom.png"/>
            </td>
            <td align="center" valign="middle">
                <img width="200px" src="/github/right.png"/>
            </td>
            <td align="center" valign="middle">
                <img width="200px" src="/github/top-left.png"/>
            </td>
        </tr>
        <tr>
            <td align="center" valign="middle">
                Bottom (fits)
            </td>
            <td align="center" valign="middle">
                Right (fits)
            </td>
            <td align="center" valign="middle">
                Top-left (respects 10px margins)
            </td>
        </tr>
    </tbody>
</table>

## Usage

* As this is an imitation of [UIPopoverPresentationController](https://developer.apple.com/documentation/uikit/uipopoverpresentationcontroller), the APIs are generally modelled on those of it.
* SafePopover is nested within a full-screen modal, and so will have access to the entire screen area regardless of where you place it into the view hierarchy.
* When SafePopover appears, it appears over a backdrop, which by default is `rgba(0,0,0,0.25)` (as configured by the `backdropColor` prop), but you could make it totally transparent if preferred.
* It supports the props exposed in `src/Popover.tsx` by the interface `PopoverProps`; read those for full details on how you can configure SafePopover.
* You can specify the preferred size for the popover content via the `preferredWidth` and `preferredHeight` props. You can think of these as equivalent to `maxWidth` and `maxHeight` in CSS.
* Given a source rectangle to "pop" out of, it calculates the optimal position to place the popover content, and thus also the orientation for the arrow.
* Through the `permittedArrowDirections` prop, you can specify your order of preference for the orientation of the arrow, and thus the placement of the popover content. You can force the content to always be placed above the rectangle by specifying `permittedArrowDirections={[PopoverArrowDirection.down]}`.
* If no position satisfies the constraints, it fills all available space and omits the arrow entirely (I think - I haven't bothered testing it). I think this could only realistically occur by setting silly arrow sizes.
* **Does it work in both portrait and landscape orientations?** Yes. Note that the width and height of the popover content do always mean width and height – they don't swap between orientations. So if your popover content is tall and thin in portrait mode, it'll be tall and thin on landscape mode too – not short and wide.
* **Does it handle rotation?** Sometimes, sometimes not. At least on iOS, it partially depends on whether you're using a simulator or a real device. I found that this is a limitation of `react-native-safe-area-context` – it doesn't provide the edge insets soon enough for us to apply them.
* **How do you show it?** Toggle its `modalVisible` property to `true`.
* **How do you dismiss it?** Toggle its `modalVisible` property to `false`. SafePopover exposes an `onBackdropPress` prop in case you want to toggle its `modalVisible` property to `false` upon the user pressing the backdrop.

```tsx
import SafePopover from "react-native-safe-popover";

export function Example(targetRect: { x: number, y: number, height: number, width: number }) {
    const [popupVisible, setPopupVisible] = React.useState(false);
    const { x, y, height, width } = targetRect;

    function onBackdropPress(): void {
        setPopupVisible(false);
    }

    return (
        <SafePopover
            animationType={"fade"}
            sourceRectHeight={height}
            sourceRectWidth={width}
            sourceRectX={x}
            sourceRectY={y}
            modalVisible={popupVisible}
            onBackdropPress={onBackdropPress}
            canOverlapSourceViewRect={false}
        >
            <Text style={{ padding: 8 }}>I'm the content of this popover!</Text>
        </SafePopover>
    );
}
```

## License

MIT
