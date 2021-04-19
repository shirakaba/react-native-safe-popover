import React from "react";
import { View, Modal, NativeSyntheticEvent, LayoutChangeEvent } from "react-native";
import { EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import type GenericTouchable from "react-native-gesture-handler/lib/typescript/components/touchables/GenericTouchable";
import { Triangle } from "./Triangle";
import { PopoverArrowDirection } from "./arrowDirection";
import { calculatePopoverLayout } from "./calculatePopoverLayout";

const silenceLogs: boolean = true;

function log(message?: any, ...optionalParams: any[]): void {
    if (silenceLogs) {
        return;
    }
    return console.log(message, ...optionalParams);
}

export interface PopoverProps {
    /**
     * How far the arrow head extrudes out of the content box.
     */
    arrowLength?: number;
    /**
     * How broad the arrow is.
     */
    arrowBreadth?: number;
    /**
     * The border radius of the popover.
     */
    borderRadius?: number;
    /**
     * The width of the rounded corner that is curved rather than straight. The arrow will avoid this region.
     */
    cornerWidth?: number;
    /**
     * The preferred width of the popover if adequate space is available.
     * Does not alter upon rotation; popover always maintains a portrait orientation.
     */
    preferredWidth?: number;
    /**
     * The preferred height of the popover if adequate space is available.
     * Does not alter upon rotation; popover always maintains a portrait orientation.
     */
    preferredHeight?: number;
    /**
     * The `animationType` prop controls how the modal animates.
     *
     * - `slide` slides in from the bottom
     * - `fade` fades into view
     * - `none` appears without an animation
     */
    animationType?: "none" | "slide" | "fade";
    /**
     * The background colour of the backdrop.
     * @default "rgba(0,0,0,0.25)"
     */
    backdropColor?: string;
    /**
     * The background colour of the popover.
     * @default "white"
     */
    popoverColor?: string;
    /**
     * The width of the rect encompassing the source view.
     */
    sourceRectWidth: number;
    /**
     * The height of the rect encompassing the source view.
     */
    sourceRectHeight: number;
    /**
     * The x-position of the rect encompassing the source view.
     * Is measured relative to the backdrop origin point.
     * In other words, the x-offset from the backdrop origin point.
     */
    sourceRectX: number;
    /**
     * The y-position of the rect encompassing the source view.
     * Is measured relative to the backdrop origin point.
     * In other words, the y-offset from the backdrop origin point.
     */
    sourceRectY: number;
    /**
     * A callback called upon the backdrop (the Modal background) being pressed. If you wish to close the Modal upon backdrop
     * press, you can update the `modalVisible` prop during this callback.
     */
    onBackdropPress?: () => void;
    /**
     * Whether the Modal (which the Popover is presented upon) is visible or not.
     * @default false
     */
    modalVisible?: boolean;
    /**
     * Setting this property to true allows the popover to overlap the rectangle in the sourceRect
     * property when space is constrained. The default value of this property is false, which
     * prevents the popover from overlapping the source rectangle.
     *
     * TODO: Implement
     *
     * @see https://developer.apple.com/documentation/uikit/uipopoverpresentationcontroller/1622325-canoverlapsourceviewrect
     * @default false
     */
    // canOverlapSourceViewRect?: boolean;
    /**
     * Prior to displaying the popover, set this property to the arrow directions that you allow
     * for your popover.
     *
     * TODO: "The actual arrow direction in use by the popover is stored in the arrowDirection property."
     *
     * The order of the specified directions will be used as the order of preference, if one or more options satisfy the constraints.
     *
     * @default [PopoverArrowDirection.down, PopoverArrowDirection.up, PopoverArrowDirection.left, PopoverArrowDirection.right]
     */
    permittedArrowDirections?: PopoverArrowDirection[];
    /**
     * The margins that define the portion of the screen in which it is permissible to display the popover.
     *
     * In the original UIPopoverPresentationController, these would default to 10 points from each edge, and
     * the status bar height would also be implicitly subtracted as well.
     *
     * In my implementation, the popover strictly occupies the safe area to begin with. So this prop will
     * instead be interpreted as the minimum inset from each edge (mainly so that you can enforce left and
     * right edge insets even when the left and right sides are totally within the safe area).
     *
     * @default { top: 10, left: 10, right: 10, bottom: 10 }
     *
     * @see https://developer.apple.com/documentation/uikit/uipopoverpresentationcontroller/1622323-popoverlayoutmargins?language=objc
     */
    popoverMinimumLayoutMargins?: EdgeInsets;
    /** An optional alternative to rendering simply using React.children. This passes in some props relating to the Popover
     * that may be of use to the child. Will be used instead of React.children if both are provided. */
    renderPopoverContent?: (props: PopoverContentProps) => React.ReactNode;
}

export interface PopoverContentProps {
    /**
     * The direction of the arrow coming out of the Popover. Will be "none" only in the last-resort case of having to overlap
     * the target rectangle to satisfy constraints.
     */
    arrowDirection: "up" | "down" | "left" | "right" | "none";
}

export function Popover(props: React.PropsWithChildren<PopoverProps>) {
    const backdropRef = React.useRef<GenericTouchable>(null);
    /**
     * The size of the backdrop (assumed to equal the size of the screen)
     */
    const [backdropSize, setBackdropSize] = React.useState({
        width: 0,
        height: 0,
    });

    const onRequestClose = () => {
        // no-op
    };

    const onShow = (_: NativeSyntheticEvent<any>) => {
        // no-op
    };

    /**
     * This event races against the edgeInsets updates. I've seen edgeInsets update after this.
     */
    const onLayout = (e: LayoutChangeEvent) => {
        /**
         * The "layout" event gives the latest dimensions of the backdrop, which equal those of the modal,
         * which is full-screen, and so these measurements can reflect the window dimensions.
         */
        const { width, height } = e.nativeEvent.layout;

        setBackdropSize({ width, height });
    };

    const onBackdropPress = () => {
        log("[onBackdropPress]");

        if (props.onBackdropPress) {
            props.onBackdropPress();
        }
    };

    const edgeInsets: EdgeInsets = useSafeAreaInsets();
    log("[edgeInsets]", edgeInsets);
    const {
        permittedArrowDirections,
        children,
        popoverMinimumLayoutMargins,
        preferredHeight,
        preferredWidth,
        renderPopoverContent,
    } = props;
    // log(`[DEBUG] popoverMinimumLayoutMargins`, popoverMinimumLayoutMargins);

    const sourceRect = {
        x: props.sourceRectX,
        y: props.sourceRectY,
        width: props.sourceRectWidth,
        height: props.sourceRectHeight,
    } as const;

    log("Got sourceRect", sourceRect);

    const popoverLayout = calculatePopoverLayout({
        permittedArrowDirections: permittedArrowDirections!,
        safeAreaEdgeInsets: {
            left: Math.max(edgeInsets?.left ?? 0, popoverMinimumLayoutMargins!.left),
            top: Math.max(edgeInsets?.top ?? 0, popoverMinimumLayoutMargins!.top),
            bottom: Math.max(edgeInsets?.bottom ?? 0, popoverMinimumLayoutMargins!.bottom),
            right: Math.max(edgeInsets?.right ?? 0, popoverMinimumLayoutMargins!.right),
        },
        sourceRect,
        backdropHeight: backdropSize.height,
        backdropWidth: backdropSize.width,
        preferredHeight: preferredHeight!,
        preferredWidth: preferredWidth!,

        arrowBreadth: props.arrowBreadth!,
        arrowLength: props.arrowLength!,
        cornerWidth: props.cornerWidth!,
        borderRadius: props.borderRadius!,
    });
    log("[POPOVER] Got popoverLayout.popover:", popoverLayout.popover);
    log("[ARROW  ] Got popoverLayout.arrow  :", popoverLayout.arrow);

    return (
        <Modal
            animationType={props.animationType}
            transparent={true}
            visible={props.modalVisible}
            onRequestClose={onRequestClose}
            onShow={onShow}
            supportedOrientations={[
                "portrait",
                "portrait-upside-down",
                "landscape",
                "landscape-left",
                "landscape-right",
            ]}
        >
            {/* Backdrop */}
            <TouchableWithoutFeedback
                ref={backdropRef}
                onPress={onBackdropPress}
                // eslint-disable-next-line react-native/no-inline-styles
                style={{
                    backgroundColor: props.backdropColor,
                    width: "100%",
                    height: "100%",
                }}
                onLayout={event => onLayout(event)}
            >
                {/* Popover */}
                <View
                    // eslint-disable-next-line react-native/no-inline-styles
                    style={{
                        position: "absolute",
                        backgroundColor: props.popoverColor,
                        ...popoverLayout.popover.borderRadii,
                        overflow: "hidden",

                        left: popoverLayout.popover.x,
                        top: popoverLayout.popover.y,
                        width: popoverLayout.popover.width,
                        height: popoverLayout.popover.height,
                    }}
                >
                    <TouchableWithoutFeedback
                        // eslint-disable-next-line react-native/no-inline-styles
                        style={{
                            ...popoverLayout.popover.borderRadii,
                            width: "100%",
                            height: "100%",
                            overflow: "hidden",
                        }}
                    >
                        {renderPopoverContent
                            ? renderPopoverContent({
                                  arrowDirection: popoverLayout.arrow.direction,
                              })
                            : children}
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
            <Triangle
                // eslint-disable-next-line react-native/no-inline-styles
                style={{
                    position: "absolute",
                    display: popoverLayout.arrow.direction === "none" ? "none" : "flex",

                    left: popoverLayout.arrow.x,
                    top: popoverLayout.arrow.y,
                }}
                width={popoverLayout.arrow.width}
                height={popoverLayout.arrow.height}
                color={props.popoverColor}
                direction={
                    popoverLayout.arrow.direction === "none"
                        ? "down"
                        : popoverLayout.arrow.direction
                }
            />
        </Modal>
    );
}

Popover.defaultProps = {
    arrowLength: 15,
    arrowBreadth: 30,
    borderRadius: 15,
    cornerWidth: 30, // twice the border radius
    preferredWidth: 300,
    preferredHeight: 400,
    popoverColor: "white",
    backdropColor: "rgba(0,0,0,0.25)",
    animationType: "fade",
    permittedArrowDirections: [
        PopoverArrowDirection.down,
        PopoverArrowDirection.up,
        PopoverArrowDirection.left,
        PopoverArrowDirection.right,
    ],
    popoverMinimumLayoutMargins: {
        top: 10,
        left: 10,
        right: 10,
        bottom: 10,
    },
};
