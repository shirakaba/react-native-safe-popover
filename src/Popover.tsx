import React from 'react';
import { View, Modal, NativeSyntheticEvent, LayoutChangeEvent, StyleSheet, GestureResponderEvent } from 'react-native';
import { SafeAreaProvider, SafeAreaConsumer, EdgeInsets, useSafeArea, SafeAreaContext } from 'react-native-safe-area-context';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { Triangle } from './Triangle';

const silenceLogs: boolean = true;

function log(message?: any, ...optionalParams: any[]): void {
    if(silenceLogs){
      return;
    }
    return console.log(message, ...optionalParams);
}

/**
 * I've removed the cases 'any' and 'unknown' from the UIKit implementation.
 * @see https://developer.apple.com/documentation/uikit/uipopoverarrowdirection
 */
export enum PopoverArrowDirection {
    up,
    down,
    left,
    right,
    // any,
    // unknown,
}

interface PopoverLayout {
    arrow: {
        direction: "up"|"down"|"left"|"right"|"none",
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
    /**
     * The `animationType` prop controls how the modal animates.
     *
     * - `slide` slides in from the bottom
     * - `fade` fades into view
     * - `none` appears without an animation
     */
    animationType?: 'none' | 'slide' | 'fade';
    /** 
     * The background colour of the backdrop.
     * @default "rgba(0,0,0,0.25)"
     */
    backdropColor?: string,
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

    private readonly calculatePopoverLayout = (
        permittedArrowDirections: PopoverArrowDirection[],
        safeAreaEdgeInsets: EdgeInsets,
        sourceRect: { x: number, y: number, width: number, height: number },
    ): PopoverLayout => {
        const {
            backdropHeight,
            backdropWidth,
        } = this.state;

        log(`backdrop:`, { width: backdropWidth, height: backdropHeight });
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

        log(`sourceRectClipped:`, sourceRectClipped);

        const sourceRectClippedMidpoint = {
            x: sourcePointClipped.x + sourceRectClipped.width / 2,
            y: sourcePointClipped.y + sourceRectClipped.height / 2,
        } as const;

        const permutations = {
            down: this.calculatePopoverLayoutForArrowDirectionDown(sourceRectClippedMidpoint, backdropWidth, safeAreaEdgeInsets, sourceRectClipped, backdropHeight),
            up: this.calculatePopoverLayoutForArrowDirectionUp(sourceRectClippedMidpoint, backdropWidth, safeAreaEdgeInsets, sourceRectClipped, backdropHeight),
            left: this.calculatePopoverLayoutForArrowDirectionLeft(sourceRectClippedMidpoint, backdropWidth, safeAreaEdgeInsets, sourceRectClipped, backdropHeight),
            right: this.calculatePopoverLayoutForArrowDirectionRight(sourceRectClippedMidpoint, backdropWidth, safeAreaEdgeInsets, sourceRectClipped, backdropHeight),
        } as const;

        const layouts = [];
        for(let i = 0; i < permittedArrowDirections.length; i++){
            const permittedDirection: PopoverArrowDirection = permittedArrowDirections[i];

            let layout: PopoverLayout|null = null;
            switch(permittedDirection){
                case PopoverArrowDirection.down:
                    layout = permutations.down;
                    break;
                case PopoverArrowDirection.up:
                    layout = permutations.up;
                    break;
                case PopoverArrowDirection.left:
                    layout = permutations.left;
                    break;
                case PopoverArrowDirection.right:
                    layout = permutations.right;
                    break;
            }
            if(layout === null){
                continue;
            }
            if(layout.popover.height === Popover.preferredHeight && layout.popover.width === Popover.preferredWidth){
                // First layout in priority order to satisfy constraints completely, so can bail out.
                return layout;
            }
            layouts.push(layout);
        }

        /* Note that Array.prototype.sort() mutates the array itself. */
        layouts.sort(this.sortLayoutsByArea);

        if(layouts.length !== 0){
            return layouts[0];
        }

        /* Now we fall back to non-preferred directions. This might be undesirable, but likely better than showing nothing at all. */
        const nonPreferredLayouts = Object.keys(permutations)
        .map(directionName => permutations[directionName as keyof typeof permutations])
        .filter(layout => layout !== null)
        .sort(this.sortLayoutsByArea as any);

        if(nonPreferredLayouts.length > 0){
            return nonPreferredLayouts[0]!;
        }

        return this.calculatePopoverLayoutForArrowDirectionNone(sourceRectClippedMidpoint, backdropWidth, safeAreaEdgeInsets, sourceRectClipped, backdropHeight);
    };

    private sortLayoutsByArea(a: PopoverLayout, b: PopoverLayout){
        /**
         * Sort in descending order of area, e.g. to produce: [123, 456]
         * If any two layouts are found to have exactly the same area, then they'll be left in-place (still in preference order).
         */
        return b.popover.height * b.popover.width - a.popover.height * a.popover.width;
    }

    private readonly onBackdropPress = (event: GestureResponderEvent) => {
        log(`[onBackdropPress]`);

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
                direction: "down",
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
                direction: "up",
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
                direction: "left",
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
            x: Math.min(
                Math.max(
                    safeAreaEdgeInsets.left,
                    sourceRectClipped.x - Popover.arrowLength,
                ),
                backdropWidth - safeAreaEdgeInsets.right - Popover.arrowLength
            ),
            y: Math.max(
                Math.min(
                    sourceRectClippedMidpoint.y - Popover.arrowBreadth / 2,
                    backdropHeight - safeAreaEdgeInsets.bottom - Popover.arrowBreadth
                ),
                safeAreaEdgeInsets.top
            ),
        } as const;

        const preferredX: number = arrowPoint.x - Popover.preferredWidth;
        const preferredY: number = sourceRectClippedMidpoint.y - Popover.preferredHeight / 2;

        log(`[DEBUG] safeAreaEdgeInsets`, safeAreaEdgeInsets);

        const popoverOrigin = {
            x: Math.min(
                Math.max(safeAreaEdgeInsets.left, preferredX),
                arrowPoint.x
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
                arrowPoint.x - safeAreaEdgeInsets.left,
                backdropWidth - popoverOrigin.x - safeAreaEdgeInsets.right,
                Popover.preferredWidth
            ),
            height: Math.min(
                backdropHeight - safeAreaEdgeInsets.bottom - safeAreaEdgeInsets.top,
                Popover.preferredHeight
            ),
        };

        const borderTopRightRadius: number = arrowPoint.y <= popoverOrigin.y + Popover.cornerWidth ?
            0 :
            Popover.borderRadius;
        const borderBottomRightRadius: number = arrowPoint.y >= popoverOrigin.y + popoverSize.height - Popover.cornerWidth ?
            0 :
            Popover.borderRadius;

        return {
            arrow: {
                direction: "right",
                ...arrowPoint,
                width: Popover.arrowLength,
                height: Popover.arrowBreadth,
            },
            popover: {
                ...popoverOrigin,
                ...popoverSize,
                borderRadii: {
                    borderTopRightRadius,
                    borderTopLeftRadius: Popover.borderRadius,
                    borderBottomLeftRadius: Popover.borderRadius,
                    borderBottomRightRadius,
                },
            },
        };
    }

