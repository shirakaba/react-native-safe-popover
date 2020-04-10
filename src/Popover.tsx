import React from 'react';
import { View, Modal, NativeSyntheticEvent, LayoutChangeEvent, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaConsumer, EdgeInsets } from 'react-native-safe-area-context';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { Triangle } from './Triangle';

/**
 * 
 * @see https://developer.apple.com/documentation/uikit/uipopoverarrowdirection
 */
export enum PopoverArrowDirection {
    up,
    down,
    left,
    right,
    any,
    unknown,
}

export interface PopoverProps {
    sourceView?: React.RefObject<View>,
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
     * for your popover. The actual arrow direction in use by the popover is stored in the
     * arrowDirection property.
     * 
     * @default [PopoverArrowDirection.any]
     */
    permittedArrowDirections?: PopoverArrowDirection[],

    /**
     * When permittedArrowDirections includes both .left and .right, and adequate space is available
     * on both sides horizontally, prefer to lay the popover over the left side (true) or the right
     * side (false).
     * 
     * Recommendation: true for locales with left-to-right text; false for right-to-left text.
     * 
     * @default false
     */
    preferPopoverToCoverLeftSideWhenArrowIsHorizontal?: boolean,
}

interface PopoverState {
    // modalVisible: boolean,

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
    /**
     * The width of the backdrop (assumed to equal the width of the screen)
     */
    backdropWidth: number,
    /**
     * The height of the backdrop (assumed to equal the height of the screen)
     */
    backdropHeight: number,
}

export class Popover extends React.Component<PopoverProps, PopoverState> {
    /**
     * When the popover is onscreen, this property reflects the actual arrow direction.
     * Before and after presentation, the value of this property is unknown.
     * @see https://developer.apple.com/documentation/uikit/uipopoverpresentationcontroller/1622315-arrowdirection
     * @default PopoverArrowDirection.any
     */
    private readonly arrowDirection: PopoverArrowDirection = PopoverArrowDirection.unknown;

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
     * The preferred width of the popover if adequate space is available.
     * Does not alter upon rotation; popover always maintains a portrait orientation.
     */
    private static readonly preferredWidth: number = 300;
    /**
     * The preferred height of the popover if adequate space is available.
     * Does not alter upon rotation; popover always maintains a portrait orientation.
     */
    private static readonly preferredHeight: number = 400;

    /**
     * The minimum width for a popover of "adequate size".
     * Does not alter upon rotation; popover always maintains a portrait orientation.
     */
    private static readonly minimumWidth: number = 200;
    /**
     * The minimum height for a popover of "adequate size".
     * Does not alter upon rotation; popover always maintains a portrait orientation.
     */
    private static readonly minimumHeight: number = 200;

    constructor(props: PopoverProps){
        super(props);

        // const { modalVisible = false } = props;

        this.state = {
            backdropWidth: 0,
            backdropHeight: 0,
            sourceRectX: 0,
            sourceRectY: 0,
            sourceRectWidth: 0,
            sourceRectHeight: 0,
        };
    }

    private readonly onRequestClose = () => {
        // no-op
    };

    private readonly onShow = (event: NativeSyntheticEvent<any>) => {
        // no-op
    };

    // componentDidUpdate

    // shouldComponentUpdate(nextProps: Readonly<PopoverProps>, nextState: Readonly<PopoverState>, nextContext: any): boolean {
    //     const nextModalVisible: boolean = !!nextProps.modalVisible;
    //     const currentModalVisible: boolean = !!this.props.modalVisible;

    //     if(nextModalVisible !== currentModalVisible){
    //         this.setState({ modalVisible: nextModalVisible });
    //     }

    //     return true;
    // }

    // /**
    //  * Instance method to set the visibility of the modal.
    //  * 
    //  * @param modalVisible whether the modal is visible (true) or hidden (false)
    //  * @param callback optional callback to run after setState() completes.
    //  */
    // public setVisible = (modalVisible: boolean, callback?: () => void) => {
    //     this.setState({ modalVisible }, callback);
    // };

