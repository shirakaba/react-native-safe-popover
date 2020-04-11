import React from 'react';
import { View, Modal, NativeSyntheticEvent, LayoutChangeEvent, StyleSheet, GestureResponderEvent } from 'react-native';
import { SafeAreaProvider, SafeAreaConsumer, EdgeInsets, useSafeArea, SafeAreaContext } from 'react-native-safe-area-context';
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

interface PopoverLayout {
    arrow: {
        x: number,
        y: number,
        width: number,
        height: number,
    },
    popover: {
        x: number,
        y: number,
        width: number,
        height: number,
        borderRadii: {
            borderTopRightRadius: number,
            borderTopLeftRadius: number,
            borderBottomLeftRadius: number,
            borderBottomRightRadius: number,
        },
    },
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
    public static defaultProps = {
        popoverMinimumLayoutMargins: {
            top: 10,
            left: 10,
            right: 10,
            bottom: 10,
        },
    };

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

    private static readonly borderRadius: number = 15;
    private static readonly cornerWidth: number = Popover.borderRadius * 2;

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

    /**
     * This event races against the edgeInsets updates. I've seen edgeInsets update after this.
     */
    private readonly onLayout = (e: LayoutChangeEvent, edgeInsets: EdgeInsets) => {
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
             * 
             * BUG: If you call measureInWindow() immediately upon onLayout(), the dimensions may be off by ~25 pixels.
             * I think this is because the safe area is updating bit-by-bit upon orientation change.
             * Waiting 75 milliseconds solves this bug, but makes the popup glitchier in other use-cases.
             */
            this.props.sourceView?.current?.measureInWindow(
                (x: number, y: number, width: number, height: number) => {
                    console.log(`[Popover.onLayout] measureInWindow:\n- sourceView: ${JSON.stringify({ x, y, width, height })}\n- layout: ${JSON.stringify(layout)}\n- edgeInsets: ${JSON.stringify(edgeInsets)}`);

                    /* Need to somehow get edgeInsets */
                    // const popoverLayout = this.calculatePopoverLayout(
                    //     PopoverArrowDirection.down,
                    //     edgeInsets,
                    //     {
                    //         x,
                    //         y,
                    //         width,
                    //         height,
                    //     }
                    // );

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
            );
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
    ): PopoverLayout|null => {
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
            return this.calculatePopoverLayoutForArrowDirectionDown(sourceRectClippedMidpoint, backdropWidth, safeAreaEdgeInsets, sourceRectClipped, backdropHeight);

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
            return this.calculatePopoverLayoutForArrowDirectionUp(sourceRectClippedMidpoint, backdropWidth, safeAreaEdgeInsets, sourceRectClipped, backdropHeight);
            //   █
            // ┌-^-┐
            // │   │
            // └───┘
            
        } else if(arrowDirection === PopoverArrowDirection.left){
            //   ┌───┐
            // █<┤   │
            //   └───┘
            return this.calculatePopoverLayoutForArrowDirectionLeft(sourceRectClippedMidpoint, backdropWidth, safeAreaEdgeInsets, sourceRectClipped, backdropHeight);
        } else if(arrowDirection === PopoverArrowDirection.right){
            //  ┌───┐
            //  │   ├>█
            //  └───┘

        }

        return null;
    };

    private readonly onBackdropPress = (event: GestureResponderEvent) => {
        console.log(`[onBackdropPress]`);

        if(this.props.dismissModalOnBackdropPress){
            this.props.dismissModalOnBackdropPress();
        }
    };