    private calculatePopoverLayoutForArrowDirectionNone(
        sourceRectClippedMidpoint: { readonly x: number; readonly y: number; },
        backdropWidth: number,
        safeAreaEdgeInsets: EdgeInsets,
        sourceRectClipped: { readonly x: number; readonly y: number; readonly width: number; readonly height: number; },
        backdropHeight: number,
    ): PopoverLayout {
        const arrowPoint = {
            x: 0,
            y: 0,
        } as const;

        const preferredX: number = sourceRectClippedMidpoint.x - Popover.preferredWidth / 2;
        const preferredY: number = sourceRectClippedMidpoint.y - Popover.preferredHeight / 2;

        log(`[DEBUG] safeAreaEdgeInsets`, safeAreaEdgeInsets);

        const popoverOrigin = {
            x: Math.min(
                Math.max(
                    preferredX + Popover.preferredWidth <= backdropWidth - safeAreaEdgeInsets.right ? 
                        preferredX :
                        backdropWidth - safeAreaEdgeInsets.right - Popover.preferredWidth,
                    safeAreaEdgeInsets.left
                ),
                backdropWidth - safeAreaEdgeInsets.right
            ),
            y: Math.min(
                Math.max(
                    preferredY + Popover.preferredHeight <= backdropHeight - safeAreaEdgeInsets.bottom ? 
                        preferredY :
                        backdropHeight - safeAreaEdgeInsets.bottom - Popover.preferredHeight,
                    safeAreaEdgeInsets.top
                ),
                backdropHeight - safeAreaEdgeInsets.top
            )
        };

        const popoverSize = {
            width: Math.min(
                backdropWidth - safeAreaEdgeInsets.right - popoverOrigin.x,
                Popover.preferredWidth
            ),
            height: Math.min(
                backdropHeight - safeAreaEdgeInsets.bottom - popoverOrigin.y,
                Popover.preferredHeight
            ),
        };

        return {
            arrow: {
                direction: "none",
                ...arrowPoint,
                width: 0,
                height: 0,
            },
            popover: {
                ...popoverOrigin,
                ...popoverSize,
                borderRadii: {
                    borderTopRightRadius: Popover.borderRadius,
                    borderTopLeftRadius: Popover.borderRadius,
                    borderBottomLeftRadius: Popover.borderRadius,
                    borderBottomRightRadius: Popover.borderRadius,
                },
            },
        };
    }