    private readonly onLayout = (e: LayoutChangeEvent) => {
        /**
         * The "layout" event gives the latest dimensions of the backdrop, which equal those of the modal,
         * which is full-screen, and so these measurements can reflect the window dimensions.
         * 
         * We have to clone the event because events are pooled (re-used) in React.
         */
        const layout = { ...e.nativeEvent.layout };
        
        if(this.props.sourceView?.current && this.backdropRef.current){
            console.log(`[Popover.onLayout] got both refs. Measuring...`);
            /**
             * The values returned by measureInWindow give the position of the source view within the window,
             * so they are effectively relative to the dimensions of the "layout" event above.
             */
            this.props.sourceView?.current.measureInWindow(
                (x: number, y: number, width: number, height: number) => {
                    console.log(`[Popover.onLayout] measureInWindow:\n- sourceView: ${JSON.stringify({ x, y, width, height })}\n- layout: ${JSON.stringify(layout)}`);
                    this.setState({
                        backdropWidth: layout.width,
                        backdropHeight: layout.height,

                        sourceRectHeight: height,
                        sourceRectWidth: width,
                        sourceRectX: x,
                        sourceRectY: y,
                    }, () => {
                        console.log(`[Popover.onLayout] measureInWindow setState complete`);
                    });
                }
            )
        } else {
            console.log(`[Popover.onLayout] One or more refs were missing.`);
            this.setState({
                backdropWidth: layout.width,
                backdropHeight: layout.height,
            });
        }
    };

    private readonly calculatePopoverLayout = (
        arrowDirection: PopoverArrowDirection,
        safeAreaEdgeInsets: EdgeInsets,
        sourceRect: { x: number, y: number, width: number, height: number },
    ) => {
        const {
            backdropHeight,
            backdropWidth,
        } = this.state;

        console.log(`backdrop:`, { width: backdropWidth, height: backdropHeight });
        // Note: it is possible for backdrop size to briefly be (0, 0), so cater accordingly.

        /* 
         * Clip off any parts of the source rect that exit the safe area.
         * Should the rect's x-pos or y-pos exits the safe area entirely, clip to the closest safe x-pos or y-pos.
         */
        const sourcePointClipped = {
            x: Math.min(
                Math.max(sourceRect.x, safeAreaEdgeInsets.left),
                Math.max(backdropWidth - safeAreaEdgeInsets.right, safeAreaEdgeInsets.left)
            ),
            y: Math.min(
                Math.max(sourceRect.y, safeAreaEdgeInsets.top),
                Math.max(backdropHeight - safeAreaEdgeInsets.bottom, safeAreaEdgeInsets.top)
            ),
        } as const;

        const sourceRectClipped = {
            x: sourcePointClipped.x,
            y: sourcePointClipped.y,
            width: Math.max(
                Math.min(
                    sourceRect.width - Math.abs(sourcePointClipped.x - sourceRect.x),
                    backdropWidth - safeAreaEdgeInsets.left - safeAreaEdgeInsets.right
                ),
                0
            ),
            height: Math.max(
                Math.min(
                    sourceRect.height - Math.abs(sourcePointClipped.y - sourceRect.y),
                    backdropHeight - safeAreaEdgeInsets.top - safeAreaEdgeInsets.bottom
                ),
                0
            ),
        } as const;

        console.log(`sourceRectClipped:`, sourceRectClipped);

        const sourceRectClippedMidpoint = {
            x: sourcePointClipped.x + sourceRectClipped.width / 2,
            y: sourcePointClipped.y + sourceRectClipped.height / 2,
        } as const;

        if(arrowDirection === PopoverArrowDirection.down){
            // TODO: return null if unable to satisfy both minimumHeight & minimumWidth and arrow placement.

            // Remembering we're measuring from the origin point (top-left) of the arrow image, orientated as 'v'.
            const arrowPoint = {
                x: Math.max(
                    sourceRectClippedMidpoint.x - Popover.arrowBreadth / 2,
                    safeAreaEdgeInsets.left,
                ),
                y: Math.max(
                    sourceRectClipped.y - Popover.arrowLength,
                    safeAreaEdgeInsets.top,
                ),
            } as const;

            const preferredX: number = sourceRectClippedMidpoint.x - Popover.preferredWidth / 2;
            const preferredY: number = arrowPoint.y - Popover.preferredHeight;

            const popoverOrigin = {
                x: Math.max(
                    preferredX + Popover.preferredWidth <= backdropWidth - safeAreaEdgeInsets.right ?
                        preferredX :
                        backdropWidth - safeAreaEdgeInsets.right - Popover.preferredWidth,
                    safeAreaEdgeInsets.left,
                ),
                y: Math.max(
                    preferredY,
                    safeAreaEdgeInsets.top,
                ),
            };

            const popoverSize = {
                width: Math.min(
                    backdropWidth - popoverOrigin.x - safeAreaEdgeInsets.right,
                    Popover.preferredWidth,
                ),
                height: Math.min(
                    arrowPoint.y - safeAreaEdgeInsets.top,
                    Popover.preferredHeight,
                ),
            };

            return {
                arrow: {
                    ...arrowPoint,
                    width: Popover.arrowBreadth,
                    height: Popover.arrowLength,
                },
                popover: {
                    ...popoverOrigin,
                    ...popoverSize,
                },
            };

            // Given adequate horizontal space, arrow will be central to popover
            // ┌-─────────────────-┐
            // │ ┌-─-┐             │
            // │ │   │             │
            // │ └─┬─┘             │
            // │   v               │
            // │   █               │
            // │                   │
            // └───────────────────┘

            // If lacking space on one side of the horizon but having sufficient space on the other, arrow will shift
            // along the popover's bottom edge.
            // ┌-─────────────────-┐
            // │ ┌-─-┐             │
            // │ │   │             │
            // │ ├───┘             │
            // │ v                 │
            // │ █                 │
            // │                   │
            // └───────────────────┘

            // If touchpoint beyond safe area: arrow and popover will come as close as possible but not exit the safe area.
            // This makes it easy to ensure that the content within the popover will also remain within the safe area.
            // ┌-─────────────────-┐
            // │ ┌-─-┐             │
            // │ │   │             │
            // │ ├───┘             │
            // │ v                 │
            // █                   │
            // │                   │
            // └───────────────────┘
            
        } else if(arrowDirection === PopoverArrowDirection.up){ 
            //   █
            // ┌-^-┐
            // │   │
            // └───┘
            
        } else if(arrowDirection === PopoverArrowDirection.left){
            //   ┌───┐
            // █<┤   │
            //   └───┘
            
        } else if(arrowDirection === PopoverArrowDirection.right){
            //  ┌───┐
            //  │   ├>█
            //  └───┘

        }

        return null;
    };