    private calculatePopoverLayoutForArrowDirectionDown(
        sourceRectClippedMidpoint: { readonly x: number; readonly y: number; },
        backdropWidth: number,
        safeAreaEdgeInsets: EdgeInsets,
        sourceRectClipped: { readonly x: number; readonly y: number; readonly width: number; readonly height: number; },
        backdropHeight: number,
    ): PopoverLayout|null {
        const arrowPoint = {
            x: Math.max(
                Math.min(
                    sourceRectClippedMidpoint.x - Popover.arrowBreadth / 2,
                    backdropWidth - safeAreaEdgeInsets.right - Popover.arrowBreadth
                ),
                safeAreaEdgeInsets.left
            ),
            y: Math.max(
                Math.min(
                    sourceRectClipped.y - Popover.arrowLength,
                    backdropHeight - safeAreaEdgeInsets.bottom - Popover.arrowLength
                ),
                safeAreaEdgeInsets.top
            ),
        } as const;

        const preferredX: number = sourceRectClippedMidpoint.x - Popover.preferredWidth / 2;
        const preferredY: number = arrowPoint.y - Popover.preferredHeight;

        const popoverOrigin = {
            x: Math.max(
                preferredX + Popover.preferredWidth <= backdropWidth - safeAreaEdgeInsets.right ?
                    preferredX :
                    backdropWidth - safeAreaEdgeInsets.right - Popover.preferredWidth,
                safeAreaEdgeInsets.left
            ),
            y: Math.max(
                preferredY,
                safeAreaEdgeInsets.top
            ),
        };

        const popoverSize = {
            width: Math.min(
                backdropWidth - popoverOrigin.x - safeAreaEdgeInsets.right,
                Popover.preferredWidth
            ),
            height: Math.min(
                arrowPoint.y - safeAreaEdgeInsets.top,
                Popover.preferredHeight
            ),
        };

        const borderBottomLeftRadius: number = arrowPoint.x <= popoverOrigin.x + Popover.cornerWidth ?
            0 :
            Popover.borderRadius;
        const borderBottomRightRadius: number = arrowPoint.x >= popoverOrigin.x + popoverSize.width - Popover.cornerWidth ?
            0 :
            Popover.borderRadius;

        return {
            arrow: {
                ...arrowPoint,
                width: Popover.arrowBreadth,
                height: Popover.arrowLength,
            },
            popover: {
                ...popoverOrigin,
                ...popoverSize,
                borderRadii: {
                    borderTopRightRadius: Popover.borderRadius,
                    borderTopLeftRadius: Popover.borderRadius,
                    borderBottomLeftRadius,
                    borderBottomRightRadius,
                },
            },
        };
    }

    private calculatePopoverLayoutForArrowDirectionUp(
        sourceRectClippedMidpoint: { readonly x: number; readonly y: number; },
        backdropWidth: number,
        safeAreaEdgeInsets: EdgeInsets,
        sourceRectClipped: { readonly x: number; readonly y: number; readonly width: number; readonly height: number; },
        backdropHeight: number,
    ): PopoverLayout|null {
        const arrowPoint = {
            x: Math.max(
                Math.min(
                    sourceRectClippedMidpoint.x - Popover.arrowBreadth / 2,
                    backdropWidth - safeAreaEdgeInsets.right - Popover.arrowBreadth
                ),
                safeAreaEdgeInsets.left
            ),
            y: Math.max(
                Math.min(
                    sourceRectClipped.y + sourceRectClipped.height,
                    backdropHeight - safeAreaEdgeInsets.bottom - Popover.arrowLength
                ),
                safeAreaEdgeInsets.top
            ),
        } as const;

        const preferredX: number = sourceRectClippedMidpoint.x - Popover.preferredWidth / 2;
        const preferredY: number = arrowPoint.y + Popover.arrowLength;

        const popoverOrigin = {
            x: Math.max(
                preferredX + Popover.preferredWidth <= backdropWidth - safeAreaEdgeInsets.right ?
                    preferredX :
                    backdropWidth - safeAreaEdgeInsets.right - Popover.preferredWidth,
                safeAreaEdgeInsets.left
            ),
            y: Math.min(
                preferredY,
                backdropHeight - safeAreaEdgeInsets.bottom
            ),
        };

        const popoverSize = {
            width: Math.min(
                backdropWidth - popoverOrigin.x - safeAreaEdgeInsets.right,
                Popover.preferredWidth
            ),
            height: Math.min(
                (backdropHeight - safeAreaEdgeInsets.bottom) - preferredY,
                Popover.preferredHeight
            ),
        };

        const borderTopLeftRadius: number = arrowPoint.x <= popoverOrigin.x + Popover.cornerWidth ?
            0 :
            Popover.borderRadius;
        const borderTopRightRadius: number = arrowPoint.x >= popoverOrigin.x + popoverSize.width - Popover.cornerWidth ?
            0 :
            Popover.borderRadius;

        return {
            arrow: {
                ...arrowPoint,
                width: Popover.arrowBreadth,
                height: Popover.arrowLength,
            },
            popover: {
                ...popoverOrigin,
                ...popoverSize,
                borderRadii: {
                    borderTopRightRadius,
                    borderTopLeftRadius,
                    borderBottomLeftRadius: Popover.borderRadius,
                    borderBottomRightRadius: Popover.borderRadius,
                },
            },
        };
    }

