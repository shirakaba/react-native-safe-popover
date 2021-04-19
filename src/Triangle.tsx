import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

/**
 * Type definitions for react-native-triangle 0.0.6
 * Project: https://github.com/Jpoliachik/react-native-triangle
 * Definitions by: Kyle Roach <https://github.com/iRoachie>
 * TypeScript Version: 2.2.2
 */
type TrianglePropsDirection =
    | "up"
    | "right"
    | "down"
    | "left"
    | "up-left"
    | "up-right"
    | "down-left"
    | "down-right";

interface TriangleProps {
    /**
     * Optional style to be added to style array.
     */
    style?: ViewStyle;

    /**
     * The width of the rendered triangle
     * Default value is 0
     */
    width?: number;

    /**
     * Height of the rendered triangle
     * Default value is 0
     */
    height?: number;

    /**
     * Fill color of triangle
     * Accepts color strings such as hex, literals, rgba
     *
     * Default value is 'white'
     */
    color?: string;

    /**
     * Orientation for the triangle
     * Default value is 'up'
     */
    direction?: TrianglePropsDirection;
}

/**
 * @see https://github.com/Jpoliachik/react-native-triangle
 */
export function Triangle(props: TriangleProps) {
    const _borderStyles = () => {
        if (props.direction === "up") {
            return {
                borderTopWidth: 0,
                borderRightWidth: props.width! / 2.0,
                borderBottomWidth: props.height,
                borderLeftWidth: props.width! / 2.0,
                borderTopColor: "transparent",
                borderRightColor: "transparent",
                borderBottomColor: props.color,
                borderLeftColor: "transparent",
            };
        } else if (props.direction === "right") {
            return {
                borderTopWidth: props.height! / 2.0,
                borderRightWidth: 0,
                borderBottomWidth: props.height! / 2.0,
                borderLeftWidth: props.width,
                borderTopColor: "transparent",
                borderRightColor: "transparent",
                borderBottomColor: "transparent",
                borderLeftColor: props.color,
            };
        } else if (props.direction === "down") {
            return {
                borderTopWidth: props.height,
                borderRightWidth: props.width! / 2.0,
                borderBottomWidth: 0,
                borderLeftWidth: props.width! / 2.0,
                borderTopColor: props.color,
                borderRightColor: "transparent",
                borderBottomColor: "transparent",
                borderLeftColor: "transparent",
            };
        } else if (props.direction === "left") {
            return {
                borderTopWidth: props.height! / 2.0,
                borderRightWidth: props.width,
                borderBottomWidth: props.height! / 2.0,
                borderLeftWidth: 0,
                borderTopColor: "transparent",
                borderRightColor: props.color,
                borderBottomColor: "transparent",
                borderLeftColor: "transparent",
            };
        } else if (props.direction === "up-left") {
            return {
                borderTopWidth: props.height,
                borderRightWidth: props.width,
                borderBottomWidth: 0,
                borderLeftWidth: 0,
                borderTopColor: props.color,
                borderRightColor: "transparent",
                borderBottomColor: "transparent",
                borderLeftColor: "transparent",
            };
        } else if (props.direction === "up-right") {
            return {
                borderTopWidth: 0,
                borderRightWidth: props.width,
                borderBottomWidth: props.height,
                borderLeftWidth: 0,
                borderTopColor: "transparent",
                borderRightColor: props.color,
                borderBottomColor: "transparent",
                borderLeftColor: "transparent",
            };
        } else if (props.direction === "down-left") {
            return {
                borderTopWidth: props.height,
                borderRightWidth: 0,
                borderBottomWidth: 0,
                borderLeftWidth: props.width,
                borderTopColor: "transparent",
                borderRightColor: "transparent",
                borderBottomColor: "transparent",
                borderLeftColor: props.color,
            };
        } else if (props.direction === "down-right") {
            return {
                borderTopWidth: 0,
                borderRightWidth: 0,
                borderBottomWidth: props.height,
                borderLeftWidth: props.width,
                borderTopColor: "transparent",
                borderRightColor: "transparent",
                borderBottomColor: props.color,
                borderLeftColor: "transparent",
            };
        } else {
            console.error(
                "Triangle.js wrong direction. " +
                    props.direction +
                    " is invalid. Must be one of: " +
                    [
                        "up",
                        "right",
                        "down",
                        "left",
                        "up-right",
                        "up-left",
                        "down-right",
                        "down-left",
                    ],
            );
            return {};
        }
    };

    const borderStyles = _borderStyles();
    return <View style={[styles.triangle, borderStyles, props.style]} />;
}
Triangle.defaultProps = {
    direction: "up",
    width: 0,
    height: 0,
    color: "white",
};

const styles = StyleSheet.create({
    triangle: {
        width: 0,
        height: 0,
        backgroundColor: "transparent",
        borderStyle: "solid",
    },
});