    private readonly onBackdropPress = () => {
        if(this.props.dismissModalOnBackdropPress){
            this.props.dismissModalOnBackdropPress();
        }
    };

    render(){
        return (
            <SafeAreaConsumer>
                {(edgeInsets: EdgeInsets|null) => {
                    const {
                        permittedArrowDirections = [],
                        children,
                    } = this.props;
                    const {
                        backdropHeight,
                        backdropWidth,
                    } = this.state;

                    // ==ASSUMPTIONS==
                    // 1) We're using Modal, so the backdrop and the screen are exactly the same.
                    // 2) Thus, the screen's safe area insets equally apply to the backdrop.
                    const safeAreaWidth: number = backdropWidth - edgeInsets!.left - edgeInsets!.right;
                    const safeAreaHeight: number = backdropHeight - edgeInsets!.top - edgeInsets!.bottom;

                    // TODO: allow defining edge insets in addition to the implicit safe area insets.

                    const sourceRect = {
                        x: this.state.sourceRectX,
                        y: this.state.sourceRectY,
                        width: this.state.sourceRectWidth,
                        height: this.state.sourceRectHeight,
                    } as const;

                    console.log(`Got sourceRect`, sourceRect);

                    // TODO: strict typing
                    const popoverLayout = this.calculatePopoverLayout(
                        PopoverArrowDirection.down,
                        edgeInsets!,
                        {
                            // x: 300,
                            // y: 700,
                            // width: 40,
                            // height: 40,

                            ...sourceRect,
                        }
                    );
                    console.log(`Got popoverLayout.popover:`, popoverLayout!.popover);

                    // let arrowDirectionToUse: PopoverArrowDirection;
                    // if(permittedArrowDirections.some(dir => dir === PopoverArrowDirection.down)){
                    // }


                    return (
                        <Modal
                            animationType="fade"
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
                                    backgroundColor: "rgba(0,0,0,0.25)",
                                    width: "100%",
                                    height: "100%",
                                }}
                                onLayout={this.onLayout}
                            >
                                {/* Popover */}
                                <View
                                    style={{
                                        position: "absolute",
                                        backgroundColor: "white",
                                        borderRadius: 15,

                                        // width: this.state.backdropWidth / 2,
                                        // height: this.state.backdropHeight / 2,

                                        left: popoverLayout?.popover?.x ?? 0,
                                        top: popoverLayout?.popover?.y ?? 0,
                                        width: popoverLayout?.popover?.width ?? 0,
                                        height: popoverLayout?.popover?.height ?? 0,
                                    }}
                                >
                                    {children}
                                </View>
                                <Triangle
                                    style={{
                                        position: "absolute",

                                        left: popoverLayout?.arrow?.x ?? 0,
                                        top: popoverLayout?.arrow?.y ?? 0,
                                    }}
                                    width={popoverLayout?.arrow?.width ?? 0}
                                    height={popoverLayout?.arrow?.height ?? 0}
                                    color={"white"}
                                    direction={"down"}
                                />
                            </TouchableWithoutFeedback>
                        </Modal>
                    );
                }}
            </SafeAreaConsumer>

        );
    }
}