    render(){
        return (
            <SafeAreaConsumer>
                {(edgeInsets: EdgeInsets|null) => {
                    log(`[edgeInsets]`, edgeInsets);
                    const {
                        permittedArrowDirections,
                        children,
                        popoverMinimumLayoutMargins,
                    } = this.props;
                    log(`[DEBUG] popoverMinimumLayoutMargins`, popoverMinimumLayoutMargins);
                    const {
                        backdropHeight,
                        backdropWidth,
                    } = this.state;

                    /* ==ASSUMPTIONS==
                     * 1) We're using Modal, so the backdrop and the screen are exactly the same.
                     * 2) Thus, the screen's safe area insets equally apply to the backdrop. */
                    // const safeAreaWidth: number = backdropWidth - edgeInsets!.left - edgeInsets!.right;
                    // const safeAreaHeight: number = backdropHeight - edgeInsets!.top - edgeInsets!.bottom;

                    const sourceRect = {
                        x: this.props.sourceRectX,
                        y: this.props.sourceRectY,
                        width: this.props.sourceRectWidth,
                        height: this.props.sourceRectHeight,
                    } as const;

                    log(`Got sourceRect`, sourceRect);

                    // FIXME: handle null case
                    const popoverLayout = this.calculatePopoverLayout(
                        permittedArrowDirections!,
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
                    log(`[POPOVER] Got popoverLayout.popover:`, popoverLayout.popover);
                    log(`[ARROW  ] Got popoverLayout.arrow  :`, popoverLayout.arrow);

                    // let arrowDirectionToUse: PopoverArrowDirection;
                    // if(permittedArrowDirections.some(dir => dir === PopoverArrowDirection.down)){
                    // }


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
                                        backgroundColor: "white",
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
                                color={"white"}
                                direction={popoverLayout.arrow.direction === "none" ? "down" : popoverLayout.arrow.direction}
                            />
                        </Modal>
                    );
                }}
            </SafeAreaConsumer>

        );
    }
}
