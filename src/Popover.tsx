import React from 'react';
import { View, Modal, NativeSyntheticEvent, LayoutChangeEvent, StyleSheet, GestureResponderEvent } from 'react-native';
import { SafeAreaProvider, SafeAreaConsumer, EdgeInsets, useSafeArea, SafeAreaContext } from 'react-native-safe-area-context';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { Triangle } from './Triangle';
import { PopoverArrowDirection } from './arrowDirection';
import { calculatePopoverLayout } from './calculatePopoverLayout';

const silenceLogs: boolean = true;

function log(message?: any, ...optionalParams: any[]): void {
    if(silenceLogs){
      return;
    }
    return console.log(message, ...optionalParams);
}

export interface PopoverProps {
    /**
     * The preferred width of the popover if adequate space is available.
     * Does not alter upon rotation; popover always maintains a portrait orientation.
     */
    preferredWidth?: number,
    /**
     * The preferred height of the popover if adequate space is available.
     * Does not alter upon rotation; popover always maintains a portrait orientation.
     */
    preferredHeight?: number,
    /**
     * The `animationType` prop controls how the modal animates.
     *
     * - `slide` slides in from the bottom
     * - `fade` fades into view
     * - `none` appears without an animation
     */
    animationType?: 'none' | 'slide' | 'fade',
    /** 
     * The background colour of the backdrop.
     * @default "rgba(0,0,0,0.25)"
     */
    backdropColor?: string,
    /** 
     * The background colour of the popover.
     * @default "white"
     */
    popoverColor?: string,
    /**
     * The width of the rect encompassing the source view.
     */
    sourceRectWidth: number,
    /**
     * The height of the rect encompassing the source view.
     */
    sourceRectHeight: number,
    /**
     * The x-position of the rect encompassing the source view.
     * Is measured relative to the backdrop origin point.
     * In other words, the x-offset from the backdrop origin point.
     */
    sourceRectX: number,
    /**
     * The y-position of the rect encompassing the source view.
     * Is measured relative to the backdrop origin point.
     * In other words, the y-offset from the backdrop origin point.
     */
    sourceRectY: number,

    dismissModalOnBackdropPress?: () => void,
    /**
     * @default false
     */
    modalVisible?: boolean,
    /**
     * Setting this property to true allows the popover to overlap the rectangle in the sourceRect
     * property when space is constrained. The default value of this property is false, which
     * prevents the popover from overlapping the source rectangle.
     * 
     * @see https://developer.apple.com/documentation/uikit/uipopoverpresentationcontroller/1622325-canoverlapsourceviewrect
     * @default false
     */
    canOverlapSourceViewRect?: boolean,
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
    permittedArrowDirections?: PopoverArrowDirection[],

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
    popoverMinimumLayoutMargins?: EdgeInsets,
}

interface PopoverState {
    // modalVisible: boolean,

    /**
     * The width of the backdrop (assumed to equal the width of the screen)
     */
    backdropWidth: number,
    /**
     * The height of the backdrop (assumed to equal the height of the screen)
     */
    backdropHeight: number,
}

export class Popover extends React.PureComponent<PopoverProps, PopoverState> {
    public static defaultProps = {
        preferredWidth: 300,
        preferredHeight: 400,
        popoverColor: "white",
        backdropColor: "rgba(0,0,0,0.25)",
        animationType: "fade",
        permittedArrowDirections: [PopoverArrowDirection.down, PopoverArrowDirection.up, PopoverArrowDirection.left, PopoverArrowDirection.right],
        popoverMinimumLayoutMargins: {
            top: 10,
            left: 10,
            right: 10,
            bottom: 10,
        },
    };

    /**
     * TODO: consider implementing
     * When the popover is onscreen, this property reflects the actual arrow direction.
     * Before and after presentation, the value of this property is unknown.
     * @see https://developer.apple.com/documentation/uikit/uipopoverpresentationcontroller/1622315-arrowdirection
     * @default PopoverArrowDirection.any
     */
    // private readonly arrowDirection: PopoverArrowDirection = PopoverArrowDirection.down;

    private readonly backdropRef: React.RefObject<View> = React.createRef();

    /**
     * How far the arrow head extrudes out of the content box.
     */
    private static readonly arrowLength: number = 15;
    /**
     * How broad the arrow is.
     */
    private static readonly arrowBreadth: number = 30;

    /**
     * NOT IMPLEMENTED
     * The minimum width for a popover of "adequate size".
     * Does not alter upon rotation; popover always maintains a portrait orientation.
     */
    // private static readonly minimumWidth: number = 200;

    /**
     * NOT IMPLEMENTED
     * The minimum height for a popover of "adequate size".
     * Does not alter upon rotation; popover always maintains a portrait orientation.
     */
    // private static readonly minimumHeight: number = 200;

    private static readonly borderRadius: number = 15;
    private static readonly cornerWidth: number = Popover.borderRadius * 2;

    constructor(props: PopoverProps){
        super(props);

        // const { modalVisible = false } = props;

        this.state = {
            backdropWidth: 0,
            backdropHeight: 0,
        };
    }

