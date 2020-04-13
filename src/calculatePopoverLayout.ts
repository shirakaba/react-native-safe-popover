import { EdgeInsets } from 'react-native-safe-area-context';
import { PopoverArrowDirection } from './arrowDirection';

const silenceLogs: boolean = true;

function log(message?: any, ...optionalParams: any[]): void {
    if(silenceLogs){
      return;
    }
    return console.log(message, ...optionalParams);
}

export interface PopoverLayout {
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

interface CalculatePopoverLayoutParams {
    permittedArrowDirections: PopoverArrowDirection[],
    safeAreaEdgeInsets: EdgeInsets,
    sourceRect: { x: number, y: number, width: number, height: number },
    backdropHeight: number,
    backdropWidth: number,
    preferredHeight: number,
    preferredWidth: number,
    arrowBreadth: number,
    arrowLength: number,
    cornerWidth: number,
    borderRadius: number,
}

interface CalculatePopoverLayoutForArrowDirectionParams {
    sourceRectClippedMidpoint: { readonly x: number; readonly y: number; },
    backdropWidth: number,
    safeAreaEdgeInsets: EdgeInsets,
    sourceRectClipped: { readonly x: number; readonly y: number; readonly width: number; readonly height: number; },
    backdropHeight: number,
    preferredHeight: number,
    preferredWidth: number,
    arrowBreadth: number,
    arrowLength: number,
    cornerWidth: number,
    borderRadius: number,
}

/** 
 * ==ASSUMPTIONS==
 * 1) We're using Modal, so the backdrop and screen dimensions are exactly the same.
 * 2) Thus, the screen's safe area insets equally apply to the backdrop.
 */
export function calculatePopoverLayout({
    permittedArrowDirections,
    safeAreaEdgeInsets,
    sourceRect,
    backdropHeight,
    backdropWidth,
    preferredHeight,
    preferredWidth,
    arrowBreadth,
    arrowLength,
    cornerWidth,
    borderRadius,
}: CalculatePopoverLayoutParams): PopoverLayout 
{

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

    const params: CalculatePopoverLayoutForArrowDirectionParams = {
        sourceRectClippedMidpoint,
        backdropWidth,
        safeAreaEdgeInsets,
        sourceRectClipped,
        backdropHeight,
        preferredHeight,
        preferredWidth,
        arrowBreadth,
        arrowLength,
        cornerWidth,
        borderRadius,
    };

    const permutations = {
        down: calculatePopoverLayoutForArrowDirectionDown(params),
        up: calculatePopoverLayoutForArrowDirectionUp(params),
        left: calculatePopoverLayoutForArrowDirectionLeft(params),
        right: calculatePopoverLayoutForArrowDirectionRight(params),
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
        if(layout.popover.height === preferredHeight && layout.popover.width === preferredWidth){
            // First layout in priority order to satisfy constraints completely, so can bail out.
            return layout;
        }
        layouts.push(layout);
    }

    /* Note that Array.prototype.sort() mutates the array itself. */
    layouts.sort(sortLayoutsByArea);

    if(layouts.length !== 0){
        return layouts[0];
    }

    /* Now we fall back to non-preferred directions. This might be undesirable, but likely better than showing nothing at all. */
    const nonPreferredLayouts = Object.keys(permutations)
    .map(directionName => permutations[directionName as keyof typeof permutations])
    .filter(layout => layout !== null)
    .sort(sortLayoutsByArea as any);

    if(nonPreferredLayouts.length > 0){
        return nonPreferredLayouts[0]!;
    }

    return calculatePopoverLayoutForArrowDirectionNone(params);
};

function sortLayoutsByArea(a: PopoverLayout, b: PopoverLayout){
    /**
     * Sort in descending order of area, e.g. to produce: [123, 456]
     * If any two layouts are found to have exactly the same area, then they'll be left in-place (still in preference order).
     */
    return b.popover.height * b.popover.width - a.popover.height * a.popover.width;
}

function calculatePopoverLayoutForArrowDirectionDown({
    sourceRectClippedMidpoint,
    backdropWidth,
    safeAreaEdgeInsets,
    sourceRectClipped,
    backdropHeight,

    preferredWidth,
    preferredHeight,
    arrowBreadth,
    arrowLength,
    cornerWidth,
    borderRadius,
}: CalculatePopoverLayoutForArrowDirectionParams): PopoverLayout|null
{
    const arrowPoint = {
        x: Math.max(
            Math.min(
                sourceRectClippedMidpoint.x - arrowBreadth / 2,
                backdropWidth - safeAreaEdgeInsets.right - arrowBreadth
            ),
            safeAreaEdgeInsets.left
        ),
        y: Math.max(
            Math.min(
                sourceRectClipped.y - arrowLength,
                backdropHeight - safeAreaEdgeInsets.bottom - arrowLength
            ),
            safeAreaEdgeInsets.top
        ),
    } as const;

    const preferredX: number = sourceRectClippedMidpoint.x - preferredWidth / 2;
    const preferredY: number = arrowPoint.y - preferredHeight;

    const popoverOrigin = {
        x: Math.max(
            preferredX + preferredWidth <= backdropWidth - safeAreaEdgeInsets.right ?
                preferredX :
                backdropWidth - safeAreaEdgeInsets.right - preferredWidth,
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
            preferredWidth
        ),
        height: Math.min(
            arrowPoint.y - safeAreaEdgeInsets.top,
            preferredHeight
        ),
    };

    const borderBottomLeftRadius: number = arrowPoint.x <= popoverOrigin.x + cornerWidth ?
        0 :
        borderRadius;
    const borderBottomRightRadius: number = arrowPoint.x >= popoverOrigin.x + popoverSize.width - cornerWidth ?
        0 :
        borderRadius;

    return {
        arrow: {
            direction: "down",
            ...arrowPoint,
            width: arrowBreadth,
            height: arrowLength,
        },
        popover: {
            ...popoverOrigin,
            ...popoverSize,
            borderRadii: {
                borderTopRightRadius: borderRadius,
                borderTopLeftRadius: borderRadius,
                borderBottomLeftRadius,
                borderBottomRightRadius,
            },
        },
    };
}

function calculatePopoverLayoutForArrowDirectionUp({
    sourceRectClippedMidpoint,
    backdropWidth,
    safeAreaEdgeInsets,
    sourceRectClipped,
    backdropHeight,

    preferredWidth,
    preferredHeight,
    arrowBreadth,
    arrowLength,
    cornerWidth,
    borderRadius,
}: CalculatePopoverLayoutForArrowDirectionParams): PopoverLayout|null
{
    const arrowPoint = {
        x: Math.max(
            Math.min(
                sourceRectClippedMidpoint.x - arrowBreadth / 2,
                backdropWidth - safeAreaEdgeInsets.right - arrowBreadth
            ),
            safeAreaEdgeInsets.left
        ),
        y: Math.max(
            Math.min(
                sourceRectClipped.y + sourceRectClipped.height,
                backdropHeight - safeAreaEdgeInsets.bottom - arrowLength
            ),
            safeAreaEdgeInsets.top
        ),
    } as const;

    const preferredX: number = sourceRectClippedMidpoint.x - preferredWidth / 2;
    const preferredY: number = arrowPoint.y + arrowLength;

    const popoverOrigin = {
        x: Math.max(
            preferredX + preferredWidth <= backdropWidth - safeAreaEdgeInsets.right ?
                preferredX :
                backdropWidth - safeAreaEdgeInsets.right - preferredWidth,
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
            preferredWidth
        ),
        height: Math.min(
            (backdropHeight - safeAreaEdgeInsets.bottom) - preferredY,
            preferredHeight
        ),
    };

    const borderTopLeftRadius: number = arrowPoint.x <= popoverOrigin.x + cornerWidth ?
        0 :
        borderRadius;
    const borderTopRightRadius: number = arrowPoint.x >= popoverOrigin.x + popoverSize.width - cornerWidth ?
        0 :
        borderRadius;

    return {
        arrow: {
            direction: "up",
            ...arrowPoint,
            width: arrowBreadth,
            height: arrowLength,
        },
        popover: {
            ...popoverOrigin,
            ...popoverSize,
            borderRadii: {
                borderTopRightRadius,
                borderTopLeftRadius,
                borderBottomLeftRadius: borderRadius,
                borderBottomRightRadius: borderRadius,
            },
        },
    };
}

function calculatePopoverLayoutForArrowDirectionLeft({
    sourceRectClippedMidpoint,
    backdropWidth,
    safeAreaEdgeInsets,
    sourceRectClipped,
    backdropHeight,

    preferredWidth,
    preferredHeight,
    arrowBreadth,
    arrowLength,
    cornerWidth,
    borderRadius,
}: CalculatePopoverLayoutForArrowDirectionParams): PopoverLayout|null
{
    const arrowPoint = {
        x: Math.max(
            Math.min(
                sourceRectClipped.x + sourceRectClipped.width,
                backdropWidth - safeAreaEdgeInsets.right - arrowLength
            ),
            safeAreaEdgeInsets.left
        ),
        y: Math.max(
            Math.min(
                sourceRectClippedMidpoint.y - arrowBreadth / 2,
                backdropHeight - safeAreaEdgeInsets.bottom - arrowBreadth
            ),
            safeAreaEdgeInsets.top
        ),
    } as const;

    const preferredX: number = arrowPoint.x + arrowLength;
    const preferredY: number = sourceRectClippedMidpoint.y - preferredHeight / 2;

    const popoverOrigin = {
        x: Math.max(
            Math.min(preferredX, backdropWidth - safeAreaEdgeInsets.right),
            arrowPoint.x + arrowLength
        ),
        y: Math.max(
            preferredY + preferredHeight <= backdropHeight - safeAreaEdgeInsets.bottom ?
                preferredY :
                backdropHeight - safeAreaEdgeInsets.bottom - preferredHeight,
            safeAreaEdgeInsets.top
        ),
    };

    const popoverSize = {
        width: Math.min(
            backdropWidth - popoverOrigin.x - safeAreaEdgeInsets.right,
            preferredWidth
        ),
        height: Math.min(
            backdropHeight - safeAreaEdgeInsets.bottom - safeAreaEdgeInsets.top,
            preferredHeight
        ),
    };

    const borderTopLeftRadius: number = arrowPoint.y <= popoverOrigin.y + cornerWidth ?
        0 :
        borderRadius;
    const borderBottomLeftRadius: number = arrowPoint.y >= popoverOrigin.y + popoverSize.height - cornerWidth ?
        0 :
        borderRadius;

    return {
        arrow: {
            direction: "left",
            ...arrowPoint,
            width: arrowLength,
            height: arrowBreadth,
        },
        popover: {
            ...popoverOrigin,
            ...popoverSize,
            borderRadii: {
                borderTopRightRadius: borderRadius,
                borderTopLeftRadius,
                borderBottomLeftRadius,
                borderBottomRightRadius: borderRadius,
            },
        },
    };
}

function calculatePopoverLayoutForArrowDirectionRight({
    sourceRectClippedMidpoint,
    backdropWidth,
    safeAreaEdgeInsets,
    sourceRectClipped,
    backdropHeight,

    preferredWidth,
    preferredHeight,
    arrowBreadth,
    arrowLength,
    cornerWidth,
    borderRadius,
}: CalculatePopoverLayoutForArrowDirectionParams): PopoverLayout|null
{
    const arrowPoint = {
        x: Math.min(
            Math.max(
                safeAreaEdgeInsets.left,
                sourceRectClipped.x - arrowLength,
            ),
            backdropWidth - safeAreaEdgeInsets.right - arrowLength
        ),
        y: Math.max(
            Math.min(
                sourceRectClippedMidpoint.y - arrowBreadth / 2,
                backdropHeight - safeAreaEdgeInsets.bottom - arrowBreadth
            ),
            safeAreaEdgeInsets.top
        ),
    } as const;

    const preferredX: number = arrowPoint.x - preferredWidth;
    const preferredY: number = sourceRectClippedMidpoint.y - preferredHeight / 2;

    log(`[DEBUG] safeAreaEdgeInsets`, safeAreaEdgeInsets);

    const popoverOrigin = {
        x: Math.min(
            Math.max(safeAreaEdgeInsets.left, preferredX),
            arrowPoint.x
        ),
        y: Math.max(
            preferredY + preferredHeight <= backdropHeight - safeAreaEdgeInsets.bottom ?
                preferredY :
                backdropHeight - safeAreaEdgeInsets.bottom - preferredHeight,
            safeAreaEdgeInsets.top
        ),
    };

    const popoverSize = {
        width: Math.min(
            arrowPoint.x - safeAreaEdgeInsets.left,
            backdropWidth - popoverOrigin.x - safeAreaEdgeInsets.right,
            preferredWidth
        ),
        height: Math.min(
            backdropHeight - safeAreaEdgeInsets.bottom - safeAreaEdgeInsets.top,
            preferredHeight
        ),
    };

    const borderTopRightRadius: number = arrowPoint.y <= popoverOrigin.y + cornerWidth ?
        0 :
        borderRadius;
    const borderBottomRightRadius: number = arrowPoint.y >= popoverOrigin.y + popoverSize.height - cornerWidth ?
        0 :
        borderRadius;

    return {
        arrow: {
            direction: "right",
            ...arrowPoint,
            width: arrowLength,
            height: arrowBreadth,
        },
        popover: {
            ...popoverOrigin,
            ...popoverSize,
            borderRadii: {
                borderTopRightRadius,
                borderTopLeftRadius: borderRadius,
                borderBottomLeftRadius: borderRadius,
                borderBottomRightRadius,
            },
        },
    };
}

function calculatePopoverLayoutForArrowDirectionNone({
    sourceRectClippedMidpoint,
    backdropWidth,
    safeAreaEdgeInsets,
    sourceRectClipped,
    backdropHeight,

    preferredWidth,
    preferredHeight,
    arrowBreadth,
    arrowLength,
    cornerWidth,
    borderRadius,
}: CalculatePopoverLayoutForArrowDirectionParams): PopoverLayout
{
    const arrowPoint = {
        x: 0,
        y: 0,
    } as const;

    const preferredX: number = sourceRectClippedMidpoint.x - preferredWidth / 2;
    const preferredY: number = sourceRectClippedMidpoint.y - preferredHeight / 2;

    log(`[DEBUG] safeAreaEdgeInsets`, safeAreaEdgeInsets);

    const popoverOrigin = {
        x: Math.min(
            Math.max(
                preferredX + preferredWidth <= backdropWidth - safeAreaEdgeInsets.right ? 
                    preferredX :
                    backdropWidth - safeAreaEdgeInsets.right - preferredWidth,
                safeAreaEdgeInsets.left
            ),
            backdropWidth - safeAreaEdgeInsets.right
        ),
        y: Math.min(
            Math.max(
                preferredY + preferredHeight <= backdropHeight - safeAreaEdgeInsets.bottom ? 
                    preferredY :
                    backdropHeight - safeAreaEdgeInsets.bottom - preferredHeight,
                safeAreaEdgeInsets.top
            ),
            backdropHeight - safeAreaEdgeInsets.top
        )
    };

    const popoverSize = {
        width: Math.min(
            backdropWidth - safeAreaEdgeInsets.right - popoverOrigin.x,
            preferredWidth
        ),
        height: Math.min(
            backdropHeight - safeAreaEdgeInsets.bottom - popoverOrigin.y,
            preferredHeight
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
                borderTopRightRadius: borderRadius,
                borderTopLeftRadius: borderRadius,
                borderBottomLeftRadius: borderRadius,
                borderBottomRightRadius: borderRadius,
            },
        },
    };
}
