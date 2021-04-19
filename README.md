# react-native-safe-popover

<p align="center">
    <a href="https://badge.fury.io/js/react-native-safe-popover"><img src="https://badge.fury.io/js/react-native-safe-popover.svg" alt="npm version" height="18"></a>
    <a href="https://opensource.org/licenses/mit-license.php">
        <img src="https://badges.frapsoft.com/os/mit/mit.png?v=103"/>
    </a>
    <a href="https://twitter.com/intent/follow?screen_name=LinguaBrowse">
        <img src="https://img.shields.io/twitter/follow/LinguaBrowse.svg?style=social&logo=twitter"/>
    </a>
</p>

A faithful JS-only imitation of UIKit's UIPopoverPresentationController, which respects the safe area, to React Native.

## Requirements

`react-native` version | `react-native-safe-popover` version
------------ | -------------
`~0.64.0` | `^1.1.0`
`~0.61.4` | `^0.2.0`

## Installation

```sh
yarn add react-native-safe-popover react-native-gesture-handler react-native-safe-area-context
# or
npm install --save react-native-safe-popover react-native-gesture-handler react-native-safe-area-context

# After installing via yarn/npm, also run this to install any iOS native dependencies:
npx pod-install
```

## Appearance

These screenshots come from the included demo.

On the "happy path", the popover will simply fill the available space and attain its preferred size (see the screenshots below, where we've tapped on the "bottom" and "right" source rectangles).

When the source rectangle is close to the edge, the safe area and layout margins become relevant.

The arrow and popover content will strictly keep to within the safe area. You will notice in the "top-left" case, however, that the arrow doesn't quite line up with the source rectangle despite there being no unsafe area to avoid on the left side. This is because the popover additionally respects the `popoverMinimumLayoutMargins` property (modelled on UIPopoverPresentationController's [popoverLayoutMargins](https://developer.apple.com/documentation/uikit/uipopoverpresentationcontroller/1622323-popoverlayoutmargins?language=objc) property). By default, this is a margin of 10px on all sides. This simply prevents the popover from being positioned flush with the screen edge – it's prettier (according to Apple) to be able to see a gutter.

The arrow that points out of the content box will also not disjoint from the content box. It gets as close to the source rectangle as it can, but won't necessarily touch it, which again is exhibited in the "top-left" case.

So in summary, the whole popover stays within the safe area (and also within the `popoverMinimumLayoutMargins`), and will place itself as close to the source rectangle as possible whilst doing so.

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

These screenshots come from the real-world iOS app, [LinguaBrowse](https://itunes.apple.com/us/app/linguabrowse/id1281350165?ls=1&mt=8), and demonstrate how it seamlessly handles `<WebView>` (or equally `<ScrollView>`) components:

<table>
    <tbody>
        <tr>
            <td align="center" valign="middle">
                <img width="300px" src="/github/realworld-1.png"/>
            </td>
            <td align="center" valign="middle">
                <img width="300px" src="/github/realworld-2.png"/>
            </td>
        </tr>
    </tbody>
</table>

## Usage

* As this is an imitation of [UIPopoverPresentationController](https://developer.apple.com/documentation/uikit/uipopoverpresentationcontroller), the APIs are generally modelled on those of it.
* SafePopover is nested within a full-screen modal, and so will have access to the entire screen area regardless of where you place it into the view hierarchy.
* When SafePopover appears, it appears over a backdrop, which by default is `rgba(0,0,0,0.25)` (as configured by the `backdropColor` prop), but you could make it totally transparent if preferred.
* It supports the props exposed in [src/Popover.tsx](/src/Popover.tsx) by the interface `PopoverProps`; read those for full details on how you can configure SafePopover.
* You can specify the preferred size for the popover content via the `preferredWidth` and `preferredHeight` props. You can think of these as equivalent to `maxWidth` and `maxHeight` in CSS.
* Given a source rectangle to "pop" out of, it calculates the optimal position to place the popover content, and thus also the orientation for the arrow.
* Through the `permittedArrowDirections` prop, you can specify your order of preference for the orientation of the arrow, and thus the placement of the popover content. You can force the content to always be placed above the rectangle by specifying `permittedArrowDirections={[PopoverArrowDirection.down]}`.
* If no position satisfies the constraints, it fills all available space and omits the arrow entirely (I think - I haven't bothered testing it). I think this could only realistically occur by setting silly arrow sizes.
* **Does it work in both portrait and landscape orientations?** Yes. Note that the width and height of the popover content do always mean width and height – they don't swap between orientations. So if your popover content is tall and thin in portrait mode, it'll be tall and thin on landscape mode too – not short and wide.
* **Does it handle rotation?** Sometimes, sometimes not. At least on iOS, it partially depends on whether you're using a simulator or a real device. I found that this is a limitation of `react-native-safe-area-context` – it doesn't provide the edge insets soon enough for us to apply them.
* **How do you show it?** Toggle its `modalVisible` property to `true`.
* **How do you dismiss it?** Toggle its `modalVisible` property to `false`. SafePopover exposes an `onBackdropPress` prop in case you want to toggle its `modalVisible` property to `false` upon the user pressing the backdrop.

```tsx
import React from "react";
import SafePopover from "react-native-safe-popover";

export function Example(targetRect: { x: number, y: number, height: number, width: number }){
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

## More of my stuff

<img src="/github/LinguaBrowse.png" width="64px"/>

* [LinguaBrowse](https://itunes.apple.com/us/app/linguabrowse/id1281350165?ls=1&mt=8) (iOS) on the App Store – made in React Native + TypeScript
* [LinguaBrowse](https://itunes.apple.com/gb/app/linguabrowse/id1422884180?mt=12) (macOS Safari Extension) on the App Store – made in Swift + TypeScript
* [@LinguaBrowse](https://twitter.com/LinguaBrowse) – my Twitter account. I talk about NativeScript, React Native, TypeScript, Chinese, Japanese, and my apps on there.