    private readonly onRequestClose = () => {
        // no-op
    };

    private readonly onShow = (event: NativeSyntheticEvent<any>) => {
        // no-op
    };

    /**
     * This event races against the edgeInsets updates. I've seen edgeInsets update after this.
     */
    private readonly onLayout = (e: LayoutChangeEvent) => {
        /**
         * The "layout" event gives the latest dimensions of the backdrop, which equal those of the modal,
         * which is full-screen, and so these measurements can reflect the window dimensions.
         */
        const { width, height } = e.nativeEvent.layout;

        this.setState({
            backdropWidth: width,
            backdropHeight: height,
        }, () => {
            log(`[Popover.onLayout] onLayout setState complete`);
        });
    };

    private readonly onBackdropPress = (event: GestureResponderEvent) => {
        log(`[onBackdropPress]`);

        if(this.props.dismissModalOnBackdropPress){
            this.props.dismissModalOnBackdropPress();
        }
    };

    render(){
        return (
            <SafeAreaConsumer>
                {(edgeInsets: EdgeInsets|null) => {
                    log(`[edgeInsets]`, edgeInsets);
                    const {
                        permittedArrowDirections,
                        children,
                        popoverMinimumLayoutMargins,
                        preferredHeight,
                        preferredWidth,
                    } = this.props;
                    log(`[DEBUG] popoverMinimumLayoutMargins`, popoverMinimumLayoutMargins);
                    const {
                        backdropHeight,
                        backdropWidth,
                    } = this.state;

                    const sourceRect = {
                        x: this.props.sourceRectX,
                        y: this.props.sourceRectY,
                        width: this.props.sourceRectWidth,
                        height: this.props.sourceRectHeight,
                    } as const;

                    log(`Got sourceRect`, sourceRect);

                    const popoverLayout = calculatePopoverLayout({
                        permittedArrowDirections: permittedArrowDirections!,
                        safeAreaEdgeInsets: {
                            left: Math.max(edgeInsets?.left ?? 0, popoverMinimumLayoutMargins?.left ?? 0),
                            top: Math.max(edgeInsets?.top ?? 0, popoverMinimumLayoutMargins?.top ?? 0),
                            bottom: Math.max(edgeInsets?.bottom ?? 0, popoverMinimumLayoutMargins?.bottom ?? 0),
                            right: Math.max(edgeInsets?.right ?? 0, popoverMinimumLayoutMargins?.right ?? 0),
                        },
                        sourceRect,
                        backdropHeight,
                        backdropWidth,
                        preferredHeight: preferredHeight!,
                        preferredWidth: preferredWidth!,

                        arrowBreadth: Popover.arrowBreadth,
                        arrowLength: Popover.arrowLength,
                        cornerWidth: Popover.cornerWidth,
                        borderRadius: Popover.borderRadius,
                    });
                    log(`[POPOVER] Got popoverLayout.popover:`, popoverLayout.popover);
                    log(`[ARROW  ] Got popoverLayout.arrow  :`, popoverLayout.arrow);


                    return (
                        <Modal
                            animationType={this.props.animationType}
                            transparent={true}
                            visible={this.props.modalVisible}
                            onRequestClose={this.onRequestClose}
                            onShow={this.onShow}
                            supportedOrientations={['portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right']}
                        >
                            {/* Backdrop */}
                            <TouchableWithoutFeedback
                                ref={this.backdropRef}
                                onPress={this.onBackdropPress}
                                style={{
                                    backgroundColor: this.props.backdropColor,
                                    width: "100%",
                                    height: "100%",
                                }}
                                onLayout={(event) => this.onLayout(event)}
                            >
                                {/* Popover */}
                                <View
                                    style={{
                                        position: "absolute",
                                        backgroundColor: this.props.popoverColor,
                                        ...popoverLayout.popover.borderRadii,
                                        overflow: "hidden",

                                        // width: this.state.backdropWidth / 2,
                                        // height: this.state.backdropHeight / 2,

                                        left: popoverLayout.popover.x ?? 0,
                                        top: popoverLayout.popover.y ?? 0,
                                        width: popoverLayout.popover.width ?? 0,
                                        height: popoverLayout.popover.height ?? 0,
                                    }}
                                    
                                >
                                    <TouchableWithoutFeedback
                                        style={{
                                            ...popoverLayout.popover.borderRadii,
                                            width: "100%",
                                            height: "100%",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {children}
                                    </TouchableWithoutFeedback>
                                </View>
                            </TouchableWithoutFeedback>
                            <Triangle
                                style={{
                                    position: "absolute",
                                    display: popoverLayout.arrow.direction === "none" ? "none" : "flex",

                                    left: popoverLayout.arrow.x,
                                    top: popoverLayout.arrow.y,
                                }}
                                width={popoverLayout.arrow.width}
                                height={popoverLayout.arrow.height}
                                color={this.props.popoverColor}
                                direction={popoverLayout.arrow.direction === "none" ? "down" : popoverLayout.arrow.direction}
                            />
                        </Modal>
                    );
                }}
            </SafeAreaConsumer>

        );
    }
}