    private calculatePopoverLayoutForArrowDirectionLeft(
        sourceRectClippedMidpoint: { readonly x: number; readonly y: number; },
        backdropWidth: number,
        safeAreaEdgeInsets: EdgeInsets,
        sourceRectClipped: { readonly x: number; readonly y: number; readonly width: number; readonly height: number; },
        backdropHeight: number,
    ): PopoverLayout|null {
        const arrowPoint = {
            x: Math.max(
                Math.min(
                    sourceRectClipped.x + sourceRectClipped.width,
                    backdropWidth - safeAreaEdgeInsets.right - Popover.arrowLength
                ),
                safeAreaEdgeInsets.left
            ),
            y: Math.max(
                Math.min(
                    sourceRectClippedMidpoint.y - Popover.arrowBreadth / 2,
                    backdropHeight - safeAreaEdgeInsets.bottom - Popover.arrowBreadth
                ),
                safeAreaEdgeInsets.top
            ),
        } as const;

        const preferredX: number = arrowPoint.x + Popover.arrowLength;
        const preferredY: number = sourceRectClippedMidpoint.y - Popover.preferredHeight / 2;

        const popoverOrigin = {
            x: Math.max(
                Math.min(preferredX, backdropWidth - safeAreaEdgeInsets.right),
                arrowPoint.x + Popover.arrowLength
            ),
            y: Math.max(
                preferredY + Popover.preferredHeight <= backdropHeight - safeAreaEdgeInsets.bottom ?
                    preferredY :
                    backdropHeight - safeAreaEdgeInsets.bottom - Popover.preferredHeight,
                safeAreaEdgeInsets.top
            ),
        };

        const popoverSize = {
            width: Math.min(
                backdropWidth - popoverOrigin.x - safeAreaEdgeInsets.right,
                Popover.preferredWidth
            ),
            height: Math.min(
                backdropHeight - safeAreaEdgeInsets.bottom - safeAreaEdgeInsets.top,
                Popover.preferredHeight
            ),
        };

        const borderTopLeftRadius: number = arrowPoint.y <= popoverOrigin.y + Popover.cornerWidth ?
            0 :
            Popover.borderRadius;
        const borderBottomLeftRadius: number = arrowPoint.y >= popoverOrigin.y + popoverSize.height - Popover.cornerWidth ?
            0 :
            Popover.borderRadius;

        return {
            arrow: {
                ...arrowPoint,
                width: Popover.arrowLength,
                height: Popover.arrowBreadth,
            },
            popover: {
                ...popoverOrigin,
                ...popoverSize,
                borderRadii: {
                    borderTopRightRadius: Popover.borderRadius,
                    borderTopLeftRadius,
                    borderBottomLeftRadius,
                    borderBottomRightRadius: Popover.borderRadius,
                },
            },
        };
    }


    private calculatePopoverLayoutForArrowDirectionRight(
        sourceRectClippedMidpoint: { readonly x: number; readonly y: number; },
        backdropWidth: number,
        safeAreaEdgeInsets: EdgeInsets,
        sourceRectClipped: { readonly x: number; readonly y: number; readonly width: number; readonly height: number; },
        backdropHeight: number,
    ): PopoverLayout|null {
        const arrowPoint = {
            x: Math.max(
                Math.min(
                    sourceRectClipped.x + sourceRectClipped.width,
                    backdropWidth - safeAreaEdgeInsets.right - Popover.arrowLength
                ),
                safeAreaEdgeInsets.left
            ),
            y: Math.max(
                Math.min(
                    sourceRectClippedMidpoint.y - Popover.arrowBreadth / 2,
                    backdropHeight - safeAreaEdgeInsets.bottom - Popover.arrowBreadth
                ),
                safeAreaEdgeInsets.top
            ),
        } as const;

        const preferredX: number = arrowPoint.x + Popover.arrowLength;
        const preferredY: number = sourceRectClippedMidpoint.y - Popover.preferredHeight / 2;

        const popoverOrigin = {
            x: Math.max(
                Math.min(preferredX, backdropWidth - safeAreaEdgeInsets.right),
                arrowPoint.x + Popover.arrowLength
            ),
            y: Math.max(
                preferredY + Popover.preferredHeight <= backdropHeight - safeAreaEdgeInsets.bottom ?
                    preferredY :
                    backdropHeight - safeAreaEdgeInsets.bottom - Popover.preferredHeight,
                safeAreaEdgeInsets.top
            ),
        };

        const popoverSize = {
            width: Math.min(
                backdropWidth - popoverOrigin.x - safeAreaEdgeInsets.right,
                Popover.preferredWidth
            ),
            height: Math.min(
                backdropHeight - safeAreaEdgeInsets.bottom - safeAreaEdgeInsets.top,
                Popover.preferredHeight
            ),
        };

        const borderTopLeftRadius: number = arrowPoint.y <= popoverOrigin.y + Popover.cornerWidth ?
            0 :
            Popover.borderRadius;
        const borderBottomLeftRadius: number = arrowPoint.y >= popoverOrigin.y + popoverSize.height - Popover.cornerWidth ?
            0 :
            Popover.borderRadius;

        return {
            arrow: {
                ...arrowPoint,
                width: Popover.arrowLength,
                height: Popover.arrowBreadth,
            },
            popover: {
                ...popoverOrigin,
                ...popoverSize,
                borderRadii: {
                    borderTopRightRadius: Popover.borderRadius,
                    borderTopLeftRadius,
                    borderBottomLeftRadius,
                    borderBottomRightRadius: Popover.borderRadius,
                },
            },
        };
    }

    render(){
        return (
            <SafeAreaConsumer>
                {(edgeInsets: EdgeInsets|null) => {
                    console.log(`[edgeInsets]`, edgeInsets);
                    const {
                        permittedArrowDirections = [],
                        children,
                        popoverMinimumLayoutMargins,
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
                        PopoverArrowDirection.left,
                        {
                            left: Math.max(edgeInsets?.left ?? 0, popoverMinimumLayoutMargins?.left ?? 0),
                            top: Math.max(edgeInsets?.top ?? 0, popoverMinimumLayoutMargins?.top ?? 0),
                            bottom: Math.max(edgeInsets?.bottom ?? 0, popoverMinimumLayoutMargins?.bottom ?? 0),
                            right: Math.max(edgeInsets?.right ?? 0, popoverMinimumLayoutMargins?.right ?? 0),
                        },
                        {
                            // x: 300,
                            // y: 700,
                            // width: 40,
                            // height: 40,

                            ...sourceRect,
                        }
                    );
                    console.log(`[POPOVER] Got popoverLayout.popover:`, popoverLayout!.popover);
                    console.log(`[ARROW  ] Got popoverLayout.arrow  :`, popoverLayout!.arrow);

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
                                onLayout={(event) => this.onLayout(event, edgeInsets!)}
                            >
                                {/* Popover */}
                                <View
                                    style={{
                                        position: "absolute",
                                        backgroundColor: "white",
                                        ...popoverLayout!.popover.borderRadii,
                                        overflow: "hidden",

                                        // width: this.state.backdropWidth / 2,
                                        // height: this.state.backdropHeight / 2,

                                        left: popoverLayout?.popover?.x ?? 0,
                                        top: popoverLayout?.popover?.y ?? 0,
                                        width: popoverLayout?.popover?.width ?? 0,
                                        height: popoverLayout?.popover?.height ?? 0,
                                    }}
                                    
                                >
                                    <TouchableWithoutFeedback
                                        style={{
                                            ...popoverLayout!.popover.borderRadii,
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

                                    left: popoverLayout?.arrow?.x ?? 0,
                                    top: popoverLayout?.arrow?.y ?? 0,
                                }}
                                width={popoverLayout?.arrow?.width ?? 0}
                                height={popoverLayout?.arrow?.height ?? 0}
                                color={"white"}
                                direction={"left"}
                            />
                        </Modal>
                    );
                }}
            </SafeAreaConsumer>

        );
    }
}
